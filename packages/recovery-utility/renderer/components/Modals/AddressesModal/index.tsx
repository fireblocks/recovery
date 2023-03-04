import { Box, Typography } from "@mui/material";
import { Button, getAssetInfo, TextField } from "@fireblocks/recovery-shared";
import { BaseModal } from "../BaseModal";
import { Row } from "../../../pages/accounts/vault/[accountId]";

type Props = {
  open: boolean;
  row: Row | null;
  onClose: VoidFunction;
};

type AddressProps = {
  type: "Permanent" | "Other";
  addresses: string[];
  hasSegwit: boolean;
};

// TODO: Fix why there are the incorrect addresses displayed, two segwit one legacy

const Addresses = ({ type, addresses, hasSegwit }: AddressProps) => {
  const addressesData = hasSegwit
    ? addresses.map((address) => ({
        address,
        label: address.startsWith("bc1") ? "Segwit" : "Legacy",
      }))
    : addresses.map((address) => ({
        address,
        label: null,
      }));

  // Sort address data for legacy on top
  addressesData.sort((a, b) => {
    if (a.label === "Legacy" && b.label === "Segwit") {
      return -1;
    }
    if (a.label === "Segwit" && b.label === "Legacy") {
      return 1;
    }
    return 0;
  });

  return (
    <Box
      padding="1em"
      marginBottom="1em"
      border={(theme) => `solid 1px ${theme.palette.grey[300]}`}
      sx={{ background: "#FFF" }}
    >
      <Typography variant="h6" textTransform="uppercase" marginTop="0">
        {type} Address
      </Typography>
      {(type === "Permanent" ? addressesData.slice(0, 2) : addressesData).map(
        ({ address, label }, index) => (
          <Typography key={index} variant="body1" paragraph>
            {label ? `${label}: ` : ""}
            {address}
          </Typography>
        )
      )}
    </Box>
  );
};

export const AddressesModal = ({ open, row, onClose }: Props) => {
  const assetInfo = getAssetInfo(row?.assetId);

  const permamentAddresses = row?.derivations
    .filter((derivation) => derivation.type === "Permanent")
    .map((derivation) => derivation.address);

  const depositAddresses = row?.derivations
    .filter((derivation) => derivation.type === "Deposit")
    .map((derivation) => derivation.address);

  const hasSegwit = !!row?.assetId.startsWith("BTC");

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`${assetInfo.name} Addresses`}
      actions={
        <Button variant="text" onClick={onClose}>
          Close
        </Button>
      }
    >
      {!!permamentAddresses?.length && (
        <Addresses
          type={"Permanent"}
          addresses={permamentAddresses}
          hasSegwit={hasSegwit}
        />
      )}
      {!!depositAddresses?.length && (
        <Addresses
          type={"Other"}
          addresses={depositAddresses}
          hasSegwit={hasSegwit}
        />
      )}
    </BaseModal>
  );
};
