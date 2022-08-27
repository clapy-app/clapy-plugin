import type { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import axios from 'axios';
import type { CodeDict } from '../export-code/code.model.js';
import { isBinaryUrl } from '../export-code/create-ts-compiler/9-to-csb-files.js';

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
}

export function fetchUser(context: GHContext) {
  const { octokit } = context;
  return octokit.request('/user');
}

export async function listRepos(
  context: GHContext,
): Promise<RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data']> {
  const { octokit } = context;
  return (
    await octokit.repos.listForAuthenticatedUser({
      visibility: 'all',
      per_page: 100,
    })
  ).data;
}

export async function listBranches(context: GHContext) {
  const { octokit } = context;
  return (
    await octokit.repos.listBranches({
      owner: 'clapy-app',
      repo: 'clapy-plugin',
    })
  ).data;
}

// {
//   name: 'next',
//   commit: {
//     sha: 'b1a5835d26ec75bc901bd9d8cd28ffaf783a20d1',
//     url: 'https://api.github.com/repos/clapy-app/clapy-plugin/commits/b1a5835d26ec75bc901bd9d8cd28ffaf783a20d1'
//   },
//   protected: false
// },

export async function createBranch(context: GHContext, branch: string) {
  const { octokit } = context;
  return (
    await octokit.git.createRef({
      ref: `refs/heads/${branch}`,
      sha: 'b1a5835d26ec75bc901bd9d8cd28ffaf783a20d1',
      owner: 'clapy-app',
      repo: 'clapy-plugin',
    })
  ).data;
}

// {
//   ref: 'refs/heads/gencode',
//   node_id: 'REF_kwDOGqk757JyZWZzL2hlYWRzL2dlbmNvZGU',
//   url: 'https://api.github.com/repos/clapy-app/clapy-plugin/git/refs/heads/gencode',
//   object: {
//     sha: 'b1a5835d26ec75bc901bd9d8cd28ffaf783a20d1',
//     type: 'commit',
//     url: 'https://api.github.com/repos/clapy-app/clapy-plugin/git/commits/b1a5835d26ec75bc901bd9d8cd28ffaf783a20d1'
//   }
// }

export async function getCommit(context: GHContext) {
  const { octokit } = context;
  const commitSha = 'b1a5835d26ec75bc901bd9d8cd28ffaf783a20d1';
  return (
    await octokit.git.getCommit({
      owner: 'clapy-app',
      repo: 'clapy-plugin',
      commit_sha: commitSha,
    })
  ).data;
}

