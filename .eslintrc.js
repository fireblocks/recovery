/** @type {import('@typescript-eslint/utils').TSESLint.Linter.Config} */
module.exports = {
  root: true,
  extends: ['custom'],
  settings: {
    next: {
      rootDir: ['apps/recovery-utility', 'apps/recovery-relay/renderer'],
    },
  },
};
