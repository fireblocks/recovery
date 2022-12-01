import execa from "execa";
import waitOn from "wait-on";
import { nanoid } from "nanoid";
import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from "axios";
import { getPortPromise } from "portfinder";
// import jsonwebtoken from "jsonwebtoken";

export class PythonServer {
  private subprocess: execa.ExecaChildProcess | null = null;

  private apiClient: AxiosInstance | null = null;

  /**
   * Spawn a new Python server process and create a new Axios client.
   *
   * @returns void
   */
  public async spawn() {
    // Generate a random secret key
    const secretKey = nanoid(32);

    // Generate a JWT for requests to the server
    // const jwt = jsonwebtoken.sign({}, secretKey, {
    //   algorithm: "HS256",
    //   noTimestamp: true,
    // });

    // Get an available port
    const port = await getPortPromise();

    // Spawn the Python server
    this.subprocess = execa("python", [
      "../server/__init__.py",
      "-s",
      secretKey,
      "-p",
      port.toString(),
    ]);

    // Wait for the server to start
    await waitOn({
      resources: [`http://localhost:${port}`],
      timeout: 10000,
    });

    console.info(`Python server subprocess running on port ${port}`);

    // Create an HTTP client to make requests to the server
    this.apiClient = axios.create({
      baseURL: `http://localhost:${port}/recover-keys`,
      // headers: {
      //   Authorization: `Bearer ${jwt}`,
      // },
    });
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
