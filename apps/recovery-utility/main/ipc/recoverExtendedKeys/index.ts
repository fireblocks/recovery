import { ipcMain } from 'electron';
import { getChildProcessInput, ExecArgs } from './input';
import { runChildProcess } from './run';

ipcMain.handle('extended-keys/decrypt', async (event, args: ExecArgs) => {
  const { file, processArgs } = getChildProcessInput(args);

  const stdout = await runChildProcess(file, processArgs);

  return stdout;
});
