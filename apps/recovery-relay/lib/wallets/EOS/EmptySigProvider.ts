/* eslint-disable class-methods-use-this */
import { SignatureProvider, SignatureProviderArgs } from 'eosjs/dist/eosjs-api-interfaces';
import { PushTransactionArgs } from 'eosjs/dist/eosjs-rpc-interfaces';

export class EmptySigProvider implements SignatureProvider {
  async getAvailableKeys(): Promise<string[]> {
    return [] as string[];
  }

  async sign(args: SignatureProviderArgs): Promise<PushTransactionArgs> {
    return {
      signatures: [] as string[],
      serializedTransaction: args.serializedTransaction,
      serializedContextFreeData: args.serializedContextFreeData,
    };
  }
}
