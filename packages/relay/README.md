# Fireblocks Recovery Relay

[Recovery Utility](../app/) is intended to be run on an offline, air-gapped machine. It uses a companion web app, [Recovery Relay](./), to check wallet balances and initiate transactions from recovered wallets. The withdrawal process is as follows:

1. The user opens the withdrawal window from Recovery Utility.
2. Recovery Utility generates a cryptographically-secure encryption PIN and [a unique Recovery Relay URL](../app/renderer/lib/relayUrl.ts) with hash parameters containing the wallet's address and AES-encrypted private key.
3. The user scans the Recovery Relay URL QR code from an internet-connected device.
4. On the internet-connected device, the user fills out transaction details, then enters the encryption PIN to decrypt the wallet's private key and create/sign a transaction. All transaction logic is performed in the browser and then broadcast via RPC to a blockchain node. **Recovery Relay does not send any private key materials to a server.**

Recovery Relay, like Recovery Utility, is built with [React](https://reactjs.org/) on the [Next.js](https://nextjs.org/) framework, using [Material UI](https://mui.com/material-ui/getting-started/overview/) components. It can be hosted on any static file server, and Fireblocks maintains an instance hosted on Vercel at [fbrelay.app](https://fbrelay.app). Users can set a custom Recovery Relay URL in Recovery Utility's settings, after recovering their private keys.

## Getting Started

First, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy Recovery Relay is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
