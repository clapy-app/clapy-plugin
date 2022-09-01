import type { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import axios from 'axios';
import type { CsbDict, ProjectContext } from '../export-code/code.model.js';
import { getComponentsDirPath } from '../export-code/gen-node-utils/3-gen-comp-utils.js';
import type { AccessTokenDecoded } from '../user/user.utils.js';
import { getOctokit } from './octokit.js';

// Good sources of inspiration:
// https://github.com/mheap/octokit-commit-multiple-files/blob/main/create-or-update-files.js
// https://dev.to/lucis/how-to-push-files-programatically-to-a-repository-using-octokit-with-typescript-1nj0
// Github API doc: https://docs.github.com/en/rest/git/commits
// Octokit doc: https://octokit.github.io/rest.js/v18#git-create-ref

// An example of equivalent directly using the REST API: https://stackoverflow.com/questions/11801983/how-to-create-a-commit-and-push-into-repo-with-github-api-v3/63461333#63461333
// But not sure I want to move to the REST API. I would loose the typings.

export interface GHContext {
  auth0UserId: string;
  accessToken: string;
  octokit: Octokit;
  owner?: string;
  repo?: string;
  codegenBranch?: string;
  mergeToBranch?: string;
}

export function fetchUser(context: GHContext) {
  const { octokit } = context;
  return octokit.request('/user');
}

export async function listRepos(
  context: GHContext,
): Promise<RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data']> {
  const { octokit } = context;
  const resp = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
    visibility: 'all',
    sort: 'updated',
  });
  return resp;
  // The normal way to load a single page.
  // Issue: we need to handle pagination. The total number of pages can be deduced from a special header containing "links", that we need to parse to have the page number.
  // const resp2 = await octokit.repos.listForAuthenticatedUser({
  //   visibility: 'all',
  //   per_page: 10,
  //   sort: 'updated',
  // });
  // return resp.data;
}

// export async function searchRepos(
//   context: GHContext,
// ): Promise<RestEndpointMethodTypes['search']['repos']['response']['data']> {
//   const { octokit } = context;
//   return (
//     await octokit.search.repos({
//       q: 'user:antoineol org:clapy-app',
//       per_page: 100,
//     })
//   ).data;
// }

export async function listBranches(context: GHContext) {
  const { octokit, owner, repo } = context;
  if (!owner) throw new Error(`BUG Missing owner in GHContext`);
  if (!repo) throw new Error(`BUG Missing repo in GHContext`);
  return (
    await octokit.repos.listBranches({
      owner,
      repo,
    })
  ).data;
}

// export async function createBranch(context: GHContext, branch: string) {
//   const { octokit } = context;
//   return (
//     await octokit.git.createRef({
//       ref: `refs/heads/${branch}`,
//       sha: 'b1a5835d26ec75bc901bd9d8cd28ffaf783a20d1',
//       owner: 'clapy-app',
//       repo: 'clapy-plugin',
//     })
//   ).data;
// }

export interface GitHubResponse {
  url: string;
}

export async function sendCodeToGithub(
  projectContext: ProjectContext,
  githubAccessToken: string | undefined,
  user: AccessTokenDecoded,
  files: CsbDict,
) {
  if (!githubAccessToken) throw new Error('BUG Missing `githubAccessToken` to send code to github.');
  const auth0UserId = user.sub;
  const { githubSettings } = projectContext.extraConfig;
  if (!githubSettings) throw new Error('BUG Missing `githubSettings` to send code to github.');
  const { repository, codegenBranch, mergeToBranch } = githubSettings;
  if (!repository) throw new Error('BUG Missing `repository` to send code to github.');
  const { owner, repo } = repository;
  if (!owner) throw new Error('Missing `owner` in body, cannot generate code.');
  if (!repo) throw new Error('Missing `repo` in body, cannot generate code.');
  if (!codegenBranch) throw new Error('Missing `codegenBranch` in body, cannot generate code.');
  if (!mergeToBranch) throw new Error('Missing `mergeToBranch` in body, cannot generate code.');

  const octokit = getOctokit(githubAccessToken);
  const ghContext: GHContext = {
    accessToken: githubAccessToken,
    auth0UserId,
    octokit,
    owner,
    repo,
    codegenBranch,
    mergeToBranch,
  };

  const githubResp = await commitChanges(projectContext, ghContext, files);
  const res: GitHubResponse = { url: githubResp.html_url };
  return res;
}

export async function commitChanges(projectContext: ProjectContext, ghContext: GHContext, files: CsbDict) {
  const message = 'Clapy generated code 2';

  const branchCommitSha = await getBranchCommitSha(ghContext);

  const treeItems = await codeDictToTree(projectContext, ghContext, files);

  const newCommitTree = await createNewTree(ghContext, treeItems, branchCommitSha);
  const newCommitTreeSha = newCommitTree.sha;
  const commit = await createCommit(ghContext, message, newCommitTreeSha, branchCommitSha);
  const commitSha = commit.sha;
  await setBranchToCommit(ghContext, commitSha);
  const prRes = await getOrCreatePullRequest(ghContext);
  return prRes;
}

