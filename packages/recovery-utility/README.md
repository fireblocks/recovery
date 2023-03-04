# Fireblocks Recovery Utility

Fireblocks Recovery Utility is a desktop app for Fireblocks hard key recovery setup, enabling you to recover Fireblocks assets and keys in a disaster, verify a Recovery Kit, or generate keys to set up a new Recovery Kit.

It is a cross-platform [Electron](https://www.electronjs.org/) app for macOS, Windows, and Linux. The window UI is built with [React](https://reactjs.org/) on the [Next.js](https://nextjs.org/) framework, using [Material UI](https://mui.com/material-ui/getting-started/overview/) components.

[Recovery Utility](../app/) includes the compiled [Key Recovery and Derivation Server](../server/) in its [contents](https://www.electron.build/configuration/contents.html#extrafiles), spawns it as a child process, and interfaces with it using HTTP requests.

## Build Process

Using Turborepo, the [Key Recovery and Derivation Server](../server/) is first compiled to an executable for the development machine's architecture. Then Recovery Utility's renderer process (the Next.js frontend) is transpiled to static HTML/JS/CSS. Finally, the renderer and server are bundled with the Electron main process into an application bundle for the development machine's architecture.

Cross-compilation is not supported. We use GitHub Actions with a matrix job to compile Recovery Utility for each supported architecture (masOS, Windows, and Linux).

## Security

The Electron main process disallows opening or redirecting to external URLs and disables Chrome permission requests (e.g. webcam access, clipboard reading). No external content is loaded.
