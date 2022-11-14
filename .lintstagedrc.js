const path = require('path')

const format = 'prettier --write'

const lintJs = filenames =>
  `next lint --fix --file ${filenames
    .map(filename => path.relative(process.cwd(), filename))
    .join(' --file ')}`

module.exports = {
  '*.{js,jsx,ts,tsx}': [format /* lintJs */],
  '*.{css,scss,sass,md,xml}': [format]
}
