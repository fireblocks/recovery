import { BaseModal, monospaceFontFamily } from '@fireblocks/recovery-shared';
import { Button, Typography } from '@mui/material';

type Props = {
  publicKey: string;
  open: boolean;
  onClose: VoidFunction;
};

export const PublicKeyModal = ({ publicKey, open, onClose }: Props) => {
  return publicKey.length > 0 ? (
    <BaseModal
      open={open}
      onClose={onClose}
      actions={
        <>
          <Button variant='text' onClick={onClose}>
            Close
          </Button>
        </>
      }
      title='Public Key'
    >
      <Typography>
        Compare the public key shown below to the one seen in the mobile app to verify the correct public key is used:
        <br />
        <br />
      </Typography>
      <Typography
        style={{
          fontFamily: monospaceFontFamily,
          fontSize: '95%',
          paddingLeft: '1%',
        }}
      >
        1.&nbsp;-----BEGIN PUBLIC KEY-----
      </Typography>
      {publicKey
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .match(/.{1,64}/g)!
        .map((str: string, idx: number) => {
          return (
            <>
              <Typography
                style={{
                  fontFamily: monospaceFontFamily,
                  fontSize: '95%',
                  paddingLeft: '1%',
                }}
              >
                {idx + 2}.&nbsp;{str}
              </Typography>
            </>
          );
        })}
      <Typography
        style={{
          fontFamily: monospaceFontFamily,
          fontSize: '95%',
          paddingLeft: '1%',
        }}
      >
        {Math.floor((publicKey.length - 50) / 64) + 3}.&nbsp;-----END PUBLIC KEY-----
      </Typography>
    </BaseModal>
  ) : (
    <></>
  );
};
