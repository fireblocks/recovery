import { recoverKeys, KeyRecoveryConfig } from '@fireblocks/extended-key-recovery';
import { getLogger } from '@fireblocks/recovery-shared';
import { LOGGER_NAME_UTILITY } from '@fireblocks/recovery-shared/constants';

export type Args = {
  zip: string;
  mobilePassphrase?: string;
  mobileRsa?: string;
  rsaKey: string;
  rsaKeyPassphrase?: string;
  autoGeneratedPassphrase: boolean;
  recoverOnlyNCW: boolean;
  dangerouslyRecoverPrivateKeys?: boolean;
};

export type ExtendedKeys = {
  xpub: string;
  fpub: string;
  xprv?: string;
  fprv?: string;
};

export const recoverExtendedKeys = async (args: Args) => {
  const logger = getLogger(LOGGER_NAME_UTILITY);
  let config;

  if (args.autoGeneratedPassphrase) {
    logger.info('Using auto-generated passphrase mode');
    config = {
      rsaPass: args.rsaKeyPassphrase,
      rsaBase64: args.rsaKey,
      zipBase64: args.zip,
      mobileRsaBase64: args.mobileRsa!,
      mobileRsaPass: args.mobilePassphrase,
      recoveryPrv: args.dangerouslyRecoverPrivateKeys ?? false,
    } as KeyRecoveryConfig;
  } else {
    config = {
      rsaPass: args.rsaKeyPassphrase,
      rsaBase64: args.rsaKey,
      zipBase64: args.zip,
      mobilePass: args.mobilePassphrase!,
      recoveryPrv: args.dangerouslyRecoverPrivateKeys ?? false,
    } as KeyRecoveryConfig;
  }

  config = { ...config, recoverOnlyNCW: args.recoverOnlyNCW };

  const response = recoverKeys(config);
  return response;
};
