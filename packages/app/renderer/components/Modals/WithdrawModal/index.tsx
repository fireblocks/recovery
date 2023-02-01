import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Typography,
  Box,
  Grid,
  Autocomplete,
  TextField,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  // TextField,
  AssetId,
  assets,
  theme,
  getAssetInfo,
  AssetInfo,
  AssetIcon,
} from "shared";
import { BaseModal } from "../BaseModal";
import { getRelayUrl } from "../../../lib/relayUrl";
import { useSettings } from "../../../context/Settings";
import { useWorkspace, VaultAccount } from "../../../context/Workspace";
import { VaultAccountIcon } from "../../../components/Icons";
import { QrCode } from "../../../components/QrCode";

type Props = {
  assetId?: string;
  accountId?: number;
  open: boolean;
  onClose: VoidFunction;
};

export const WithdrawModal = ({
  assetId: _assetId,
  accountId: _accountId,
  open,
  onClose,
}: Props) => {
  const { relayBaseUrl } = useSettings();

  const { vaultAccounts } = useWorkspace();

  const [account, setAccount] = useState<VaultAccount | undefined>(() =>
    vaultAccounts.find((account) => account.id === _accountId)
  );

  const onChangeAccount = (newAccount: VaultAccount | null) =>
    setAccount(newAccount ?? undefined);

  const [asset, setAsset] = useState<AssetInfo | undefined>(
    _assetId ? getAssetInfo(_assetId) : undefined
  );

  const onChangeAsset = (newAsset: AssetInfo | null) =>
    setAsset(newAsset ?? undefined);

  const wallet = account?.wallets.find(
    (wallet) => wallet.assetId === asset?.id
  );

  // TODO: Sent xpub to server to get all addresses
  const derivation = wallet?.derivations[0];
  const address = derivation?.address;
  const privateKey = derivation?.privateKey;

  const relayUrlQuery = useQuery({
    queryKey: ["relayUrl", address, privateKey, relayBaseUrl],
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
    <BaseModal open={open} onClose={onClose} title="New Withdrawal">
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                id="assetId"
                autoComplete
                // autoSelect
                // blurOnSelect
                // includeInputInList
                value={(asset ?? { id: "" }) as AssetInfo}
                options={assets}
                getOptionLabel={(option) => option.id}
                renderInput={(params) => (
                  <TextField {...params} fullWidth label="Asset" />
                )}
                renderOption={(props, option, { selected }) => (
                  <ListItemButton
                    selected={selected}
                    dense
                    divider
                    onClick={() => onChangeAsset(option)}
                    sx={{ transition: "none" }}
                  >
                    <ListItemIcon>
                      <Box
                        width={40}
                        height={40}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        borderRadius={40}
                        border={(theme) =>
                          `solid 1px ${theme.palette.grey[300]}`
                        }
                        sx={{ background: "#FFF" }}
                      >
                        <AssetIcon assetId={option.id} />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primaryTypographyProps={{ variant: "h2" }}
                      primary={option.id}
                      secondary={option.name}
                    />
                  </ListItemButton>
                )}
                onChange={(_, newAsset) => onChangeAsset(newAsset)}
                sx={{ width: 300 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                id="accountId"
                autoComplete
                // autoSelect
                // blurOnSelect
                // includeInputInList
                value={(account ?? { name: "" }) as VaultAccount}
                options={vaultAccounts}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField {...params} fullWidth label="From" />
                )}
                renderOption={(props, option, { selected }) => (
                  <ListItemButton
                    selected={selected}
                    dense
                    divider
                    onClick={() => onChangeAccount(option)}
                    sx={{ transition: "none" }}
                  >
                    <ListItemIcon>
                      <Box
                        width={40}
                        height={40}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        borderRadius={40}
                        border={(theme) =>
                          `solid 1px ${theme.palette.grey[300]}`
                        }
                        sx={{ background: "#FFF" }}
                      >
                        <VaultAccountIcon />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primaryTypographyProps={{ variant: "h2" }}
                      primary={option.id}
                      secondary={option.name}
                    />
                  </ListItemButton>
                )}
                onChange={(_, newAccount) => onChangeAccount(newAccount)}
                sx={{ width: 300 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1" paragraph>
                Scan the QR code with an online device to send a transaction
                with Fireblocks Recovery Relay. Use the PIN to decrypt the{" "}
                {asset?.name} private key.
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={6}>
          <Box>
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
              // isMonospace
              // formControlProps={{ sx: { marginTop: "1em" } }}
              sx={{ marginTop: "1em" }}
            />
          </Box>
        </Grid>
      </Grid>
    </BaseModal>
  );
};
