import Head from "next/head";
import { useRouter } from "next/router";
import { theme } from "shared";
import { Box } from "@mui/material";
import { QrCode } from "../components/QrCode";

const QR = () => {
  const router = useRouter();

  const data = router.query.data as string | undefined;
  const title = router.query.title as string | undefined;

  return (
    <Box padding="1em">
      <Head>
        <title>{`${title ? `${title} ` : ""} QR Code`}</title>
      </Head>
      <QrCode
        data={data}
        title={title}
        bgColor={theme.palette.background.default}
      />
    </Box>
  );
};

export default QR;
