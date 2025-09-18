import React from 'react';
import { Box, Grid, Typography, InputAdornment, Divider, Tooltip } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { Link, monospaceFontFamily, TextField, UtilityExtendedKeys } from '@fireblocks/recovery-shared';
import { RecoveredKey } from '@fireblocks/extended-key-recovery/src/types';
import { sha256 } from '@noble/hashes/sha256';

type FormData = UtilityExtendedKeys;

type Props = {
  supportsPrivateKeys: boolean;
  extendedKeys?: FormData;
};

export const ExtendedKeysBasePage = ({ supportsPrivateKeys, extendedKeys }: Props) => {
  // const router = useRouter();
  const [hasExtendedPrivateKeys, hasExtendedPublicKeys] = Object.entries(extendedKeys || {})
    .filter(([keysetId]) => keysetId !== 'ncwMaster')
    .map(([, value]) => {
      const key = value as RecoveredKey;
      let xpub = false;
      let fpub = false;
      let xprv = false;
      let fprv = false;
      if (key.ecdsaExists) {
        xprv = key.xprv !== undefined;
        xpub = key.xpub !== undefined;
      }
      if (key.eddsaExists) {
        fprv = key.fprv !== undefined;
        fpub = key.fpub !== undefined;
      }

      return [xpub, xprv, fpub, fprv];
    })
    .reduce((prev, curr) => [prev[0] || curr[1] || curr[3], prev[1] || curr[0] || curr[2]], [false, false]) as [boolean, boolean];
  const showPrivate = supportsPrivateKeys && hasExtendedPrivateKeys;

  return (
    <Box component='form' height='100%' display='flex' flexDirection='column' marginBottom={2.5}>
      <Typography variant='h1'>Extended {showPrivate ? '' : 'Public '}Keys</Typography>
      {hasExtendedPublicKeys && (
        <Typography variant='body1' paragraph>
          Check that the recovered Fireblocks extended public keys match the keys in your Fireblocks Console Settings.
        </Typography>
      )}
      <Typography variant='body1' paragraph>
        Addresses, public keys, and private keys of all of Fireblocks wallets are derived from your workspace's extended public
        and private key.
      </Typography>
      <Typography variant='body1' paragraph>
        ECDSA extended keys (
        <Typography component='span' fontFamily={monospaceFontFamily}>
          xpub/xprv
        </Typography>
        ) can be used with wallet software that imports BIP32 extended private keys. Fireblocks EdDSA extended keys (
        <Typography component='span' fontFamily={monospaceFontFamily}>
          fpub/fprv
        </Typography>
        ) are Fireblocks-specific and can only be used by Fireblocks software.
      </Typography>
      {!hasExtendedPublicKeys && (
        <Typography variant='body1' paragraph>
          {/* Set your extended public keys (
          <Typography component='span' fontFamily={monospaceFontFamily}>
            xpub/fpub
          </Typography>
          ) to derive wallet addresses and public keys for recovery verification. */}
          {supportsPrivateKeys && (
            <>
              {' '}
              In a disaster recovery scenario, you can set your private keys (
              <Typography component='span' fontFamily={monospaceFontFamily}>
                xprv/fprv
              </Typography>
              ) to derive wallet private keys and sign transactions. <Link href='/recover'>Use your Recovery Kit</Link> to obtain
              your private keys.
            </>
          )}
        </Typography>
      )}

      {!hasExtendedPrivateKeys && !hasExtendedPublicKeys && (
        <Typography variant='h2' paragraph textAlign='center'>
          No keys defined, please recover wallet in order to see public keys
        </Typography>
      )}

      <Box paddingBottom={2}>
        {Object.entries(extendedKeys || {})
          .filter(([keysetId]) => keysetId !== 'ncwMaster')
          .map(([keysetId, value], index) => {
            const key = value as RecoveredKey;
            if (!key.ecdsaExists && !key.eddsaExists) {
              return <Typography>Keyset {index + 1} is not used </Typography>;
            }
            return (
              <Box component='fieldset' borderRadius={5} padding={1} border={(_theme) => `solid 1px ${_theme.palette.grey[300]}`}>
                <legend>
                  <Typography variant='h2' marginBottom='0'>
                    {Object.entries(extendedKeys || {}).filter(([id]) => id !== 'ncwMaster').length > 1
                      ? `Keyset ${index + 1}`
                      : 'Workspace Keys'}
                  </Typography>
                </legend>
                <Grid container spacing={2}>
                  {key.ecdsaExists && (
                    <>
                      <Grid item xs={12}>
                        <Divider sx={{ paddingLeft: '0.5em', paddingRight: '0.5em' }}>
                          <Typography variant='h4' marginBottom='0'>
                            ECDSA Extended Keys {key.ecdsaExists ? '' : ' - Disabled'}
                          </Typography>
                        </Divider>
                      </Grid>
                      <Grid item xs={hasExtendedPrivateKeys ? 6 : 12}>
                        <TextField
                          id={`xpub-${keysetId}`}
                          label='xpub (ECDSA)'
                          enableCopy={!!key.xpub}
                          value={key.xpub}
                          isMonospace
                          // onMouseEnter={}
                          {...(key.ecdsaExists
                            ? {
                                endAdornment:
                                  key.fpub && key.fprv ? (
                                    <InputAdornment position='end'>
                                      <CheckCircle color='success' />
                                    </InputAdornment>
                                  ) : null,
                              }
                            : { disabled: true, sx: { backgroundColor: '#cacaca' } })}
                        />
                      </Grid>
                      {hasExtendedPrivateKeys && (
                        <Grid item xs={6}>
                          <TextField
                            id={`xprv-${keysetId}`}
                            label='xprv (ECDSA)'
                            value={key.xprv}
                            enableCopy={!!key.xprv}
                            isMonospace
                            {...(key.ecdsaExists
                              ? {
                                  type: 'password',
                                  confirmRevealRequired: true,
                                  confirmMessage:
                                    'WARNING - You are about to reveal your extended private key (ECDSA).\nMake sure this machine is OFFLINE and only accessible by authorized personnel.',
                                }
                              : { disabled: true, sx: { backgroundColor: '#cacaca' } })}
                          />
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <Tooltip title={Buffer.from(sha256(key.xpub!)).toString('hex')}>
                          <TextField
                            id={`xpub-ver-${keysetId}`}
                            label='ECDSA Verification Code'
                            isMonospace
                            disabled
                            {...(key.ecdsaExists
                              ? {
                                  value: Buffer.from(sha256(key.xpub!)).toString('hex'),
                                  enableCopy: !!key.xpub,
                                }
                              : { disabled: true, sx: { backgroundColor: '#cacaca' } })}
                          />
                        </Tooltip>
                      </Grid>
                    </>
                  )}
                  {key.eddsaExists && (
                    <>
                      <Grid item xs={12}>
                        <Divider sx={{ paddingLeft: '0.5em', paddingRight: '0.5em' }}>
                          <Typography variant='h4' marginBottom='0'>
                            EdDSA Extended Keys {key.eddsaExists ? '' : ' - Disabled'}
                          </Typography>
                        </Divider>
                      </Grid>

                      <Grid item xs={hasExtendedPrivateKeys ? 6 : 12}>
                        <TextField
                          id={`fpub-${keysetId}`}
                          label='fpub (Fireblocks EdDSA)'
                          enableCopy={!!key.fpub}
                          value={key.fpub}
                          isMonospace
                          {...(key.eddsaExists
                            ? {
                                endAdornment:
                                  key.fpub && key.fprv ? (
                                    <InputAdornment position='end'>
                                      <CheckCircle color='success' />
                                    </InputAdornment>
                                  ) : null,
                              }
                            : { disabled: true, sx: { backgroundColor: '#cacaca' } })}
                        />
                      </Grid>
                      {hasExtendedPrivateKeys && (
                        <Grid item xs={6}>
                          <TextField
                            id={`fprv-${keysetId}`}
                            label='fprv (Fireblocks EdDSA)'
                            value={key.fprv}
                            enableCopy={!!key.fprv}
                            isMonospace
                            {...(key.eddsaExists
                              ? {
                                  type: 'password',
                                  confirmRevealRequired: true,
                                  confirmMessage:
                                    'WARNING - You are about to reveal your extended private key (EDDSA).\nMake sure this machine is OFFLINE and only accessible by authorized personnel.',
                                }
                              : { disabled: true, sx: { backgroundColor: '#cacaca' } })}
                          />
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <Tooltip title={Buffer.from(sha256(key.fpub!)).toString('hex')}>
                          <TextField
                            id={`fpub-ver-${keysetId}`}
                            label='EdDSA Verification Code'
                            isMonospace
                            disabled
                            {...(key.eddsaExists
                              ? {
                                  value: Buffer.from(sha256(key.fpub!)).toString('hex'),
                                  enableCopy: !!key.fpub,
                                }
                              : { sx: { backgroundColor: '#cacaca' } })}
                          />
                        </Tooltip>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>
            );
          })}
      </Box>
    </Box>
  );
};
