import path from "path";
import isDev from "electron-is-dev";

export type Args = {
  zip: string;
  mobilePassphrase: string;
  rsaKey: string;
  rsaKeyPassphrase?: string;
  dangerouslyRecoverPrivateKeys?: boolean;
};

const CONTENTS_PATH = path.join(__dirname, "..", "..", "..");
const EXECUTABLE_NAME = "__main__";

export const getChildProcessInput = (args: Args) => {
  const processArgs = [
    "-z",
    args.zip,
    "-mp",
    args.mobilePassphrase,
    "-rk",
    args.rsaKey,
    "-p",
    String(args.dangerouslyRecoverPrivateKeys),
  ];

  if (args.rsaKeyPassphrase?.trim()) {
    processArgs.push("-rp", args.rsaKeyPassphrase);
  }

  let file: string;

  if (isDev) {
    const serverPath = path.join(
      __dirname,
      "..",
      "..",
      "extended-key-recovery",
      `${EXECUTABLE_NAME}.py`
    );

    file = "python";

    processArgs.unshift(serverPath);
  } else {
    const serverPath = path.join(
      CONTENTS_PATH,
      EXECUTABLE_NAME,
      process.platform === "win32" ? ".exe" : ""
    );

    file = serverPath;
  }

  return { file, processArgs };
};
