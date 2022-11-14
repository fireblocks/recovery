import React from "react";
import Head from "next/head";
import Link from "next/link";

function Home() {
  return (
    <React.Fragment>
      <Head>
        <title>Home - Nextron (with-typescript)</title>
      </Head>
      <div>
        <p>
          ⚡ Electron + Next.js ⚡ -<Link href="/next">Go to next page</Link>
        </p>
        <img src="/images/logo.png" />
      </div>
    </React.Fragment>
  );
}

export default Home;