export async function commitChanges(context: GHContext, files: CodeDict, message: string) {
  const owner = 'clapy-app';
  const repo = 'clapy-plugin';
  const mainBranch = 'next';
  const clapyBranch = 'gencode';
  const branchCommitSha = 'b1a5835d26ec75bc901bd9d8cd28ffaf783a20d1';
  const branchTreeSha = '0c4b34c0e85d97c99d36c61ee3b419cd948608cf';

  // octokit.git.createBlob({});
  // const branchRef = octokit.git.getRef({
  //   owner,
  //   repo,
  //   ref: `heads/${clapyBranch}`,
  // });
  // {
  //   ref: 'refs/heads/gencode',
  //   node_id: 'REF_kwDOGqk757JyZWZzL2hlYWRzL2dlbmNvZGU',
  //   url: 'https://api.github.com/repos/clapy-app/clapy-plugin/git/refs/heads/gencode',
  //   object: {
  //     sha: 'b1a5835d26ec75bc901bd9d8cd28ffaf783a20d1',
  //     type: 'commit',
  //     url: 'https://api.github.com/repos/clapy-app/clapy-plugin/git/commits/b1a5835d26ec75bc901bd9d8cd28ffaf783a20d1'
  //   }
  // }

  // const commitSha = 'b1a5835d26ec75bc901bd9d8cd28ffaf783a20d1'; /* refData.object.sha */
  // return octokit.git.getCommit({
  //   owner,
  //   repo,
  //   commit_sha: commitSha,
  // });
  // {
  //   sha: 'b1a5835d26ec75bc901bd9d8cd28ffaf783a20d1',
  //   node_id: 'C_kwDOGqk759oAKGIxYTU4MzVkMjZlYzc1YmM5MDFiZDlkOGNkMjhmZmFmNzgzYTIwZDE',
  //   url: 'https://api.github.com/repos/clapy-app/clapy-plugin/git/commits/b1a5835d26ec75bc901bd9d8cd28ffaf783a20d1',
  //   html_url: 'https://github.com/clapy-app/clapy-plugin/commit/b1a5835d26ec75bc901bd9d8cd28ffaf783a20d1',
  //   author: {
  //     name: 'Kherbache Yacine',
  //     email: '38230283+Yaci016@users.noreply.github.com',
  //     date: '2022-08-25T13:15:36Z'
  //   },
  //   committer: {
  //     name: 'GitHub',
  //     email: 'noreply@github.com',
  //     date: '2022-08-25T13:15:36Z'
  //   },
  //   tree: {
  //     sha: '0c4b34c0e85d97c99d36c61ee3b419cd948608cf',
  //     url: 'https://api.github.com/repos/clapy-app/clapy-plugin/git/trees/0c4b34c0e85d97c99d36c61ee3b419cd948608cf'
  //   },
  //   message: 'feat: Increase base quota from 3 to 10 (#229)\n' +
  //     '\n' +
  //     'Co-authored-by: YacineKherbache <yacine@clapy.co>',
  //   parents: [
  //     {
  //       sha: '5adee7abe478ad9369f7e56fc6d4389c117e2cfd',
  //       url: 'https://api.github.com/repos/clapy-app/clapy-plugin/git/commits/5adee7abe478ad9369f7e56fc6d4389c117e2cfd',
  //       html_url: 'https://github.com/clapy-app/clapy-plugin/commit/5adee7abe478ad9369f7e56fc6d4389c117e2cfd'
  //     }
  //   ],
  //   verification: {
  //     verified: true,
  //     reason: 'valid',
  //     signature: '-----BEGIN PGP SIGNATURE-----\n' +
  //       '\n' +
  //       'wsBcBAABCAAQBQJjB3X4CRBK7hj4Ov3rIwAAqIcIAEwCn7BodF/Twh7e5tD4aZ4l\n' +
  //       'OS7UWKWXPuBysXZZ03dvtUGShcWZMKQkQmQ2Ok/jmMXWvHGJePVAvGwkQ+Uq4OLb\n' +
  //       'S9S5q8sKwOfdvGj46S4PBZd7p5WDgwVO8EFC+DlQRRN0IhTb0LC/Zjla6fhjn0Bi\n' +
  //       'W89d37zRmW5Vhbi6BHESmuJ5yegF5Mxo4IlcXTJV8q6wkvFx1Wi8gIOiaYZr5jbM\n' +
  //       'NEIsFVXL1wQFL+N0PrAHxHiPBseWuej1zgmyBXSpwBkZl3FJEzQ9qBmGxeFc/Wlb\n' +
  //       'sfat+/fW0djfYlkg7sm4iKCrxBxIeQU0PzlVWnzGzeSQ3d8H+giq9Gq/2cxRKPk=\n' +
  //       '=bY+K\n' +
  //       '-----END PGP SIGNATURE-----\n',
  //     payload: 'tree 0c4b34c0e85d97c99d36c61ee3b419cd948608cf\n' +
  //       'parent 5adee7abe478ad9369f7e56fc6d4389c117e2cfd\n' +
  //       'author Kherbache Yacine <38230283+Yaci016@users.noreply.github.com> 1661433336 +0200\n' +
  //       'committer GitHub <noreply@github.com> 1661433336 +0200\n' +
  //       '\n' +
  //       'feat: Increase base quota from 3 to 10 (#229)\n' +
  //       '\n' +
  //       'Co-authored-by: YacineKherbache <yacine@clapy.co>'
  //   }
  // }

  ////////
  // TODO
  // Remonter à partir de ce qui est nécessaire pour valider le commit.
  //

  const treeItems /* : GitTree */ = await codeDictToTree(context, owner, repo, files);

  const newCommitTree = await createNewTree(
    context,
    owner,
    repo,
    treeItems,
    branchCommitSha /* Or branchTreeSha? No idea */,
  );
  const newCommitTreeSha = newCommitTree.sha;
  const commit = await createCommit(context, owner, repo, message, newCommitTreeSha, branchCommitSha);
  const commitSha = commit.sha;
  /* const pushRes = */ await setBranchToCommit(context, commitSha);
  // const prCheckRes = await getPullRequestForBranches(context, owner, repo, clapyBranch, mainBranch);
  const prRes = await getOrCreatePullRequest(context, owner, repo, clapyBranch, mainBranch);
  return prRes;
}

