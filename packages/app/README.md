# Fireblocks Recovery Utility

Fireblocks Recovery Utility is a desktop app for Fireblocks hard key recovery setup, enabling you to recover Fireblocks assets and keys in a disaster, verify a Recovery Kit, or generate keys to set up a new Recovery Kit.

It is a cross-platform [Electron](https://www.electronjs.org/) app for macOS, Windows, and Linux. The web UI is built with [React](https://reactjs.org/) on the [Next.js](https://nextjs.org/) framework, using [Material UI](https://mui.com/material-ui/getting-started/overview/) components.

Recovery Utility includes the compiled [Key Recovery and Derivation](../server) in its [contents](https://www.electron.build/configuration/contents.html#extrafiles), spawns it as a child process, and interfaces with it using HTTP requests.
