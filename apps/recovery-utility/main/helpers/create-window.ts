import { screen, BrowserWindow, BrowserWindowConstructorOptions as BrowserWindowConstructorOptionsBase } from 'electron';
import Store from 'electron-store';

type BrowserWindowConstructorOptions = Omit<BrowserWindowConstructorOptionsBase, 'width' | 'height'> & {
  width: number;
  height: number;
};

export const createWindow = (windowName: string, options: BrowserWindowConstructorOptions): BrowserWindow => {
  const key = 'window-state';
  const name = `window-state-${windowName}`;
  const store = new Store<{ 'window-state': BrowserWindowConstructorOptions }>({
    name,
  });
  const defaultSize = {
    width: options.width,
    height: options.height,
  };
  let state = {};
  let win: BrowserWindow;

  const restore = () => store.get(key, defaultSize);

  const getCurrentPosition = () => {
    const position = win.getPosition();
    const size = win.getSize();
    return {
      x: position[0],
      y: position[1],
      width: size[0],
      height: size[1],
    };
  };

  const windowWithinBounds = (windowState: BrowserWindowConstructorOptions, bounds: BrowserWindowConstructorOptions) =>
    [windowState.width, windowState.height, windowState.x, windowState.y, bounds.width, bounds.height, bounds.x, bounds.y].every(
      (x) => typeof x === 'number',
    ) &&
    windowState.x! >= bounds.x! &&
    windowState.y! >= bounds.y! &&
    windowState.x! + windowState.width <= bounds.x! + bounds.width &&
    windowState.y! + windowState.height <= bounds.y! + bounds.height;

  const resetToDefaults = () => {
    const { bounds } = screen.getPrimaryDisplay();
    return {
      ...defaultSize,
      x: (bounds.width - defaultSize.width) / 2,
      y: (bounds.height - defaultSize.height) / 2,
    };
  };

  const ensureVisibleOnSomeDisplay = (windowState: BrowserWindowConstructorOptions) => {
    const visible = screen.getAllDisplays().some((display) => windowWithinBounds(windowState, display.bounds));
    if (!visible) {
      // Window is partially or fully not visible now.
      // Reset it to safe defaults.
      return resetToDefaults();
    }
    return windowState;
  };

  const saveState = () => {
    if (!win.isMinimized() && !win.isMaximized()) {
      Object.assign(state, getCurrentPosition());
    }
    store.set(key, state);
  };

  state = ensureVisibleOnSomeDisplay(restore());

  const browserOptions: BrowserWindowConstructorOptions = {
    ...options,
    ...state,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      ...options.webPreferences,
    },
  };

  win = new BrowserWindow(browserOptions);

  win.on('close', saveState);

  return win;
};
