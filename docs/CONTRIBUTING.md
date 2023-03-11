# 🔨 Development

This repository contains a collection of TypeScript/Python apps and packages to:

- Generate an RSA private/public keypair for creating a new Recovery Kit
- Recover extended private/public keys from a Recovery Kit ZIP file, an RSA key, and a Fireblocks workspace owner's mobile recovery passphrase
- Derive wallet keys and addresses from extended private/public keys
- Query wallet balances and perform withdrawals from recovered cold wallets without exposing private keys

[Recovery Utility](../apps/recovery-utility/) is intended to be run on an offline, air-gapped machine. It is a cross-platform [Electron](https://www.electronjs.org/) app compiled for macOS, Windows, and Linux. Its window UI, along with Recovery Relay, are built with [React](https://reactjs.org/) on the [Next.js](https://nextjs.org/) framework, using [Material UI](https://mui.com/material-ui/getting-started/overview/) components. It uses a companion web app, [Recovery Relay](../apps/recovery-relay/), to check wallet balances and initiate transactions from recovered wallets.

[Recovery Utility](../apps/recovery-utility/) includes the compiled [@fireblocks/extended-key-recovery](../packages/extended-key-recovery) module in its [contents](https://www.electron.build/configuration/contents.html#extrafiles) and spawns it as a child process to restore a workspace's extended private/public keys. Both [Recovery Utility](../apps/recovery-utility/) and [Recovery Relay](../apps/recovery-relay/) use [@fireblocks/wallet-derivation](../packages/wallet-derivation/) to derive wallets' addresses and their private/public keys.

Recovery Relay can be hosted on any static file server, and Fireblocks maintains an instance hosted on Vercel at [relay.fireblocks.solutions](https://relay.fireblocks.solutions). Users can set a custom Recovery Relay URL in Recovery Utility's settings, after recovering their extended private keys.

## Packages

This project is a monorepo using [Yarn workspaces](https://classic.yarnpkg.com/lang/en/docs/workspaces/) for package and JavaScript dependency management and [Turborepo](https://turbo.build/repo) for running development and build scripts.

Check out the README for each package:

- [**`apps/recovery-utility/`**](../apps/recovery-utility/): Recovery Utility: desktop app (Electron + Next.js)
- [**`apps/recovery-relay/`**](../apps/recovery-relay/): Recovery Relay: browser-based transaction client (Next.js)
- [**`packages/extended-key-recovery/`**](../packages/extended-key-recovery/): Extended Key Recovery module (Python)
- [**`packages/wallet-derivation`**](../packages/wallet-derivation/): Wallet derivation from extended keys (TypeScript)
- [**`packages/shared/`**](../packages/shared/): Shared frontend components and utilities (TypeScript)

## Prerequisites

- **Node.js** version ≥16.15.0: You may use [**nvm**](https://github.com/nvm-sh/nvm) to quickly install the supported version of Node.js by running `nvm use .` within this repository.
- [**Python 3**](https://www.python.org/downloads/)
- [**Visual Studio Code**](https://code.visualstudio.com/): This project contains [VS Code extension recommendations](.vscode/extensions.json) which assist with code linting and formatting.

## Development Tools

- [**Turborepo**](https://turbo.build/repo) for a build system
- [**TypeScript**](https://www.typescriptlang.org/) for static type checking
- [**ESLint**](https://eslint.org/) for TypeScript linting
- [**Prettier**](https://prettier.io) for TypeScript/Markdown formatting
- [**Black**](https://github.com/psf/black) for Python formatting
- [**EditorConfig**](https://editorconfig.org/) for IDE standardization
- [**Commitlint**](https://commitlint.js.org/) to enforce [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- [**Changesets**](https://github.com/changesets/changesets) for versioning and changelogs
- [**Husky**](https://github.com/typicode/husky) and [**lint-staged**](https://github.com/okonet/lint-staged) for Git hooks

## Development Setup

1. Obtain a hard key recovery ZIP, RSA private key (with passphrase), and Fireblocks mobile app passphrase.
2. After installing the prerequisite software, install Node.js and Python dependencies:

   ```sh
   yarn install
   ```

3. To enable the build process, which fetches the latest supported assets from Fireblocks, copy [`packages/asset-config/.env.example`](../packages/asset-config/.env.example) to a new `.env` file and replace the `FIREBLOCKS_API_KEY` and `FIREBLOCKS_API_PRIVATE_KEY` environment variables. These should also be set in CI/CD.

## Development Scripts

### Develop

Run all `dev` scripts. This starts Recovery Utility and Recovery Relay in development mode.

```sh
yarn dev
```

### Test

Run all `test` scripts. Currently this only runs unit tests for [@fireblocks/wallet-derivation](../packages/wallet-derivation/).

```sh
yarn test
```

### Lint

Run ESLint and PyLint to check for code formatting errors.

```sh
yarn lint
```

### Build

Run all `build` scripts. Build Recovery Utility, the Python Extended Key Recovery module, and Recovery Relay for production. Recovery Utility and the Extended Key Recovery module are compiled only for the current development machine's architecture.

Be sure to set the `FIREBLOCKS_API_KEY` and `FIREBLOCKS_API_PRIVATE_KEY` environment variables to enable fetching the latest supported assets from Fireblocks.

To code sign and notarize the app, [`scripts/build.sh`](../scripts/build.sh) contains a template for filling in required environment variables. Duplicate the file to `scripts/build.local.sh` and fill out these variables in this new file, which will be ignored by Git.

```sh
yarn build
```

## Remote Caching

Turborepo can use a technique known as [Remote Caching](https://turborepo.org/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup), then enter the following commands:

```sh
npx turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your turborepo:

```sh
npx turbo link
```
