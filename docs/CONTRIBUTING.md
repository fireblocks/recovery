# 🔨 Contributing

This repository contains two applications ([Recovery Utility](../packages/app/) and [Recovery Relay](../packages/relay/)) and two internal dependencies ([Key Recovery and Derivation Server](../packages/server/) and [shared frontend components and utilities](../packages/shared/)). [Recovery Utility](../packages/app/) is a cross-platform [Electron](https://www.electronjs.org/) app compiled for macOS, Windows, and Linux. Its window UI, along with Recovery Relay, are built with [React](https://reactjs.org/) on the [Next.js](https://nextjs.org/) framework, using [Material UI](https://mui.com/material-ui/getting-started/overview/) components.

[Recovery Utility](../packages/app/) includes the compiled [Key Recovery and Derivation Server](../server) in its [contents](https://www.electron.build/configuration/contents.html#extrafiles), spawns it as a child process, and interfaces with it using HTTP requests to restore a workspace's extended private/public keys and to derive wallets' addresses and their private/public keys.

[Recovery Utility](../packages/app/) is intended to be run on an offline, air-gapped machine. It uses a companion web app, [Recovery Relay](../packages/relay/), to check wallet balances and initiate transactions from recovered wallets. The withdrawal process is as follows:

1. The user opens the withdrawal window from Recovery Utility.
2. Recovery Utility generates a cryptographically-secure encryption PIN and [a unique Recovery Relay URL](../packages/app/renderer/lib/relayUrl.ts) with hash parameters containing the wallet's address and AES-encrypted private key.
3. The user scans the Recovery Relay URL QR code from an internet-connected device.
4. On the internet-connected device, the user fills out transaction details, then enters the encryption PIN to decrypt the wallet's private key and create/sign a transaction. All transaction logic is performed in the browser and then broadcast via RPC to a blockchain node. **Recovery Relay does not send any private key materials to a server.**

Recovery Relay can be hosted on any static file server, and Fireblocks maintains an instance hosted on Vercel at [relay.fireblocks.solutions](https://relay.fireblocks.solutions). Users can set a custom Recovery Relay URL in Recovery Utility's settings, after recovering their private keys.

## Packages

This project is a monorepo using [Yarn workspaces](https://classic.yarnpkg.com/lang/en/docs/workspaces/) for package and JavaScript dependency management and [Turborepo](https://turbo.build/repo) for running development and build scripts.

Check out the README for each package:

- [**`packages/app/`**](../packages/app/): Recovery Utility: desktop app (Electron + Next.js)
- [**`packages/relay/`**](../packages/relay/): Recovery Relay: browser-based transaction client (Next.js)
- [**`packages/server/`**](../packages/server/): Key Recovery and Derivation Server (compiled Python)
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
   ./packages/server/res/setup.sh
   ```

## Development Scripts

### Develop

Run all `dev` scripts. This starts Recovery Utility (which spawns the Python server) and Recovery Relay in development mode.

```
yarn dev
```

### Build

Run all `build` scripts. Build Recovery Utility, the Python Key Recovery and Derivation server, and Recovery Relay for production. Recovery Utility and the server are compiled only for the development machine's architecture.

```
yarn build
```

## Remote Caching

Turborepo can use a technique known as [Remote Caching](https://turborepo.org/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup), then enter the following commands:

```
npx turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your turborepo:

```
npx turbo link
```
