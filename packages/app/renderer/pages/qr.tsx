import Head from "next/head";
import { useRouter } from "next/router";
import { QrCode } from "../components/QrCode";

const QR = () => {
  const router = useRouter();

  const data = router.query.data as string | undefined;
  const title = router.query.title as string | undefined;

  return (
    <>
      <Head>
        <title>{`${title ? `${title} ` : ""} QR Code`}</title>
      </Head>
      <QrCode data={data} title={title} />
    </>
  );
};

export default QR;
