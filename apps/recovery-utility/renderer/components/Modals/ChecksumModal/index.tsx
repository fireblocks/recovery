import { useState, MouseEvent } from 'react';
import { Typography, Box, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { theme, monospaceFontFamily, Button, BaseModal, QrCode } from '@fireblocks/recovery-shared';

type Props = {
  publicKey: string;
  open: boolean;
  onClose: VoidFunction;
};

enum ApprovalMethod {
  SHORT_KEY = 'SHORT_KEY',
  QR_CODE = 'QR_CODE',
}

const getShortKey = async (publicKey: string) => {
  const publicKeyBuffer = new TextEncoder().encode(publicKey);

  const digestBuffer = await crypto.subtle.digest('SHA-256', publicKeyBuffer);

  const digestArray = Array.from(new Uint8Array(digestBuffer));

  const digestBase64 = btoa(String.fromCharCode.apply(null, digestArray));

  const shortKey = digestBase64.slice(0, 8);

  return shortKey;
};

export function ChecksumModal({ publicKey, open, onClose }: Props) {
  const [approvalMethod, setApprovalMethod] = useState<ApprovalMethod>(ApprovalMethod.QR_CODE);

  const isShortKey = approvalMethod === ApprovalMethod.SHORT_KEY;

  const isQrCode = approvalMethod === ApprovalMethod.QR_CODE;

  const { data: shortKey } = useQuery({
    queryKey: [approvalMethod, publicKey],
    enabled: !!publicKey && isShortKey,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    queryFn: async () => getShortKey(publicKey),
  });

  const onChangeApprovalMethod = (event: MouseEvent<HTMLElement>, newApprovalMethod: ApprovalMethod | null) => {
    if (newApprovalMethod !== null) {
      setApprovalMethod(newApprovalMethod);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title='Approve Recovery Public Key'
      actions={
        <Button variant='text' onClick={onClose}>
          Close
        </Button>
      }
    >
      <ToggleButtonGroup
        value={approvalMethod}
        color='primary'
        fullWidth
        exclusive
        onChange={onChangeApprovalMethod}
        aria-label='Approval method'
      >
        <ToggleButton value={ApprovalMethod.SHORT_KEY}>Input short key</ToggleButton>
        <ToggleButton value={ApprovalMethod.QR_CODE}>Scan QR code</ToggleButton>
      </ToggleButtonGroup>
      <Box marginTop='1em' display='flex' alignItems='center' justifyContent='center'>
        {isShortKey && (
          <Typography component='span' color='#000' fontFamily={monospaceFontFamily} fontSize='4em'>
            {shortKey}
          </Typography>
        )}
        {isQrCode && (
          <QrCode
            data={publicKey}
            title='Public key QR code'
            bgColor={theme.palette.background.default}
            showRawData={false}
            height='100%'
            maxHeight={300}
          />
        )}
      </Box>
      {/*
      <FormGroup>
        <FormControlLabel
          label="Include private keys"
          control={<Checkbox defaultChecked />}
          checked={includePrivateKeys}
          onChange={(_, checked) => handleChangeIncludePrivateKeys(checked)}
        />
      </FormGroup>
*/}
    </BaseModal>
  );
}
