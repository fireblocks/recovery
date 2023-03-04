// Override console.log with electron-log
import log from "electron-log";
Object.assign(console, log.functions);

import {
  app,
  session,
  BrowserWindow,
  BrowserWindowConstructorOptions,
} from "electron";
import isDev from "electron-is-dev";
import installExtension, {
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { registerFileProtocol } from "./helpers";
import { PythonServer } from "./api/pythonServer";
import "./ipc";

const PROTOCOL = "app";
const PORT = 8888; // Hardcoded; needs to match webpack.development.js and package.json
const SELF_HOST = `http://localhost:${PORT}`;
const validOrigins = [SELF_HOST];

export const pythonServer = new PythonServer();

app.on("quit", pythonServer.kill);
process.on("exit", pythonServer.kill);
process.on("uncaughtException", pythonServer.kill);
process.on("unhandledRejection", pythonServer.kill);

const loadUrl = isDev
  ? async (win: BrowserWindow, params?: string) =>
      win.loadURL(`${SELF_HOST}${params ? `?${params}` : ""}`)
  : registerFileProtocol({ directory: PROTOCOL, scheme: PROTOCOL });

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
export let win: BrowserWindow | null = null;

const getWindowOptions = (
  width: number,
  height: number
): BrowserWindowConstructorOptions => ({
  // frame: true,
  fullscreenable: false,
  modal: true,
  height,
  width,
  minHeight: height,
  minWidth: width,
  webPreferences: {
    devTools: true,
    nodeIntegration: true,
    contextIsolation: false,
    plugins: true,
    backgroundThrottling: false,
    disableBlinkFeatures: "Auxclick",
  },
});

const isValidUrl = (url: string) => {
  const parsedUrl = new URL(url);

  return (
    parsedUrl.protocol === `${PROTOCOL}:` ||
    validOrigins.includes(parsedUrl.origin)
  );
};

async function createWindow() {
  // Start the Python server subprocess
  const pythonServerBaseUrl = await pythonServer.spawn();

  const urlParams = new URLSearchParams({ server: pythonServerBaseUrl });

  const encodedUrlParams = urlParams.toString();

  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 680,
    minWidth: 800,
    minHeight: 680,
    title: "Fireblocks Recovery Utility",
    webPreferences: {
      devTools: true,
      nodeIntegration: true,
      contextIsolation: false,
      plugins: true,
      backgroundThrottling: false,
      // nodeIntegrationInWorker: false,
      // nodeIntegrationInSubFrames: false,
      disableBlinkFeatures: "Auxclick",
    },
  });

  // Load app
  void loadUrl(win, encodedUrlParams);

  win.webContents.on("did-finish-load", () => {
    win?.setTitle("Fireblocks Recovery Utility");
  });

  // Only do these things when in development
  if (isDev) {
    // Errors are thrown if the dev tools are opened
    // before the DOM is ready
    win.webContents.once("dom-ready", async () => {
      await installExtension([REACT_DEVELOPER_TOOLS])
        .then((name) => console.info(`Added Chrome extension: ${name}`))
        .catch((err) => console.error("An error occurred: ", err))
        .finally(() => {
          require("electron-debug")(); // https://github.com/sindresorhus/electron-debug
          win?.webContents.openDevTools();
        });
    });
  }

  // Emitted when the window is closed.
  win.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  // https://electronjs.org/docs/tutorial/security#4-handle-session-permission-requests-from-remote-content
  const ses = session;
  const partition = "default";
  ses
    .fromPartition(
      partition
    ) /* eng-disable PERMISSION_REQUEST_HANDLER_JS_CHECK */
    .setPermissionRequestHandler((webContents, permission, permCallback) => {
      // Full list here: https://developer.chrome.com/extensions/declare_permissions#manifest
      const allowedPermissions: string[] = ["idle"];

      if (allowedPermissions.includes(permission)) {
        permCallback(true); // Approve permission request
      } else {
        console.error(
          `The application tried to request permission for '${permission}'. This permission was not whitelisted and has been blocked.`
        );

        permCallback(false); // Deny
      }
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  void createWindow();
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  app.quit();
});

// https://electronjs.org/docs/tutorial/security#12-disable-or-limit-navigation
app.on("web-contents-created", (event, contents) => {
  contents.on("will-navigate", (contentsEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    // Log and prevent the app from navigating to a new page if that page's origin is not whitelisted
    if (!isValidUrl(navigationUrl)) {
      console.error(
        `The application tried to navigate to the following address: '${parsedUrl}'. The origin ${parsedUrl.origin} is not whitelisted and the attempt to navigate was blocked.`
      );

      contentsEvent.preventDefault();
    }
  });

  contents.on("will-redirect", (contentsEvent, navigationUrl) => {
    if (!isValidUrl(navigationUrl)) {
      console.error(
        `The application tried to redirect to the following address: '${navigationUrl}'. This attempt was blocked.`
      );

      contentsEvent.preventDefault();
    }
  });

  // https://electronjs.org/docs/tutorial/security#13-disable-or-limit-creation-of-new-windows
  // This code replaces the old "new-window" event handling;
  // https://github.com/electron/electron/pull/24517#issue-447670981
  contents.setWindowOpenHandler(({ url }) => {
    if (isValidUrl(url)) {
      if (url.includes("/qr")) {
        return {
          action: "allow",
          overrideBrowserWindowOptions: getWindowOptions(300, 418),
        };
      }
    }

    console.error(
      `The application tried to open a new window at the following address: '${url}'. This attempt was blocked.`
    );

    return {
      action: "deny",
    };
  });
});
