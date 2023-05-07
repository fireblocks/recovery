import execa, { ExecaError } from 'execa';

export const runChildProcess = async (file: string, args: string[]): Promise<string> => {
  try {
    const { stdout } = await execa(file, args);

    return stdout;
  } catch (error) {
    if ('stderr' in (error as ExecaError)) {
      const err = error as ExecaError;
      if (err.exitCode === 3) {
        throw new Error('RSA Key passphrase invalid');
      }
      if (err.exitCode === 2) {
        throw new Error('Insufficient parameters in decryption call');
      }
      throw new Error(err.stderr);
    }

    throw error;
  }
};
