import { Box, Typography } from "@mui/material";
import { Button, getAssetInfo } from "@fireblocks/recovery-shared";
import { BaseModal } from "../BaseModal";
import type { Row } from "../../../pages/accounts/vault/[accountId]";
import { Derivation } from "../../../context/Workspace";

type Props = {
  open: boolean;
  row: Row | null;
  onClose: VoidFunction;
};

type AddressProps = {
  type: "Permanent" | "Other";
  derivations: Derivation[];
  hasSegwit: boolean;
};

// TODO: Fix why there are the incorrect addresses displayed, two segwit one legacy

function Addresses({ type, derivations, hasSegwit }: AddressProps) {
  const addressesData = hasSegwit
    ? derivations.map(({ address, isLegacy }) => ({
        address,
        label: isLegacy ? "Legacy" : "Segwit",
      }))
    : derivations.map(({ address }) => ({
        address,
        label: null,
      }));

  // Sort addresses to keep legacy on top
  addressesData.sort((a, b) => {
    if (a.label === "Legacy" && b.label === "Segwit") {
      return -1;
    }
    if (a.label === "Segwit" && b.label === "Legacy") {
      return 1;
    }
    return 0;
  });

  const data = type === "Permanent" ? addressesData : addressesData;

  return (
    <Box
      padding="1em"
      marginBottom="1em"
      border={(theme) => `solid 1px ${theme.palette.grey[300]}`}
      sx={{ background: "#FFF" }}
    >
      <Typography variant="h6" textTransform="uppercase" marginTop="0">
        {type} Address{addressesData.length > 1 ? "es" : ""}
      </Typography>
      {data.map(({ address, label }, index, arr) => (
        <Typography
          key={address}
          variant="body1"
          paragraph={index + 1 < arr.length}
        >
          {label ? `${label}: ` : ""}
          {address}
        </Typography>
      ))}
    </Box>
  );
}

export function AddressesModal({ open, row, onClose }: Props) {
  const assetInfo = getAssetInfo(row?.assetId);

  const addressCount = row?.derivations.length ?? 0;

  const permamentDerivations = row?.derivations.filter(
    (derivation) => derivation.type === "Permanent"
  );

  const depositDerivations = row?.derivations.filter(
    (derivation) => derivation.type === "Deposit"
  );

  const hasSegwit = !!row?.assetId.startsWith("BTC");

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`${assetInfo.name} Address${addressCount > 1 ? "es" : ""}`}
      actions={
        <Button variant="text" onClick={onClose}>
          Close
        </Button>
      }
    >
      {!!permamentDerivations?.length && (
        <Addresses
          type="Permanent"
          derivations={permamentDerivations}
          hasSegwit={hasSegwit}
        />
      )}
      {!!depositDerivations?.length && (
        <Addresses
          type="Other"
          derivations={depositDerivations}
          hasSegwit={hasSegwit}
        />
      )}
    </BaseModal>
  );
}
