# Contributing

Contributing to the Fireblocks Recovery Utility is highly encouraged and appreciated!

## Always Remember

**NEVER** provide any sort of information from your recovery kit, recovery kit keys, ip addresses or any other confidential data when opening an issue.
No member of Fireblocks will ask for such information of you, and in the event we would like to reach out outside of Github we will request that you speak with your Account manager or Customer Success Manager

## How to open issues

We have setup issue templates for your convenience, please use them so that we can better understand what the issue is and how to best assist you.
Feature requests are welcome however we can't commit to any features.

## How to open pull requests

We have setup pull request templates for your convenience, please use them for bug fixese. Note that version pull requests are only done by Fireblocks members and any pull request from a non-fireblocks member will be closed without review.

## Styling

Note that we are still improving and changing the styling and thus there might be changes or requests as part of pull requests concerning styles.
We provide a quick summary of styling we want code to use as part of the repo, please make sure to use this when creating pull requests;

1. File names:
   1. For assets - name the containing folder as the asset's ID / symbol (Ethereum = ETH, Bitcoin = BTC, etc...), the main file will be `index.ts`
   2. For files that contain TSX - file name must be `<NAME>.tsx`
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
