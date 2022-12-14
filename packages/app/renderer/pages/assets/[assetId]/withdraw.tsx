import Head from "next/head";
import { useQuery } from "@tanstack/react-query";
import { Box, Typography } from "@mui/material";
import { theme, AssetIcon, AssetId, TextField } from "shared";
import { getRelayUrl } from "../../../lib/relayUrl";
import { useSettings } from "../../../context/Settings";
import { useWorkspace } from "../../../context/Workspace";
import { QrCode } from "../../../components/QrCode";

const Withdraw = () => {
  const { relayBaseUrl } = useSettings();

  const { asset, address, privateKey } = useWorkspace();

  const title = `${asset?.name} Withdrawal`;

  const relayUrlQuery = useQuery({
    queryKey: ["relayUrl", address, relayBaseUrl],
    enabled: !!asset?.id && !!address && !!privateKey,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const random = window.crypto.getRandomValues(new Uint32Array(1))[0];

      const pin = (random % 1000000).toString().padStart(6, "0");

      const relayUrl = await getRelayUrl({
        baseUrl: relayBaseUrl,
        pin,
        data: {
          assetId: asset?.id as AssetId,
          address: address as string,
          privateKey: privateKey as string,
        },
      });

      return { pin, relayUrl };
    },
  });

  return (
    <Box padding="1em">
      <Head>
        <title>{title}</title>
      </Head>
      <Typography
        variant="h1"
        display="flex"
        alignItems="center"
        margin="0 0 1rem 0"
      >
        <Box display="flex" alignItems="center" marginRight="0.5rem">
          <AssetIcon assetId={asset?.id as AssetId} />
        </Box>
        {title}
      </Typography>
      <Typography variant="body1" paragraph>
        Scan the QR code with an online device to send a transaction with
        Fireblocks Recovery Relay. Use the PIN to decrypt the {asset?.name}{" "}
        private key.
      </Typography>
      <QrCode
        data={relayUrlQuery.data?.relayUrl}
        title="Open with an online device"
        bgColor={theme.palette.background.default}
      />
      <TextField
        type="password"
        id="pin"
        label="PIN"
        value={relayUrlQuery.data?.pin}
        enableCopy
        isMonospace
        formControlProps={{ sx: { marginTop: "1em" } }}
      />
    </Box>
  );
};

export default Withdraw;
