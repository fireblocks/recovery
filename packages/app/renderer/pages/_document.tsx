import NextDocument, { Html, Head, Main, NextScript } from "next/document";
import { ReactNode } from "react";
import { heebo, getInitialDocumentProps, EmotionHeadTags } from "shared";

export default class Document extends NextDocument {
  render() {
    const emotionStyleTags = (this.props as any).emotionStyleTags as ReactNode;

    return (
      <Html lang="en" dir="ltr" className={heebo.className}>
        <Head>
          <meta charSet="utf-8" />
          <EmotionHeadTags styleTags={emotionStyleTags} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

Document.getInitialProps = getInitialDocumentProps;
