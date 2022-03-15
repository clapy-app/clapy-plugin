import { generateTypes } from '../core/hasura-schema.utils';

// Run it from the host machine, not inside docker. This script needs to access the backend and plugin project directories.
(async () => {
  try {
    // TODO should use graphql-cli instead and watch schema changes to generate the typings.
    // https://stackoverflow.com/a/42010467/4053349
    // Ideally, generating types should happen directly on each change on Hasura, especially
    // if we use the same DB and hasura instance for multiple projects.
    // For now, let's say each project is responsible for generating its types.

    // Alternatively, I can have a look at Apollo doc, codegen section:
    // https://www.apollographql.com/docs/react/development-testing/developer-tooling/
    await generateTypes();
  } catch (error) {
    console.error(error);
  }
})();
