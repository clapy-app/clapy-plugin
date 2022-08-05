module.exports = {
  root: true,
  env: {
    node: true,
    jest: true,
    es2021: true,
  },
  // 'plugin:prettier/recommended' must be last
  extends: ['plugin:prettier/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import', 'unused-imports'],
  rules: {
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
    'unused-imports/no-unused-imports': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',

    'import/extensions': ['error', 'always'],
    'import/no-unresolved': 'off',
  },
};
