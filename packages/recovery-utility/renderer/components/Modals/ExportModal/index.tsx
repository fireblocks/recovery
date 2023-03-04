import { useState, ChangeEvent } from "react";
import {
  Typography,
  Box,
  Grid,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  AssetId,
  assets,
  theme,
  getAssetInfo,
  AssetInfo,
  AssetIcon,
  Button,
} from "@fireblocks/recovery-shared";
import { BaseModal } from "../BaseModal";
import { csvExport, ParsedRow } from "../../../lib/csv";
import { download } from "../../../lib/download";
import { useWorkspace } from "../../../context/Workspace";

type Props = {
  open: boolean;
  onClose: VoidFunction;
};

export const ExportModal = ({ open, onClose }: Props) => {
  const { vaultAccounts } = useWorkspace();

  const [includePrivateKeys, setIncludePrivateKeys] = useState(false);

  const handleChangeIncludePrivateKeys = (checked: boolean) =>
    setIncludePrivateKeys(checked);

  const onExportCsv = () => {
    const data = vaultAccounts.reduce((acc, account) => {
      const rows = account.wallets.reduce((_rows, wallet) => {
        const walletRows = wallet.derivations.map((derivation) => {
          return {
            accountName: account.name,
            accountId: account.id,
            assetId: wallet.assetId,
            assetName: getAssetInfo(wallet.assetId)?.name ?? wallet.assetId,
            address: derivation.address,
            addressType: derivation.type,
            addressDescription: derivation.description,
            tag: derivation.tag,
            pathParts: derivation.pathParts,
            publicKey: derivation.publicKey,
            privateKey: includePrivateKeys ? derivation.privateKey : undefined,
            privateKeyWif: includePrivateKeys ? derivation.wif : undefined,
          };
        });

        return [..._rows, ...walletRows];
      }, [] as ParsedRow[]);

      return [...acc, ...rows];
    }, [] as ParsedRow[]);

    const csv = csvExport(data);

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9T-]/g, "")
      .slice(0, -3);

    const filename = `Fireblocks_vault_addresses_${
      includePrivateKeys ? "keys_" : ""
    }recovery_${timestamp}.csv`;

    download(csv, filename, "text/plain");
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Export Addresses & Keys"
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onExportCsv}>Export</Button>
        </>
      }
    >
      <FormGroup>
        <FormControlLabel
          label="Include private keys"
          control={<Checkbox defaultChecked />}
          checked={includePrivateKeys}
          onChange={(_, checked) => handleChangeIncludePrivateKeys(checked)}
        />
      </FormGroup>
    </BaseModal>
  );
};