async function codeDictToTree(context: GHContext, owner: string, repo: string, files: CodeDict) {
  const promises /* : Promise<GitTreeItem>[] */ = Object.entries(files).map(async ([path, content]) => {
    if (!content) {
      throw new Error(`No file content provided for ${path}`);
    }
    let treeItem: GitTreeItem;
    if (isBinaryUrl(content)) {
      const { data } = await axios.get(content, { responseType: 'arraybuffer' });
      const contentBase64 = Buffer.from(data, 'binary').toString('base64');
      const blob = await createBlobBase64(context, owner, repo, contentBase64);
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
        // type: 'blob',
        content,
      };
    }
    return treeItem;

    // const fileSha = await createBlob(octokit, owner, repo, contents, type);
  });
  const res: GitTree = await Promise.all(promises);
  return res;
  // for (const [path, content] of Object.entries(files)) {
  // }
}

async function createBlobBase64(context: GHContext, owner: string, repo: string, content: string /* , type: string */) {
  const { octokit } = context;

  // let encoding: 'base64' | 'utf-8';
  // if (isBinaryUrl(content)) {
  //   const { data } = await axios.get(content, { responseType: 'arraybuffer' });
  //   content = Buffer.from(data, 'binary').toString('base64');
  //   encoding = 'base64';
  // } else {
  //   encoding = 'utf-8';
  // }

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

// function blobsToTree(blobs: GitBlob[], paths: string[]) {
//   return blobs.map(
//     ({ sha }, index) =>
//       ({
//         path: paths[index],
//         mode: `100644`,
//         type: `blob`,
//         sha,
//       } as RestEndpointMethodTypes['git']['createTree']['parameters']['tree'][number]),
//   ) as GitTree;
// }

// If having issues with a too large commit, see this comment to split (e.g. download files one by one):
// https://github.com/octokit/octokit.net/issues/1610#issuecomment-944429985
async function createNewTree(context: GHContext, owner: string, repo: string, tree: GitTree, parentTreeSha: string) {
  const { octokit } = context;
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

async function createCommit(
  context: GHContext,
  owner: string,
  repo: string,
  // committer: Committer,
  // author,
  message: string,
  newCommitTreeSha: string,
  parentCommitSha: string,
) {
  const { octokit } = context;
  return (
    await octokit.rest.git.createCommit({
      owner,
      repo,
      message,
      // committer,
      // author,
      tree: newCommitTreeSha,
      parents: [parentCommitSha],
    })
  ).data;
}

async function setBranchToCommit(context: GHContext, commitSha: string) {
  const { octokit } = context;
  return (
    await octokit.git.updateRef({
      // The documentation clearly states it should be prefixed with 'refs/', but it seems wrong for updateRef.
      // It works only without the prefix.
      // On the other side, createRef needs the 'refs/' prefix.
      ref: 'heads/gencode',
      sha: commitSha,
      owner: 'clapy-app',
      repo: 'clapy-plugin',
      force: true,
    })
  ).data;
}

async function getPullRequestForBranches(
  context: GHContext,
  owner: string,
  repo: string,
  clapyBranch: string,
  mainBranch: string,
) {
  const { octokit } = context;
  const res = (
    await octokit.rest.pulls.list({
      owner,
      repo,
      head: `${owner}:${clapyBranch}`,
      base: mainBranch,
    })
  ).data;
  if (res.length >= 2) {
    console.log(res);
    throw new Error(
      `BUG more than 2 pull requests are found on github with base branch \`${mainBranch}\` and head branch \`${clapyBranch}\``,
    );
  }
  return res[0];
}

async function getOrCreatePullRequest(
  context: GHContext,
  owner: string,
  repo: string,
  clapyBranch: string,
  mainBranch: string,
) {
  const { octokit } = context;
  const branch = await getPullRequestForBranches(context, owner, repo, clapyBranch, mainBranch);
  if (branch) {
    return branch;
  }
  return (
    await octokit.rest.pulls.create({
      owner,
      repo,
      head: clapyBranch,
      base: mainBranch,
      title: `Clapy PR - ${new Date().toISOString().slice(0, 10)} - ${new Date().toISOString().slice(11, 19)}`,
    })
  ).data;
}

// async function createRepo(octo: Octokit, org: string, name: string) {
//   await octo.repos.createInOrg({ org, name, auto_init: true });
// }
