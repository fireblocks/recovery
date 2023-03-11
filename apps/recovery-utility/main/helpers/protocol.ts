// Reference: https://github.com/sindresorhus/electron-serve

import electron, { ProtocolRequest, ProtocolResponse } from 'electron';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

type Options = {
  /**
		The directory to serve, relative to the app root directory.
		*/
  directory: string;

  /**
		Custom scheme. For example, `foo` results in your `directory` being available at `foo://-`.
		@default 'app'
		*/
  scheme: string;

  /**
		Whether [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) should be enabled.
		Useful for testing purposes.
		@default true
		*/
  isCorsEnabled?: boolean;

  /**
		The partition the protocol should be installed to, if you're not using Electron's default partition.
		@default electron.session.defaultSession
		*/
  partition?: string;
};

type ProtocolHandler = (request: ProtocolRequest, callback: (response: string | ProtocolResponse) => void) => void;

const stat = promisify(fs.stat);

// See https://cs.chromium.org/chromium/src/net/base/net_error_list.h
const FILE_NOT_FOUND = -6;

export const registerFileProtocol = (options: Options) => {
  const _options = { isCorsEnabled: true, ...options } satisfies Options;

  if (!_options.directory) {
    throw new Error('The `directory` option is required');
  }

  if (!_options.scheme) {
    throw new Error('The `scheme` option is required');
  }

  _options.directory = path.resolve(electron.app.getAppPath(), _options.directory);

  const getPath = async (path_: string): Promise<string> => {
    const result = await stat(path_);

    if (result.isFile()) {
      return path_;
    }

    if (result.isDirectory()) {
      return getPath(path.join(path_, 'index.html'));
    }

    return `${path_}.html`;
  };

  const handler: ProtocolHandler = async (request, callback) => {
    const indexPath = path.join(_options.directory, 'index.html');

    const filePath = path.join(_options.directory, decodeURIComponent(new URL(request.url).pathname));

    const paths = [filePath, `${filePath}.html`, path.join(_options.directory, '404.html')];

    let resolvedPath: string | undefined;

    for (const path of paths) {
      try {
        resolvedPath = await getPath(path);
        break;
      } catch {}
    }

    const fileExtension = path.extname(filePath);

    if (resolvedPath || !fileExtension || fileExtension === '.html' || fileExtension === '.asar') {
      callback({ path: resolvedPath || indexPath });
    } else {
      callback({ error: FILE_NOT_FOUND });
    }
  };

  electron.protocol.registerSchemesAsPrivileged([
    {
      scheme: _options.scheme,
      privileges: {
        standard: true,
        secure: true,
        allowServiceWorkers: true,
        supportFetchAPI: true,
        corsEnabled: _options.isCorsEnabled,
      },
    },
  ]);

  electron.app.on('ready', () => {
    const session = _options.partition ? electron.session.fromPartition(_options.partition) : electron.session.defaultSession;

    session.protocol.registerFileProtocol(_options.scheme, handler);
  });

  const loadURL = async (window_: electron.BrowserWindow, params?: string) => {
    await window_.loadURL(`${_options.scheme}://index.html${params ? `?${params}` : ''}`);
  };

  return loadURL;
};
