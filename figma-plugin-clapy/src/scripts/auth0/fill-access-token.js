const namespace = 'https://clapy.co';

/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  if (event.authorization) {
    api.accessToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
  }
  // const { user } = event;
  // const [firstName, lastName] = getFirstLastName(user);
  // api.accessToken.setCustomClaim(`${namespace}/firstName`, firstName);
  // api.accessToken.setCustomClaim(`${namespace}/lastName`, lastName);
};

/**
 * @param {Types.User} user
 */
function getFirstLastName(user) {
  try {
    let [firstName, lastName] = [user.given_name, user.family_name];
    if (!firstName && !lastName) {
      [firstName, lastName] = splitName(removeSuffix(user.name));
    }
    if (!firstName && !lastName) {
      [firstName, lastName] = [user.nickname || removeSuffix(user.email) || '', ''];
    }
    return [firstName, lastName];
  } catch (err) {
    return ['', ''];
  }
}

/**
 * @param {string | undefined} name
 */
function splitName(name) {
  if (!name) return [name, ''];
  const i = name.indexOf(' ');
  if (i === -1) return [name, ''];
  return [name.substring(0, i), name.substring(i + 1)];
}

/**
 * @param {string | undefined} name
 */
function removeSuffix(name) {
  if (!name) return name;
  for (const separator of ['@']) {
    const i = name.indexOf(separator);
    if (i !== -1) {
      name = name.substring(0, i);
    }
  }
  return name;
}

/**
 * Handler that will be invoked when this action is resuming after an external redirect. If your
 * onExecutePostLogin function does not perform a redirect, this function can be safely ignored.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
// exports.onContinuePostLogin = async (event, api) => {
// };

////////////////////////////
////////////////////////////

const user = {
  email: 'j+smith@example.com',
  family_name: 'Smith',
  given_name: 'John',
  name: 'j+smith@example.com',
  nickname: 'j+smith',
};
// const [firstName, lastName] = getFirstLastName();
// console.log([firstName, lastName]);
const commands = [];
exports
  .onExecutePostLogin(
    { user, authorization: { roles: [] } },
    {
      accessToken: {
        setCustomClaim: (name, value) => {
          commands.push({ name, target: 'accessToken', type: 'SetCustomClaim', value });
        },
      },
    },
  )
  .then(() => console.log(commands));
