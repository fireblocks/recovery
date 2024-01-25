import axios, { AxiosHeaders } from 'axios';
import { ipcMain } from 'electron';

ipcMain.handle('main_proc_fetch', async (event, input: string | Request | URL, init?: RequestInit) => {
  try {
    let res: any = undefined;
    if (!init) {
      if (typeof input === 'string') {
        res = (await axios.get(input)).data;
      } else if (input instanceof URL) {
        res = (await axios.get(input.toString())).data;
      } else {
        res = (
          await axios({
            url: input.url,
            data: input.body,
            method: input.method,
          })
        ).data;
      }
    } else {
      const headers = new AxiosHeaders();
      if (init.headers) {
        Object.keys(init.headers).forEach(
          (header: string) =>
            headers.set(header, (init.headers! as { [key: string]: string })[header as string] as unknown as string), // ew
        );
      }

      res = (
        await axios({
          url: input as string,
          method: init.method,
          data: init.body,
          headers: headers,
        })
      ).data;
    }

    if (res !== undefined) {
      return JSON.stringify(res);
    }
    throw new Error('No result');
  } catch (e) {
    console.error('Failed to query solana information', e);
  }
});
