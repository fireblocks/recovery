import React from "react";
import Head from "next/head";
import Link from "../components/Link";

function Next() {
  return (
    <React.Fragment>
      <Head>
        <title>Next - Nextron (with-typescript)</title>
      </Head>
      <div>
        <p>
          ⚡ Electron + Next.js ⚡ -<Link href="/">Go to home page</Link>
        </p>
      </div>
    </React.Fragment>
  );
}

export default Next;
