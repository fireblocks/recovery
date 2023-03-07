/** @type {import('@typescript-eslint/utils').TSESLint.Linter.Config} */
module.exports = {
  root: true,
  extends: ["custom"],
  parserOptions: {
    project: "./tsconfig.json",
  },
  rules: {
    "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
  },
};
