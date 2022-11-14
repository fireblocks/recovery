import fs from "fs";
import path from "path";
import { Protocol } from "electron";

const DIST_PATH = path.join(__dirname, "../../app/dist");
export const scheme = "app";

const mimeTypes = {
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".html": "text/html",
  ".htm": "text/html",
  ".json": "application/json",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".ico": "image/vnd.microsoft.icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".map": "text/plain",
};

const charset = (mimeExt: string) =>
  [".html", ".htm", ".js", ".mjs"].some((m) => m === mimeExt) ? "utf-8" : null;

const mime = (filename: string) => {
  const mimeExt = path.extname(`${filename || ""}`).toLowerCase();
  const mimeType = mimeTypes[mimeExt];
  return mimeType ? { mimeExt, mimeType } : { mimeExt: null, mimeType: null };
};

export const requestHandler: Parameters<
  Protocol["registerBufferProtocol"]
>[1] = (req, next) => {
  const reqUrl = new URL(req.url);
  let reqPath = path.normalize(reqUrl.pathname);
  if (reqPath === "/") {
    reqPath = "/index.html";
  }
  const reqFilename = path.basename(reqPath);
  fs.readFile(path.join(DIST_PATH, reqPath), (err, data) => {
    const { mimeExt, mimeType } = mime(reqFilename);
    if (!err && mimeType !== null) {
      next({
        mimeType,
        charset: charset(mimeExt),
        data,
      });
    } else {
      console.error(err);
    }
  });
};
