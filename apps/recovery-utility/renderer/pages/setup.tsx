import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { pki } from 'node-forge';
import {
  NextLinkComposed,
  TextField,
  Button,
  generateRsaKeypairInput,
  theme,
  BaseModal,
  monospaceFontFamily,
} from '@fireblocks/recovery-shared';
import {
  Box,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { download } from '@fireblocks/recovery-shared/lib/download';
import AdmZip from 'adm-zip';
import { useConnectionTest } from '../context/ConnectionTest';
import { ChecksumModal } from '../components/Modals/ChecksumModal';
import { PublicKeyModal } from '../components/Modals/PublicKeyModal';

type FormData = z.infer<typeof generateRsaKeypairInput>;

type BlobData = {
  data: string;
  uri: string;
};

type Keypair = {
  privateKey: BlobData;
  publicKey: BlobData;
};

const createBlobUri = (content: string) => URL.createObjectURL(new Blob([content], { type: 'text/plain' }));

const generateRsaKeypair = (passphrase: string) =>
  new Promise<Keypair>((resolve, reject) => {
    pki.rsa.generateKeyPair({ bits: 4096, workers: 2 }, (err, keypair) => {
      if (err) {
        reject(err);
      }

      const { privateKey, publicKey } = keypair;

      const privateKeyPem = pki.encryptRsaPrivateKey(privateKey, passphrase, {
        legacy: true,
        algorithm: 'aes128',
        prfAlgorithm: 'sha256',
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
    });
  });

const Setup = () => {
  const { isOnline } = useConnectionTest();

  const [activeStep, setActiveStep] = useState<2 | 3 | 4 | 5 | 6 | 7>(2);

  const [rsaKeypair, setRsaKeypair] = useState<Keypair | null>(null);

  const [isChecksumModalOpen, setIsChecksumModalOpen] = useState(false);

  const [step6Checked, setStep6Checked] = useState<boolean>(false);

  const [isPublicKeyModalOpen, setIsPublicKeyModalOpen] = useState<boolean>(false);

  const onOpenChecksumModal = () => {
    setActiveStep(5);

    setIsChecksumModalOpen(true);
  };

  const onCloseChecksumModal = () => setIsChecksumModalOpen(false);

  const onClosePublicKeyModal = () => setIsPublicKeyModalOpen(false);

  useEffect(
    () => () => {
      if (!rsaKeypair) {
        return;
      }

      Object.keys(rsaKeypair).forEach((type) => URL.revokeObjectURL(rsaKeypair[type as keyof Keypair].uri));
    },
    [rsaKeypair],
  );

  const onGenerateRsaKeypair = async ({ passphrase }: FormData) => {
    if (!passphrase?.trim()) {
      return;
    }

    const keypair = await generateRsaKeypair(passphrase);

    setRsaKeypair(keypair);

    setActiveStep(3);
  };

  const downloadKeys = async () => {
    const zip = new AdmZip();
    const timestamp = Math.floor(Date.now() / 1000);
    zip.addFile(`privateKey_${timestamp}.pem`, Buffer.from(rsaKeypair!.privateKey.data));
    zip.addFile(`publicKey_${timestamp}.pem`, Buffer.from(rsaKeypair!.publicKey.data));

    const zipBuf = zip.toBuffer();

    download(zipBuf, `keys_${timestamp}.zip`, 'application/zip');

    setActiveStep(4);
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(generateRsaKeypairInput),
    defaultValues: {
      passphrase: '',
    },
  });

  const machineSetupColor = isOnline ? theme.palette.error.main : theme.palette.success.main;

  const stepColor = (step: 2 | 3 | 4 | 5 | 6 | 7) => {
    if (activeStep > step) {
      return theme.palette.success.main;
    }

    if (activeStep === step) {
      return theme.palette.primary.main;
    }

    return undefined;
  };

  const onShowPublicKeyModal = () => setIsPublicKeyModalOpen(true);

  return (
    <Box component='form' display='flex' flexDirection='column' marginBottom='2em' onSubmit={handleSubmit(onGenerateRsaKeypair)}>
      <Typography variant='h1'>Set Up Recovery Kit</Typography>
      <List sx={{ width: '100%' }} dense disablePadding>
        <ListItem sx={{ alignItems: 'flex-start' }}>
          <ListItemAvatar>
            <Avatar sx={{ background: machineSetupColor }}>1</Avatar>
          </ListItemAvatar>
          <ListItemText
            primary='Set up the offline recovery machine'
            primaryTypographyProps={{ variant: 'h2' }}
            secondary={
              <>
                Ensure that this dedicated recovery machine is:
                <br />
                <Typography color={machineSetupColor} fontWeight={isOnline ? 600 : undefined}>
                  &nbsp;&nbsp;&nbsp;1.&nbsp; Offline and air-gapped
                  {isOnline && ' This machine is connected to a network. Please disconnect.'}
                </Typography>
                &nbsp;&nbsp;&nbsp;2.&nbsp; Accessible only by necessary, authorized personnel
                <br />
                &nbsp;&nbsp;&nbsp;3.&nbsp; Protected with a very strong password <br />
                &nbsp;&nbsp;&nbsp;4.&nbsp; Encrypted on all partitions <br />
                &nbsp;&nbsp;&nbsp;5.&nbsp; Stored in a safe box when not in use
              </>
            }
          />
        </ListItem>
        <ListItem sx={{ alignItems: 'flex-start' }}>
          <ListItemAvatar>
            <Avatar sx={{ background: stepColor(2) }}>2</Avatar>
          </ListItemAvatar>
          <ListItemText
            primary='Generate the recovery keypair'
            primaryTypographyProps={{ variant: 'h2' }}
            secondary={
              <>
                <Typography variant='body1' paragraph>
                  The recovery keypair is used as part of the key backup process to encrypt (and decrypt during disaster recovery)
                  the key shares that form your private key.
                </Typography>
                <Typography fontWeight={600} paragraph>
                  Store your recovery private key and its passphrase redundantly in a secure location! You will need them to
                  recover the assets you have stored in your Fireblocks wallets.
                </Typography>
              </>
            }
          />
        </ListItem>
        <ListItem sx={{ paddingLeft: '4.5rem' }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                id='rsaKeyPassphrase'
                type='password'
                label='Recovery Private Key Passphrase'
                error={errors.passphrase?.message}
                disabled={activeStep < 2 || !!rsaKeypair}
                {...register('passphrase')}
              />
            </Grid>
            <Grid item xs={6}>
              <Button type='submit' color='primary' fullWidth disabled={activeStep > 2}>
                Generate Recovery Keys
              </Button>
            </Grid>
            {/* <Grid item xs={6}>
              <Button
                color='primary'
                fullWidth
                disabled={!rsaKeypair}
                onClick={() => onDownload('privateKey')}
                component='a'
                href={rsaKeypair?.privateKey.uri ?? ''}
                download='fb-recovery-prv.pem'
              >
                Download Private Key
              </Button>
            </Grid> */}
          </Grid>
        </ListItem>
        <ListItem sx={{ alignItems: 'flex-start' }}>
          <ListItemAvatar>
            <Avatar sx={{ background: stepColor(3) }}>3</Avatar>
          </ListItemAvatar>
          <ListItemText
            primary='Download the recovery keys and start backup process'
            primaryTypographyProps={{ variant: 'h2' }}
            secondary='Download the keys zip, extract the public key from the zip file and upload it to the Fireblocks Console by going to Settings > (General) > Key backup and recovery.'
          />
        </ListItem>
        <ListItem sx={{ paddingLeft: '4.5rem' }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button color='primary' fullWidth disabled={activeStep < 3} onClick={() => downloadKeys()}>
                Download Keys Zip
              </Button>
            </Grid>
          </Grid>
        </ListItem>
        <ListItem sx={{ alignItems: 'flex-start' }}>
          <ListItemAvatar>
            <Avatar sx={{ background: stepColor(4) }}>4</Avatar>
          </ListItemAvatar>
          <ListItemText
            primary='Approve the recovery public key'
            primaryTypographyProps={{ variant: 'h2' }}
            secondary='Use the Fireblocks Mobile app to approve the recovery public key.'
          />
        </ListItem>
        <ListItem sx={{ paddingLeft: '4.5rem' }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button color='primary' fullWidth disabled={activeStep < 4} onClick={onOpenChecksumModal}>
                Start Approval
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button color='primary' fullWidth disabled={activeStep < 5} onClick={onShowPublicKeyModal}>
                View Public Key
              </Button>
            </Grid>
          </Grid>
        </ListItem>
        <ListItem sx={{ alignItems: 'flex-start' }}>
          <ListItemAvatar>
            <Avatar sx={{ background: stepColor(5) }}>5</Avatar>
          </ListItemAvatar>
          <ListItemText
            primary='Download and secure the Recovery Kit'
            primaryTypographyProps={{ variant: 'h2' }}
            secondary={
              <>
                <Typography variant='body1' paragraph>
                  After the integrity check on the public key is complete, an encrypted key backup ZIP file (&quot;Recovery
                  Kit&quot;) containing both your key shares and Fireblocks key shares is generated. Your key shares are encrypted
                  using the recovery passphrase entered during the owner&apos;s mobile app setup. The Fireblocks key shares are
                  encrypted using your recovery public key.
                </Typography>
                <Typography fontWeight={600}>
                  Store your Recovery Kit redundantly in a secure location, preferably not on the same machine that stores the
                  recovery private key! You will need it to recover your Fireblocks assets.
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      onChange={(_, checked) => {
                        setStep6Checked(!checked ? false : step6Checked);
                        setActiveStep(checked ? 6 : 5);
                      }}
                    />
                  }
                  disabled={activeStep < 5}
                  label='I have downloaded and secured the recovery kit'
                />
              </>
            }
          />
        </ListItem>
        <ListItem sx={{ alignItems: 'flex-start' }}>
          <ListItemAvatar>
            <Avatar sx={{ background: stepColor(6) }}>6</Avatar>
          </ListItemAvatar>
          <ListItemText
            primary='Check your key recovery materials'
            primaryTypographyProps={{ variant: 'h2' }}
            secondary={
              <>
                <Typography variant='body1' paragraph>
                  Ensure that you have securely and redundantly stored all key recovery materials to prepare for a disaster
                  recovery. All of the following materials must be accessible to recover your Fireblocks assets:
                </Typography>
                &nbsp;&nbsp;&nbsp;1.&nbsp;Recovery private key
                <br />
                &nbsp;&nbsp;&nbsp;2.&nbsp;Recovery private key passphrase
                <br />
                &nbsp;&nbsp;&nbsp;3.&nbsp;Recovery Kit .ZIP file <br />
                &nbsp;&nbsp;&nbsp;4.&nbsp;Owner&apos;s mobile app recovery passphrase
                <FormControlLabel
                  control={
                    <Checkbox
                      onChange={(_, checked) => {
                        setStep6Checked(checked);
                        setActiveStep(checked ? 7 : 6);
                      }}
                    />
                  }
                  checked={step6Checked}
                  disabled={activeStep < 6}
                  label='I have verified I have all the recovery materials'
                />
              </>
            }
          />
        </ListItem>
        <ListItem sx={{ alignItems: 'flex-start' }}>
          <ListItemAvatar>
            <Avatar sx={{ background: stepColor(7) }}>7</Avatar>
          </ListItemAvatar>
          <ListItemText
            primary='Verify the recovery kit'
            primaryTypographyProps={{ variant: 'h2' }}
            secondary='Use Recovery Utility to verify that your recovery kit infact matches the your workspace. Check that the recovered Fireblocks extended public keys match the keys in your Fireblocks Console Settings.'
          />
        </ListItem>
        <ListItem sx={{ paddingLeft: '4.5rem' }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button color='primary' fullWidth component={NextLinkComposed} to='/verify' disabled={activeStep < 5}>
                Verify Recovery Kit
              </Button>
            </Grid>
          </Grid>
        </ListItem>
      </List>
      <ChecksumModal publicKey={rsaKeypair?.publicKey.data ?? ''} open={isChecksumModalOpen} onClose={onCloseChecksumModal} />
      <PublicKeyModal publicKey={rsaKeypair?.publicKey.data ?? ''} open={isPublicKeyModalOpen} onClose={onClosePublicKeyModal} />
    </Box>
  );
};

export default Setup;
