import isDev from "electron-is-dev";
import execa from "execa";
import path from "path";
import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from "axios";
import { getPortPromise } from "portfinder";

export class PythonServer {
  private subprocess: execa.ExecaChildProcess | null = null;

  private apiClient: AxiosInstance | null = null;

  /**
   * Spawn a new Python server process and create a new Axios client.
   *
   * @returns Python server base URL
   */
  public async spawn() {
    console.info("Spawning Python server...");

    const port = await getPortPromise();

    const baseURL = `http://localhost:${port}`;

    const portArgs = ["-p", port.toString()];

    // DEBUGGING
    // const lsProcess = execa("ls", ["-lah"]);
    // lsProcess.stderr?.pipe(process.stderr);
    // lsProcess.stdout?.pipe(process.stdout);

    if (isDev) {
      const serverPath = path.join(
        __dirname,
        "..",
        "..",
        "server",
        "__init__.py"
      );

      this.subprocess = execa("python", [serverPath, ...portArgs]);
    } else {
      const serverPath = path.join(
        __dirname,
        "server",
        process.platform === "win32" ? ".exe" : ""
      );

      this.subprocess = execa(serverPath, portArgs);
    }

    this.subprocess.stderr?.pipe(process.stderr);

    if (process.env.NODE_ENV === "development") {
      this.subprocess.stdout?.pipe(process.stdout);
    }

    console.info(`Python server subprocess running on port ${port}`);

    this.apiClient = axios.create({ baseURL });

    return baseURL;
  }

  /**
   * Send the Python server process the `'SIGTERM'` signal.
   *
   * @returns `true` if [`kill(2)`](http://man7.org/linux/man-pages/man2/kill.2.html) succeeds, and `false` otherwise.
   */
  public kill() {
    const success = this.subprocess?.kill("SIGTERM", {
      forceKillAfterTimeout: 2000,
    });

    this.subprocess = null;

    this.apiClient = null;

    return success;
  }

  /**
   * Send a request to the Python server.
   *
   * @param config request config
   * @returns response data
   */
  public async request<T = any, D = any>(config: AxiosRequestConfig<D>) {
    if (!this.apiClient || !this.subprocess || this.subprocess.killed) {
      throw new Error("Python server is not running");
    }

    const { data } = await this.apiClient.request<T, AxiosResponse<T>, D>(
      config
    );

    return data;
  }
}
