import { useState } from 'react';
import { FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import { Button } from '@fireblocks/recovery-shared';
import { csvExport, ParsedRow } from '@fireblocks/recovery-shared/lib/csv';
import { download } from '@fireblocks/recovery-shared/lib/download';
import { getAssetConfig } from '@fireblocks/asset-config';
import { BaseModal } from '../BaseModal';
import { useWorkspace } from '../../../context/Workspace';

type Props = {
  open: boolean;
  onClose: VoidFunction;
};

export const ExportModal = ({ open, onClose }: Props) => {
  const { extendedKeys, accounts } = useWorkspace();

  const [includePrivateKeys, setIncludePrivateKeys] = useState(false);

  const hasPrivateKey = !!(extendedKeys?.xprv || extendedKeys?.fprv);

  const handleChangeIncludePrivateKeys = (checked: boolean) => setIncludePrivateKeys(checked);

  const onExportCsv = () => {
    const data = Array.from(accounts).reduce((acc, [accountId, account]) => {
      const rows = Array.from(account.wallets).reduce((_rows, [assetId, wallet]) => {
        const walletRows = Array.from(wallet.derivations).map(([, derivation]) => ({
          accountName: account.name,
          accountId,
          assetId,
          assetName: getAssetConfig(assetId)?.name ?? assetId,
          address: derivation.address,
          addressType: derivation.type,
          addressDescription: derivation.description,
          tag: derivation.tag,
          pathParts: derivation.pathParts,
          publicKey: derivation.publicKey,
          privateKey: includePrivateKeys ? derivation.privateKey : undefined,
          privateKeyWif: includePrivateKeys ? derivation.wif : undefined,
        }));

        return [..._rows, ...walletRows];
      }, [] as ParsedRow[]);

      return [...acc, ...rows];
    }, [] as ParsedRow[]);

    const csv = csvExport(data);

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9T-]/g, '')
      .slice(0, -3);

    const filename = `Fireblocks_vault_addresses_${includePrivateKeys ? 'keys_' : ''}recovery_${timestamp}.csv`;

    download(csv, filename, 'text/plain');
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title='Export Addresses & Keys'
      actions={
        <>
          <Button variant='text' onClick={onClose}>
            Close
          </Button>
          <Button onClick={onExportCsv}>Export</Button>
        </>
      }
    >
      {hasPrivateKey && (
        <FormGroup>
          <FormControlLabel
            label='Include private keys'
            control={<Checkbox defaultChecked />}
            checked={includePrivateKeys}
            onChange={(_, checked) => handleChangeIncludePrivateKeys(checked)}
          />
        </FormGroup>
      )}
    </BaseModal>
  );
};
