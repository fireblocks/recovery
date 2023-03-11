import path from 'path';
import isDev from 'electron-is-dev';

export type Args = {
  zip: string;
  mobilePassphrase: string;
  rsaKey: string;
  rsaKeyPassphrase?: string;
  dangerouslyRecoverPrivateKeys?: boolean;
};

const EXECUTABLE_NAME = 'recover';

const basePath = path.join(__dirname, '..', '..', '..');

export const getChildProcessInput = (args: Args) => {
  const processArgs = [
    '-z',
    args.zip,
    '-mp',
    args.mobilePassphrase,
    '-rk',
    args.rsaKey,
    '-p',
    String(args.dangerouslyRecoverPrivateKeys ?? false),
  ];

  if (args.rsaKeyPassphrase?.trim()) {
    processArgs.push('-rp', args.rsaKeyPassphrase);
  }

  let file: string;

  if (isDev) {
    const executablePath = path.join(basePath, 'packages', 'extended-key-recovery', `${EXECUTABLE_NAME}.py`);

    file = 'python';

    processArgs.unshift(executablePath);
  } else {
    const executablePath = path.join(basePath, EXECUTABLE_NAME, process.platform === 'win32' ? '.exe' : '');

    file = executablePath;
  }

  return { file, processArgs };
};
