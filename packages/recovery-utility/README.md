# Fireblocks Recovery Utility

Fireblocks Recovery Utility is a desktop app for Fireblocks hard key recovery setup, enabling you to recover Fireblocks assets and keys in a disaster, verify a Recovery Kit, or generate keys to set up a new Recovery Kit.

It is a cross-platform [Electron](https://www.electronjs.org/) app for macOS, Windows, and Linux. The window UI is built with [React](https://reactjs.org/) on the [Next.js](https://nextjs.org/) framework, using [Material UI](https://mui.com/material-ui/getting-started/overview/) components.

[Recovery Utility](../recovery-utility/) includes the compiled [Extended Key Recovery module](../extended-key-recovery/) in its [contents](https://www.electron.build/configuration/contents.html#extrafiles) and spawns it as a child process to restore a workspace's extended private/public keys.

## Build Process

Using Turborepo, the [Extended Key Recovery module](../extended-key-recovery/) is first compiled to an executable for the development machine's architecture. Then Recovery Utility's renderer process (the Next.js frontend) is transpiled to static HTML/JS/CSS. Finally, the renderer and EKR module are bundled with the Electron main process into an application bundle for the development machine's architecture.

Cross-compilation is not supported. We use GitHub Actions with a matrix job to compile Recovery Utility for each supported architecture (masOS, Windows, and Linux).

## Security

The Electron main process disallows opening or redirecting to external URLs and disables Chrome permission requests (e.g. webcam access, clipboard reading). No external content is loaded.
