import NextDocument, { Html, Head, Main, NextScript } from 'next/document';
import { ReactNode } from 'react';
import { heebo, getInitialDocumentProps, EmotionHeadTags } from '@fireblocks/recovery-shared';

export default class Document extends NextDocument {
  render() {
    const styleTags = (this.props as any).styleTags as ReactNode;

    return (
      <Html lang='en' dir='ltr' className={heebo.className}>
        <Head>
          <meta charSet='utf-8' />
          <EmotionHeadTags styleTags={styleTags} />
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
