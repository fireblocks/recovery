import React from "react";
import Head from "next/head";
import Link from "next/link";

function Next() {
  return (
    <React.Fragment>
      <Head>
        <title>Next - Nextron (with-typescript)</title>
      </Head>
      <div>
        <p>
          ⚡ Electron + Next.js ⚡ -<Link href="/home">Go to home page</Link>
        </p>
      </div>
    </React.Fragment>
  );
}

export default Next;
