import { ipcMain } from 'electron';
import { getChildProcessInput, Args } from './input';
import { runChildProcess } from './run';
import { parseExtendedKeys } from './parse';

ipcMain.handle('extended-keys/recover', async (event, args: Args) => {
  const { file, processArgs } = getChildProcessInput(args);

  const stdout = await runChildProcess(file, processArgs);

  const extendedKeys = parseExtendedKeys(stdout, args.dangerouslyRecoverPrivateKeys);

  return extendedKeys;
});
