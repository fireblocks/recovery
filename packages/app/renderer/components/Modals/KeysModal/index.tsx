import { useRouter } from "next/router";
import { Box, Typography } from "@mui/material";
import { Button, getAssetInfo, TextField } from "shared";
import { useWorkspace } from "../../../context/Workspace";
import { BaseModal } from "../BaseModal";
import { pythonServerUrlParams } from "../../../lib/pythonClient";
import { Row } from "../../../pages/accounts/vault/[accountId]";

type Props = {
  open: boolean;
  row: Row | null;
  onClose: VoidFunction;
};

type KeyProps = {
  type: string;
  keyData: string;
};

// TODO: Fix why there are the incorrect addresses displayed, two segwit one legacy

const Key = ({ type, keyData }: KeyProps) => {
  return (
    <Box
      padding="1em"
      marginBottom="1em"
      border={(theme) => `solid 1px ${theme.palette.grey[300]}`}
      sx={{ background: "#FFF" }}
    >
      <Typography variant="h6" textTransform="uppercase" marginTop="0">
        {type}
      </Typography>
      <Typography variant="body1">{keyData}</Typography>
    </Box>
  );
};

export const KeysModal = ({ open, row, onClose }: Props) => {
  const assetInfo = getAssetInfo(row?.assetId);

  const keys = row?.derivations
    .map(({ publicKey, privateKey, wif }) => ({
      publicKey,
      privateKey,
      wif,
    }))
    .filter((key) => key.publicKey)

    // Dedupe keys based on public key
    .filter(
      (key, index, self) =>
        index === self.findIndex((t) => t.publicKey === key.publicKey)
    );

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`${assetInfo.name} Keys`}
      actions={
        <Button variant="text" onClick={onClose}>
          Close
        </Button>
      }
    >
      {keys?.map((key, index) => (
        <Box key={index}>
          {!!key.publicKey && <Key type="Public Key" keyData={key.publicKey} />}
          {!!key.privateKey && (
            <Key type="Private Key" keyData={key.privateKey} />
          )}
          {!!key.wif && <Key type="WIF" keyData={key.wif} />}
        </Box>
      ))}
    </BaseModal>
  );
};
