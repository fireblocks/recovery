import { recoverKeys, KeyRecoveryConfig } from '@fireblocks/extended-key-recovery';

export type Args = {
  zip: string;
  mobilePassphrase?: string;
  mobileRsa?: string;
  rsaKey: string;
  rsaKeyPassphrase?: string;
  autoGeneratedPassphrase: boolean;
  dangerouslyRecoverPrivateKeys?: boolean;
};

export type ExtendedKeys = {
  xpub: string;
  fpub: string;
  xprv?: string;
  fprv?: string;
};

export const recoverExtendedKeys = async (args: Args) => {
  let config;

  if (args.autoGeneratedPassphrase) {
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

  const response = await recoverKeys(config);
  return response;
};