async function getBranchCommitSha(context: GHContext) {
  const { octokit, owner, repo, mergeToBranch } = context;
  if (!owner) throw new Error(`BUG Missing owner in GHContext`);
  if (!repo) throw new Error(`BUG Missing repo in GHContext`);

  return (
    await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${mergeToBranch}`,
    })
  ).data.object.sha;
}

async function codeDictToTree(projectContext: ProjectContext, ghContext: GHContext, files: CsbDict) {
  const { fwConnector } = projectContext;
  const compDirPath = getComponentsDirPath(projectContext);
  const allowedPathPrefixes = [compDirPath, fwConnector.assetsResourceDir];
  const promises = Object.entries(files)
    .filter(([path, _]) => allowedPathPrefixes.some(allowedPrefix => path.startsWith(allowedPrefix)))
    .map(async ([path, { content, isBinary }]) => {
      content = content || '';
      let treeItem: GitTreeItem;
      if (isBinary) {
        if (!content) {
          throw new Error(`No file content provided for binary ${path}`);
        }
        const { data } = await axios.get(content, { responseType: 'arraybuffer' });
        const contentBase64 = Buffer.from(data, 'binary').toString('base64');
        const blob = await createBlobBase64(ghContext, contentBase64);
        treeItem = {
          path: path,
          mode: '100644',
          type: 'blob',
          sha: blob,
        };
      } else {
        treeItem = {
          path: path,
          mode: '100644',
          content,
        };
      }
      return treeItem;
    });
  const res: GitTree = await Promise.all(promises);
  return res;
}

async function createBlobBase64(context: GHContext, content: string /* , type: string */) {
  const { octokit, owner, repo } = context;
  if (!owner) throw new Error(`BUG Missing owner in GHContext`);
  if (!repo) throw new Error(`BUG Missing repo in GHContext`);

  const file = (
    await octokit.rest.git.createBlob({
      owner,
      repo,
      content,
      encoding: 'base64',
    })
  ).data;
  return file.sha;
}

// If having issues with a too large commit, see this comment to split (e.g. download files one by one):
// https://github.com/octokit/octokit.net/issues/1610#issuecomment-944429985
async function createNewTree(context: GHContext, tree: GitTree, parentTreeSha: string) {
  const { octokit, owner, repo } = context;
  if (!owner) throw new Error(`BUG Missing owner in GHContext`);
  if (!repo) throw new Error(`BUG Missing repo in GHContext`);
  const { data } = await octokit.git.createTree({
    owner,
    repo,
    tree,
    base_tree: parentTreeSha,
  });
  return data;
}

type GitTree = RestEndpointMethodTypes['git']['createTree']['parameters']['tree'];
type GitTreeItem = GitTree[number];
type GitBlob = RestEndpointMethodTypes['git']['createBlob']['response']['data'];
// type Committer = RestEndpointMethodTypes['git']['createCommit']['parameters']['committer'];

async function createCommit(context: GHContext, message: string, newCommitTreeSha: string, parentCommitSha: string) {
  const { octokit, owner, repo } = context;
  if (!owner) throw new Error(`BUG Missing owner in GHContext`);
  if (!repo) throw new Error(`BUG Missing repo in GHContext`);
  return (
    await octokit.rest.git.createCommit({
      owner,
      repo,
      message,
      tree: newCommitTreeSha,
      parents: [parentCommitSha],
    })
  ).data;
}

async function setBranchToCommit(context: GHContext, commitSha: string) {
  const { octokit } = context;
  return (
    await octokit.git.updateRef({
      // Contrary to what the TSDoc says, updateRef should NOT prefix `ref` with 'refs/'. But createRef should.
      ref: 'heads/gencode',
      sha: commitSha,
      owner: 'clapy-app',
      repo: 'clapy-plugin',
      force: true,
    })
  ).data;
}

async function getPullRequestForBranches(context: GHContext) {
  const { octokit, owner, repo, codegenBranch, mergeToBranch } = context;
  if (!owner) throw new Error(`BUG Missing owner in GHContext`);
  if (!repo) throw new Error(`BUG Missing repo in GHContext`);
  if (!codegenBranch) throw new Error(`BUG Missing codegenBranch in GHContext`);
  if (!mergeToBranch) throw new Error(`BUG Missing mergeToBranch in GHContext`);
  const res = (
    await octokit.rest.pulls.list({
      owner,
      repo,
      head: `${owner}:${codegenBranch}`,
      base: mergeToBranch,
    })
  ).data;
  if (res.length >= 2) {
    console.log(res);
    throw new Error(
      `BUG more than 2 pull requests are found on github with base branch \`${mergeToBranch}\` and head branch \`${codegenBranch}\``,
    );
  }
  return res[0];
}

async function getOrCreatePullRequest(context: GHContext) {
  const { octokit, owner, repo, codegenBranch, mergeToBranch } = context;
  if (!owner) throw new Error(`BUG Missing owner in GHContext`);
  if (!repo) throw new Error(`BUG Missing repo in GHContext`);
  if (!codegenBranch) throw new Error(`BUG Missing codegenBranch in GHContext`);
  if (!mergeToBranch) throw new Error(`BUG Missing mergeToBranch in GHContext`);
  const branch = await getPullRequestForBranches(context);
  if (branch) {
    return branch;
  }
  return (
    await octokit.rest.pulls.create({
      owner,
      repo,
      head: codegenBranch,
      base: mergeToBranch,
      title: `Clapy PR - ${new Date().toISOString().slice(0, 10)} - ${new Date().toISOString().slice(11, 19)}`,
    })
  ).data;
}

// async function createRepo(octo: Octokit, org: string, name: string) {
//   await octo.repos.createInOrg({ org, name, auto_init: true });
// }
