import type { NextPageWithLayout } from "./_app";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { pki, md } from "node-forge";
import { pythonServerUrlParams } from "../lib/pythonClient";
import { generateRsaKeypairInput } from "../lib/schemas";
import { download } from "../lib/download";
import { useConnectionTest } from "../context/ConnectionTest";
import { Layout } from "../components/Layout";
import { NextLinkComposed, TextField, Button } from "shared";
import {
  Box,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from "@mui/material";

type FormData = z.infer<typeof generateRsaKeypairInput>;

type BlobData = {
  data: string;
  uri: string;
};

type Keypair = {
  privateKey: BlobData;
  publicKey: BlobData;
  checksum: BlobData;
};

const createBlobUri = (content: string) =>
  URL.createObjectURL(new Blob([content], { type: "text/plain" }));

const generateRsaKeypair = (passphrase: string) =>
  new Promise<Keypair>((resolve, reject) =>
    pki.rsa.generateKeyPair({ bits: 4096, workers: 2 }, (err, keypair) => {
      if (err) {
        reject(err);
      }

      const { privateKey, publicKey } = keypair;

      const privateKeyPem = pki.encryptRsaPrivateKey(privateKey, "password", {
        algorithm: "aes128",
      });

      const publicKeyPem = pki.publicKeyToPem(publicKey);

      const checksum = md.md5.create().update(publicKeyPem).digest().toHex();

      resolve({
        privateKey: {
          data: privateKeyPem,
          uri: createBlobUri(privateKeyPem),
        },
        publicKey: {
          data: publicKeyPem,
          uri: createBlobUri(publicKeyPem),
        },
        checksum: {
          data: checksum,
          uri: createBlobUri(checksum),
        },
      });
    })
  );

const Setup: NextPageWithLayout = () => {
  const { isOnline } = useConnectionTest();

  const [activeStep, setActiveStep] = useState<2 | 3 | 4 | 5>(2);

  const [rsaKeypair, setRsaKeypair] = useState<Keypair | null>(null);

  const downloadedFilesRef = useRef({
    privateKey: false,
    publicKey: false,
    checksum: false,
  });

  const machineSetupColor = isOnline ? "error" : "success";

  useEffect(
    () => () => {
      if (!rsaKeypair) {
        return;
      }

      Object.keys(rsaKeypair).forEach((type) =>
        URL.revokeObjectURL(rsaKeypair[type as keyof Keypair].uri)
      );
    },
    [rsaKeypair]
  );

  const onDownload = (key: keyof typeof downloadedFilesRef.current) => {
    downloadedFilesRef.current[key] = true;

    const downloadedFiles = downloadedFilesRef.current;

    if (
      downloadedFiles.privateKey &&
      downloadedFiles.publicKey &&
      downloadedFiles.checksum
    ) {
      setActiveStep(4);
    } else if (downloadedFiles.privateKey) {
      setActiveStep(3);
    }
  };

  const onGenerateRsaKeypair = async ({ passphrase }: FormData) => {
    if (!passphrase?.trim()) {
      return;
    }

    const keypair = await generateRsaKeypair(passphrase);

    setRsaKeypair(keypair);

    download(keypair.privateKey.data, "fb-recovery-prv.pem", "text/plain");

    onDownload("privateKey");
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(generateRsaKeypairInput),
    defaultValues: {
      passphrase: "",
    },
  });

  const hasPassphrase = !!watch("passphrase")?.trim();

  return (
    <Box
      component="form"
      display="flex"
      flexDirection="column"
      marginBottom="2em"
      onSubmit={handleSubmit(onGenerateRsaKeypair)}
    >
      <Typography variant="h1">Setup Recovery Kit</Typography>
      <List sx={{ width: "100%" }} dense disablePadding>
        <ListItem sx={{ alignItems: "flex-start" }}>
          <ListItemAvatar>
            <Avatar
              sx={{
                background: (theme) => theme.palette[machineSetupColor].main,
              }}
            >
              1
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary="Set up the offline recovery machine"
            primaryTypographyProps={{ variant: "h2" }}
            secondary={
              <>
                Ensure that this dedicated recovery machine is:
                <ol>
                  <li>
                    <Typography
                      color={machineSetupColor}
                      fontWeight={isOnline ? 600 : undefined}
                    >
                      Offline and air-gapped
                      {isOnline &&
                        ". This machine is connected to a network. Please disconnect."}
                    </Typography>
                  </li>
                  <li>Accessible only by necessary, authorized personnel</li>
                  <li>Protected with a very strong password</li>
                  <li>Encrypted on all partitions</li>
                  <li>Stored in a safe box when not in use</li>
                </ol>
              </>
            }
          />
        </ListItem>
        <ListItem sx={{ alignItems: "flex-start" }}>
          <ListItemAvatar>
            <Avatar
              sx={{
                background: (theme) =>
                  activeStep > 2
                    ? theme.palette.success.main
                    : activeStep === 2
                    ? theme.palette.primary.main
                    : undefined,
              }}
            >
              2
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary="Generate the recovery keypair and checksum"
            primaryTypographyProps={{ variant: "h2" }}
            secondary={
              <>
                The recovery keypair is used for encrypting Fireblocks key
                shares and decrypting them in an offline environment. The
                checksum is used to verify the integrity of the recovery public
                key.{" "}
                <Typography fontWeight={600}>
                  Store your recovery private key in a secure location!
                </Typography>
              </>
            }
          />
        </ListItem>
        <ListItem sx={{ paddingLeft: "4.5rem" }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                id="rsaKeyPassphrase"
                type="password"
                label="RSA Key Passphrase"
                error={errors.passphrase?.message}
                disabled={activeStep < 2}
                {...register("passphrase")}
              />
            </Grid>
            <Grid item xs={6}>
              <Button
                type="submit"
                color="primary"
                fullWidth
                disabled={!hasPassphrase || activeStep < 2}
              >
                Generate Recovery Keypair
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                color="primary"
                fullWidth
                disabled={!rsaKeypair}
                onClick={() => onDownload("privateKey")}
                component="a"
                href={rsaKeypair?.privateKey.uri ?? ""}
                download="fb-recovery-prv.pem"
              >
                Download Private Key
              </Button>
            </Grid>
          </Grid>
        </ListItem>
        <ListItem sx={{ alignItems: "flex-start" }}>
          <ListItemAvatar>
            <Avatar
              sx={{
                background: (theme) =>
                  activeStep > 3
                    ? theme.palette.success.main
                    : activeStep === 3
                    ? theme.palette.primary.main
                    : undefined,
              }}
            >
              3
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary="Send the recovery public key to Fireblocks"
            primaryTypographyProps={{ variant: "h2" }}
            secondary="Send the recovery public key and its checksum to Fireblocks Support. Once Fireblocks Support receives the key, you are contacted to perform an integrity check on the key and verify it has not been tampered with."
          />
        </ListItem>
        <ListItem sx={{ paddingLeft: "4.5rem" }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button
                color="primary"
                fullWidth
                disabled={activeStep < 3}
                onClick={() => onDownload("publicKey")}
                component="a"
                href={rsaKeypair?.publicKey.uri ?? ""}
                download="fb-recovery-pub.pem"
              >
                Download Public Key
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                color="primary"
                fullWidth
                disabled={activeStep < 3}
                onClick={() => onDownload("checksum")}
                component="a"
                href={rsaKeypair?.checksum.uri ?? ""}
                download="fb-recovery-pub.md5"
              >
                Download Checksum
              </Button>
            </Grid>
          </Grid>
        </ListItem>
        <ListItem sx={{ alignItems: "flex-start" }}>
          <ListItemAvatar>
            <Avatar
              sx={{
                background: (theme) =>
                  activeStep === 4 ? theme.palette.primary.main : undefined,
              }}
            >
              4
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary="Download the offline key recovery package"
            primaryTypographyProps={{ variant: "h2" }}
            secondary={
              <>
                <Typography variant="body1" paragraph>
                  After the integrity check on the public key is complete, an
                  encrypted key backup ZIP file containing both your key shares
                  and Fireblocks key shares is generated. Your key shares are
                  encrypted using the recovery passphrase entered during the
                  owner&apos;s mobile setup. The Fireblocks key shares are
                  encrypted using your public key.
                </Typography>
                <Typography variant="body1" paragraph>
                  You will receive a time-limited link to download the backup
                  file. Download the package and store it safely and
                  redundantly. Preferably it should be stored separately from
                  the machine that stores the recovery private key.
                </Typography>
              </>
            }
          />
        </ListItem>
        <ListItem sx={{ alignItems: "flex-start" }}>
          <ListItemAvatar>
            <Avatar>5</Avatar>
          </ListItemAvatar>
          <ListItemText
            primary="Verify Recovery Kit"
            primaryTypographyProps={{ variant: "h2" }}
            secondary="Use Recovery Utility to verify that your recovery system can restore access to your Fireblocks assets in a disaster scenario. Check that the recovered Fireblocks extended public keys match the keys in your Fireblocks Console Settings. The public keys and private keys of all of wallets in this workspace are derived from the extended public keys and private keys."
          />
        </ListItem>
        <ListItem sx={{ paddingLeft: "4.5rem" }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button
                color="primary"
                fullWidth
                component={NextLinkComposed}
                to={{
                  pathname: "/recover",
                  query: { ...pythonServerUrlParams, verifyOnly: true },
                }}
                disabled={activeStep < 4}
              >
                Verify Recovery Kit
              </Button>
            </Grid>
          </Grid>
        </ListItem>
      </List>
    </Box>
  );
};

Setup.getLayout = (page) => (
  <Layout showBack hideNavigation hideSidebar>
    {page}
  </Layout>
);

export default Setup;
