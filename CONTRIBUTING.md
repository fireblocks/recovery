# Contributing

Contributing to the Fireblocks Recovery Utility is highly encouraged and appreciated!

## Always Remember

**NEVER** provide any sort of information from your recovery kit, recovery kit keys, ip addresses or any other confidential data when opening an issue.
No member of Fireblocks will ask for such information of you, and in the event we would like to reach out outside of Github we will request that you speak with your Account manager or Customer Success Manager

## How to open issues

We have setup issue templates for your convenience, please use them so that we can better understand what the issue is and how to best assist you.
Feature requests are welcome however we can't commit to any features.

## Versions, Pull requests & Commits

### Versions

We work in a versioned branch approach, so each new version has it's own dedicated branch, which will be deleted some time after the version has been released.

### Pull requests

We have setup pull request templates for your convenience, please use them for bug fixes. Note that version pull requests are only done by Fireblocks members and any pull request from a non-fireblocks member will be closed without review.

To open a bugfix pull request, use the following URL template:
https://github.com/fireblocks/recovery/compare/<base-branch>...<username>:recovery:<branch>?template=bug_fix_pull_request.md

Where:

- `base-branch` is some open version branch (_vX.Y.Z_)
- `username` is your username
- `branch` is the branch name in your fork. We recommend creating a branch in the following format: _vX.Y.Z-<FIX>_ where `FIX` is some short word aobut the bug fix (for example btc-sign-tx, evm-derivation, etc...)

### Commits

When creating a fix to be pulled, before actually committing the changes to your branch, make sure to always run `yarn changeset`.
Once ran you will be presented with several prompts, just follow the on screen instructions.
For more information about this please see the [changesets repo](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md).

Lastly, we try to enforce [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) - please try to use it.
For VSCode we suggest the extension [Conventional Commits](https://marketplace.visualstudio.com/items?itemName=vivaxy.vscode-conventional-commits).

## Styling

Note that we are still improving and changing the styling and thus there might be changes or requests as part of pull requests concerning styles.
We provide a quick summary of styling we want code to use as part of the repo, please make sure to use this when creating pull requests;

1. File names:
   1. For assets - name the containing folder as the asset's ID / symbol (Ethereum = ETH, Bitcoin = BTC, etc...), the main file will be `index.ts`
   2. For files that contain TSX - file name must be `<NAME>.tsx`
   3. For library functions - file name must be `<EXPALANTION>.ts`, so if the file handles CSV operations - `csv.ts`, if it gets logs, `getLogs.ts`, etc...
2. Function and variable names should use camelCase
3. Arrow functions of one line should not use brackets:

```javascript
const exampleBad = () => {
  return false;
};

const exampleGood = () => true;
```

4. Try to make the code as readable and clean as possible
5. For state variables, please use `useWrappedState<T>(variableName, defaultValue, sanatize)` instead of react's `useState` for traceability. `variableName` is the name of the variable, `defaultValue` is the default value and `sanatize` is a boolean value to indicate whether this should be sanatized before printing.

## Questions?

If you have any questions about contributing please create an issue with the `question` tag and we'll do our best to answer it!
