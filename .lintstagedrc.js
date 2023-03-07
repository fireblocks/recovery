const path = require("path");

const format = "prettier --write";

const lintJs = (filenames) =>
  `next lint --fix --file ${filenames
    .map((filename) => path.relative(process.cwd(), filename))
    .join(" --file ")}`;

module.exports = {
  // "*.py": ["python -m black"],
  "*.{js,jsx,ts,tsx}": [format /* lintJs */],
  "*.{md,xml,yml}": [format],
};
