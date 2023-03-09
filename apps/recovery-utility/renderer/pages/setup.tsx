import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { pki } from "node-forge";
import {
  NextLinkComposed,
  TextField,
  Button,
} from "@fireblocks/recovery-shared";
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
import { generateRsaKeypairInput } from "../lib/schemas";
import { download } from "@fireblocks/recovery-shared/lib/download";
import { useConnectionTest } from "../context/ConnectionTest";
import { Layout } from "../components/Layout";
import type { NextPageWithLayout } from "./_app";
import { ChecksumModal } from "../components/Modals/ChecksumModal";

type FormData = z.infer<typeof generateRsaKeypairInput>;

type BlobData = {
  data: string;
  uri: string;
};

type Keypair = {
  privateKey: BlobData;
  publicKey: BlobData;
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

      resolve({
        privateKey: {
          data: privateKeyPem,
          uri: createBlobUri(privateKeyPem),
        },
        publicKey: {
          data: publicKeyPem,
          uri: createBlobUri(publicKeyPem),
        },
      });
    })
  );

const Setup: NextPageWithLayout = () => {
  const { isOnline } = useConnectionTest();

  const machineSetupColor = isOnline ? "error" : "success";

  const [activeStep, setActiveStep] = useState<2 | 3 | 4 | 5>(2);

  const [rsaKeypair, setRsaKeypair] = useState<Keypair | null>(null);

  const [isChecksumModalOpen, setIsChecksumModalOpen] = useState(false);

  const onOpenChecksumModal = () => {
    setActiveStep(5);

    setIsChecksumModalOpen(true);
  };

  const onCloseChecksumModal = () => setIsChecksumModalOpen(false);

  const downloadedFilesRef = useRef({
    privateKey: false,
    publicKey: false,
  });

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

    if (downloadedFiles.privateKey && downloadedFiles.publicKey) {
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
      <Typography variant="h1">Set Up Recovery Kit</Typography>
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
            primary="Generate the recovery keypair"
            primaryTypographyProps={{ variant: "h2" }}
            secondary={
              <>
                <Typography variant="body1" paragraph>
                  The recovery keypair is used for encrypting Fireblocks key
                  shares and decrypting them in a disaster scenario.
                </Typography>
                <Typography fontWeight={600} paragraph>
                  Store your recovery private key and its passphrase redundantly
                  in a secure location! You will need them to recover your
                  Fireblocks assets.
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
                label="Recovery Private Key Passphrase"
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
            secondary="Upload the recovery public key to the Fireblocks Console > Settings > Key backup and recovery."
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
          </Grid>
        </ListItem>
        <ListItem sx={{ alignItems: "flex-start" }}>
          <ListItemAvatar>
            <Avatar
              sx={{
                background: (theme) =>
                  activeStep > 4
                    ? theme.palette.success.main
                    : activeStep === 4
                    ? theme.palette.primary.main
                    : undefined,
              }}
            >
              4
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary="Approve the recovery public key"
            primaryTypographyProps={{ variant: "h2" }}
            secondary="Use the Fireblocks Mobile app to approve the recovery public key."
          />
        </ListItem>
        <ListItem sx={{ paddingLeft: "4.5rem" }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button
                color="primary"
                fullWidth
                disabled={activeStep < 4}
                onClick={onOpenChecksumModal}
              >
                Start Approval
              </Button>
            </Grid>
          </Grid>
        </ListItem>
        <ListItem sx={{ alignItems: "flex-start" }}>
          <ListItemAvatar>
            <Avatar
              sx={{
                background: (theme) =>
                  activeStep === 5 ? theme.palette.primary.main : undefined,
              }}
            >
              5
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary="Download and secure the Recovery Kit"
            primaryTypographyProps={{ variant: "h2" }}
            secondary={
              <>
                <Typography variant="body1" paragraph>
                  After the integrity check on the public key is complete, an
                  encrypted key backup ZIP file (&quot;Recovery Kit&quot;)
                  containing both your key shares and Fireblocks key shares is
                  generated. Your key shares are encrypted using the recovery
                  passphrase entered during the owner&apos;s mobile app setup.
                  The Fireblocks key shares are encrypted using your recovery
                  public key.
                </Typography>
                <Typography fontWeight={600}>
                  Store your Recovery Kit redundantly in a secure location,
                  preferably not on the same machine that stores the recovery
                  private key! You will need it to recover your Fireblocks
                  assets.
                </Typography>
              </>
            }
          />
        </ListItem>
        <ListItem sx={{ alignItems: "flex-start" }}>
          <ListItemAvatar>
            <Avatar>6</Avatar>
          </ListItemAvatar>
          <ListItemText
            primary="Check your key recovery materials"
            primaryTypographyProps={{ variant: "h2" }}
            secondary={
              <>
                <Typography variant="body1" paragraph>
                  Ensure that you have securely and redundantly stored all key
                  recovery materials to prepare for a disaster recovery. All of
                  the following materials must be accessible to recover your
                  Fireblocks assets:
                </Typography>
                <ol>
                  <li>Recovery private key</li>
                  <li>Recovery private key passphrase</li>
                  <li>Recovery Kit .ZIP file</li>
                  <li>Owner&apos;s mobile app recovery passphrase</li>
                </ol>
              </>
            }
          />
        </ListItem>
        <ListItem sx={{ alignItems: "flex-start" }}>
          <ListItemAvatar>
            <Avatar>7</Avatar>
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
                  query: { verifyOnly: true },
                }}
                disabled={activeStep < 5}
              >
                Verify Recovery Kit
              </Button>
            </Grid>
          </Grid>
        </ListItem>
      </List>
      <ChecksumModal
        publicKey={rsaKeypair?.publicKey.data ?? ""}
        open={isChecksumModalOpen}
        onClose={onCloseChecksumModal}
      />
    </Box>
  );
};

Setup.getLayout = (page) => (
  <Layout showBack hideNavigation>
    {page}
  </Layout>
);

export default Setup;
