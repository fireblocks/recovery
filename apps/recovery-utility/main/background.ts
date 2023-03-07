// Override console.log with electron-log
import log from "electron-log";

import {
  app,
  BrowserWindow,
  session,
  BrowserWindowConstructorOptions,
} from "electron";
import isDev from "electron-is-dev";
import installExtension, {
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import path from "path";
import { registerFileProtocol } from "./helpers";
import "./ipc";

Object.assign(console, log.functions);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
// eslint-disable-next-line import/no-mutable-exports
export let win: BrowserWindow | null = null;

const PROTOCOL = "app";
const RELAY_RESPONSE_PROTOCOL = "fireblocks-recovery";
const PORT = 8888; // Hardcoded; needs to match webpack.development.js and package.json
const SELF_HOST = `http://localhost:${PORT}`;
const validOrigins = [SELF_HOST];

const loadUrl = isDev
  ? async (window_ = win, params?: string) =>
      window_?.loadURL(`${SELF_HOST}${params ? `?${params}` : ""}`)
  : registerFileProtocol({ directory: PROTOCOL, scheme: PROTOCOL });

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
}

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
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 680,
    minWidth: 800,
    minHeight: 680,
    title: "Fireblocks Recovery Utility",
    show: false,
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
  loadUrl(win);

  win.webContents.on("did-finish-load", () => {
    win?.setTitle("Fireblocks Recovery Utility");
  });

  // Disable reload
  win.webContents.on("before-input-event", (event, input) => {
    const key = input.key.toLowerCase();

    if (key === "f5" || (key === "r" && (input.control || input.meta))) {
      event.preventDefault();
    }
  });

  // Only do these things when in development
  if (isDev) {
    // Errors are thrown if the dev tools are opened
    // before the DOM is ready
    win.webContents.once("dom-ready", async () => {
      try {
        const extensionName = await installExtension([REACT_DEVELOPER_TOOLS]);
        // eslint-disable-next-line no-console
        console.info(`Added Chrome extension: ${extensionName}`);
      } catch (error) {
        console.error("An error occurred: ", error);
      } finally {
        // eslint-disable-next-line global-require
        require("electron-debug")(); // https://github.com/sindresorhus/electron-debug
        win?.webContents.openDevTools();
      }
    });
  }

  win.once("ready-to-show", () => {
    win?.show();
  });

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

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(RELAY_RESPONSE_PROTOCOL, process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient(RELAY_RESPONSE_PROTOCOL);
}

const handleUrl = (url: string) => {
  // eslint-disable-next-line no-console
  console.info("Handled protocol url:", url);
};

// macOS & Linux
app.on("open-url", (event, url) => handleUrl(url));

// Windows
app.on("second-instance", (event, commandLine) => {
  // Someone tried to run a second instance, we should focus our window.
  if (win) {
    if (win.isMinimized()) {
      win.restore();
    }
    win.focus();
  }

  const url = commandLine.pop()?.slice(0, -1) ?? "";

  handleUrl(url);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createWindow();
});
