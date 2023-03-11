import execa, { ExecaError } from 'execa';

export const runChildProcess = async (file: string, args: string[]): Promise<string> => {
  try {
    const { stdout } = await execa(file, args);

    return stdout;
  } catch (error) {
    if ('stderr' in (error as ExecaError)) {
      throw new Error((error as ExecaError).stderr);
    }

    throw error;
  }
};
