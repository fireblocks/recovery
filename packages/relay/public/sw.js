if (!self.define) {
  let e,
    s = {};
  const n = (n, a) => (
    (n = new URL(n + ".js", a).href),
    s[n] ||
      new Promise((s) => {
        if ("document" in self) {
          const e = document.createElement("script");
          (e.src = n), (e.onload = s), document.head.appendChild(e);
        } else (e = n), importScripts(n), s();
      }).then(() => {
        let e = s[n];
        if (!e) throw new Error(`Module ${n} didn’t register its module`);
        return e;
      })
  );
  self.define = (a, t) => {
    const i =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (s[i]) return;
    let c = {};
    const r = (e) => n(e, i),
      o = { module: { uri: i }, exports: c, require: r };
    s[i] = Promise.all(a.map((e) => o[e] || r(e))).then((e) => (t(...e), c));
  };
}
define(["./workbox-c5ed321c"], function (e) {
  "use strict";
  importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "/_next/static/Q8qtRnUdapWOhLVpHz2XV/_buildManifest.js",
          revision: "4e05c3d1accff435ffe0364a11aa7c0f",
        },
        {
          url: "/_next/static/Q8qtRnUdapWOhLVpHz2XV/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/135-8513234efb1003f2.js",
          revision: "8513234efb1003f2",
        },
        {
          url: "/_next/static/chunks/75-8112e90617e8bfd0.js",
          revision: "8112e90617e8bfd0",
        },
        {
          url: "/_next/static/chunks/867-1cd3d761ac91f205.js",
          revision: "1cd3d761ac91f205",
        },
        {
          url: "/_next/static/chunks/894.ad308eeced611376.js",
          revision: "ad308eeced611376",
        },
        {
          url: "/_next/static/chunks/framework-22108eb722d84e59.js",
          revision: "22108eb722d84e59",
        },
        {
          url: "/_next/static/chunks/main-b39210bdc1f23313.js",
          revision: "b39210bdc1f23313",
        },
        {
          url: "/_next/static/chunks/pages/%5BassetId%5D-aa2c00e5aefeb0e8.js",
          revision: "aa2c00e5aefeb0e8",
        },
        {
          url: "/_next/static/chunks/pages/_app-a23d38775028600a.js",
          revision: "a23d38775028600a",
        },
        {
          url: "/_next/static/chunks/pages/_error-15a0bbaa3c2350f1.js",
          revision: "15a0bbaa3c2350f1",
        },
        {
          url: "/_next/static/chunks/pages/index-c7ce2214c2d9f425.js",
          revision: "c7ce2214c2d9f425",
        },
        {
          url: "/_next/static/chunks/pages/scan-ad8985f0c38da2f8.js",
          revision: "ad8985f0c38da2f8",
        },
        {
          url: "/_next/static/chunks/polyfills-c67a75d1b6f99dc8.js",
          revision: "837c0df77fd5009c9e46d446188ecfd0",
        },
        {
          url: "/_next/static/chunks/webpack-b2f37eed66ce330d.js",
          revision: "b2f37eed66ce330d",
        },
        {
          url: "/_next/static/css/046d97a581924d1d.css",
          revision: "046d97a581924d1d",
        },
        {
          url: "/_next/static/media/417bab58bb26dfa1.p.woff2",
          revision: "0764083b19db2483ab5e1fe9e499d73e",
        },
        {
          url: "/_next/static/media/4f0249b9fef36a81.woff2",
          revision: "a4e544720f822d386bc450e8496d441b",
        },
        {
          url: "/_next/static/wasm/2b043d267177fbc0.wasm",
          revision: "Q8qtRnUdapWOhLVpHz2XV",
        },
        {
          url: "/icons/180x180.png",
          revision: "bbf1ef6a6b397973885402e321d0bc38",
        },
        {
          url: "/icons/192x192.png",
          revision: "b60891f559eb77508ef03619ddb582de",
        },
        {
          url: "/icons/270x270.png",
          revision: "4114be3dcc1426cd4912853fdf6fe869",
        },
        {
          url: "/icons/32x32.png",
          revision: "7ca9018139d0ec9a37acdbdfe34c9ead",
        },
        { url: "/robots.txt", revision: "f71d20196d4caf35b6a670db8c70b03d" },
        {
          url: "/site.webmanifest",
          revision: "8e5d6d6d804b973ed826d08550a78613",
        },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: s,
              event: n,
              state: a,
            }) =>
              s && "opaqueredirect" === s.type
                ? new Response(s.body, {
                    status: 200,
                    statusText: "OK",
                    headers: s.headers,
                  })
                : s,
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new e.StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: "static-audio-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:mp4)$/i,
      new e.CacheFirst({
        cacheName: "static-video-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: "static-data-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1;
        const s = e.pathname;
        return !s.startsWith("/api/auth/") && !!s.startsWith("/api/");
      },
      new e.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1;
        return !e.pathname.startsWith("/api/");
      },
      new e.NetworkFirst({
        cacheName: "others",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      ({ url: e }) => !(self.origin === e.origin),
      new e.NetworkFirst({
        cacheName: "cross-origin",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
        ],
      }),
      "GET"
    );
});
