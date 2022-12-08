import {
  app,
  protocol,
  session,
  ipcMain,
  BrowserWindow,
  BrowserWindowConstructorOptions,
} from "electron";
import isDev from "electron-is-dev";
import log from "electron-log";
import fs from "fs";
import path from "path";
import installExtension, {
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { scheme, requestHandler } from "./protocol";
import { PythonServer } from "./api/python-server";
import "./ipc";

const port = 8888; // Hardcoded; needs to match webpack.development.js and package.json
const selfHost = `http://localhost:${port}`;

// Override console.log with electron-log
Object.assign(console, log.functions);

export const pythonServer = new PythonServer();

app.on("quit", pythonServer.kill);
process.on("exit", pythonServer.kill);
process.on("uncaughtException", pythonServer.kill);
process.on("unhandledRejection", pythonServer.kill);

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
    devTools: isDev,
    nodeIntegration: true,
    contextIsolation: false,
    plugins: true,
    backgroundThrottling: false,
    disableBlinkFeatures: "Auxclick",
  },
});

async function createWindow() {
  // If you'd like to set up auto-updating for your app,
  // I'd recommend looking at https://github.com/iffy/electron-updater-example
  // to use the method most suitable for you.
  // eg. autoUpdater.checkForUpdatesAndNotify();

  if (!isDev) {
    // Needs to happen before creating/loading the browser window;
    // protocol is only used in prod
    protocol.registerBufferProtocol(
      scheme,
      requestHandler
    ); /* eng-disable PROTOCOL_HANDLER_JS_CHECK */
  }

  void pythonServer.spawn();

  // Use saved config values for configuring your
  // BrowserWindow, for instance.
  // NOTE - this config is not passcode protected
  // and stores plaintext values
  //let savedConfig = store.mainInitialStore(fs);

  // TODO: Enable nodeIntegration with no contextIsolation in dev. Disable in prod.

  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 680,
    minWidth: 800,
    minHeight: 680,
    title: "Fireblocks Recovery Utility",
    webPreferences: {
      devTools: isDev,
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
  if (isDev) {
    win.loadURL(selfHost);
  } else {
    win.loadURL(`${scheme}://rse/index.html`);
  }

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
      const allowedPermissions: string[] = []; // Full list here: https://developer.chrome.com/extensions/declare_permissions#manifest

      if (allowedPermissions.includes(permission)) {
        permCallback(true); // Approve permission request
      } else {
        console.error(
          `The application tried to request permission for '${permission}'. This permission was not whitelisted and has been blocked.`
        );

        permCallback(false); // Deny
      }
    });

  // https://electronjs.org/docs/tutorial/security#1-only-load-secure-content;
  // The below code can only run when a scheme and host are defined, I thought
  // we could use this over _all_ urls
  // ses.fromPartition(partition).webRequest.onBeforeRequest({urls:["http://localhost./*"]}, (listener) => {
  //   if (listener.url.indexOf("http://") >= 0) {
  //     listener.callback({
  //       cancel: true
  //     });
  //   }
  // });
}

// Needs to be called before app is ready;
// gives our scheme access to load relative files,
// as well as local storage, cookies, etc.
// https://electronjs.org/docs/api/protocol#protocolregisterschemesasprivilegedcustomschemes
protocol.registerSchemesAsPrivileged([
  {
    scheme,
    privileges: {
      standard: true,
      secure: true,
    },
  },
]);

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
    /* eng-disable LIMIT_NAVIGATION_JS_CHECK  */
    const parsedUrl = new URL(navigationUrl);
    const validOrigins = [selfHost];

    // Log and prevent the app from navigating to a new page if that page's origin is not whitelisted
    if (!validOrigins.includes(parsedUrl.origin)) {
      console.error(
        `The application tried to navigate to the following address: '${parsedUrl}'. This origin is not whitelisted and the attempt to navigate was blocked.`
      );

      contentsEvent.preventDefault();
    }
  });

  contents.on("will-redirect", (contentsEvent, navigationUrl) => {
    /* eng-disable LIMIT_NAVIGATION_JS_CHECK  */
    const parsedUrl = new URL(navigationUrl);
    const validOrigins = [selfHost];

    if (!validOrigins.includes(parsedUrl.origin)) {
      console.error(
        `The application tried to redirect to the following address: '${navigationUrl}'. This attempt was blocked.`
      );

      contentsEvent.preventDefault();
    }
  });

  // https://electronjs.org/docs/tutorial/security#11-verify-webview-options-before-creation
  contents.on(
    "will-attach-webview",
    (contentsEvent, webPreferences, params) => {
      // Strip away preload scripts if unused or verify their location is legitimate
      // delete webPreferences.preload;
      // delete webPreferences.preloadURL;
      // Disable Node.js integration
      // webPreferences.nodeIntegration = false;
    }
  );

  // https://electronjs.org/docs/tutorial/security#13-disable-or-limit-creation-of-new-windows
  // This code replaces the old "new-window" event handling;
  // https://github.com/electron/electron/pull/24517#issue-447670981
  contents.setWindowOpenHandler(({ url }) => {
    const parsedUrl = new URL(url);
    const validOrigins = [selfHost];

    if (validOrigins.includes(parsedUrl.origin)) {
      if (url.includes("/qr")) {
        return {
          action: "allow",
          overrideBrowserWindowOptions: getWindowOptions(300, 428),
        };
      }

      if (url.includes("/add")) {
        return {
          action: "allow",
          overrideBrowserWindowOptions: getWindowOptions(500, 440),
        };
      }

      if (url.includes("/details")) {
        return {
          action: "allow",
          overrideBrowserWindowOptions: getWindowOptions(500, 440),
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
