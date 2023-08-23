import { Derivation, Input } from '@fireblocks/wallet-derivation';

export const sanatizeInput = (input: Input) => {
  const sanitizedInput = { ...input };
  if (sanitizedInput.xprv) delete sanitizedInput.xprv;
  if (sanitizedInput.fprv) delete sanitizedInput.fprv;
  return sanitizedInput;
};

export const sanatizeDerivation = (derivation: Derivation) => {
  const cleanDerivation = { ...derivation };
  //@ts-ignore
  delete cleanDerivation.relayLogger;
  //@ts-ignore
  delete cleanDerivation.utilityLogger;
  //@ts-ignore
  delete cleanDerivation.sharedLogger;
  if (cleanDerivation.wif) delete cleanDerivation.wif;
  if (cleanDerivation.privateKey) delete cleanDerivation.privateKey;
  return cleanDerivation;
};
