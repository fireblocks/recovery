import { Polkadot as BaseDOT } from '@fireblocks/wallet-derivation';
import { EXTRINSIC_VERSION } from '@polkadot/types/extrinsic/v4/Extrinsic';
import { methods, construct, getRegistry, createMetadata } from '@substrate/txwrapper-polkadot';
import { u8aToHex } from '@polkadot/util';

import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';
import mdRpc from './metadatarpc.json';

export class Polkadot extends BaseDOT implements SigningWallet {
  public async generateTx({ to, extraParams, nonce }: GenerateTxInput): Promise<TxPayload> {
    const genesisHash = extraParams?.get(this.KEY_GENESIS_HASH);
    const blockHash = extraParams?.get(this.KEY_BLOCK_HASH);
    const blockNumber = extraParams?.get(this.KEY_BLOCK_NUM);
    const specVersion = extraParams?.get(this.KEY_SPEC_VERSION);
    const transactionVersion = extraParams?.get(this.KEY_TX_VER);
    const chainName = this.isTestnet ? 'Westend' : 'Polkadot';
    const specName = this.isTestnet ? 'westend' : 'polkadot';
    const metadataRpc = (this.isTestnet ? mdRpc.westendRpc : mdRpc.polkadotRpc) as `0x${string}`;

    const registry = getRegistry({
      specName,
      chainName,
      specVersion,
      metadataRpc,
    });

    const unsigned = methods.balances.transferAll(
      {
        dest: { id: to },
        keepAlive: false,
      },
      {
        address: this.address,
        blockHash,
        blockNumber,
        genesisHash,
        metadataRpc,
        nonce: nonce!,
        specVersion,
        tip: 0,
        eraPeriod: 64,
        transactionVersion,
      },
      {
        metadataRpc,
        registry,
      },
    );

    this.utilityLogger.debug(`Polkadot: Signing tx: ${JSON.stringify(unsigned, null, 2)}`);

    const signPayload = construct.signingPayload(unsigned, { registry });
    registry.setMetadata(createMetadata(registry, metadataRpc));
    const extrinsicPayload = registry.createType('ExtrinsicPayload', signPayload, {
      version: EXTRINSIC_VERSION,
    });
    const extrinsicPayloadU8a = extrinsicPayload.toU8a({ method: true });
    const actualPayload =
      extrinsicPayloadU8a.length > 256
        ? u8aToHex(registry.hash(extrinsicPayloadU8a).toU8a({ method: true }))
        : u8aToHex(extrinsicPayloadU8a);

    const signature = await this.sign(Buffer.from(actualPayload.slice(2), 'hex'));
    const signedTx = construct.signedTx(unsigned, `0x00${Buffer.from(signature).toString('hex')}`, {
      metadataRpc,
      registry,
    });

    return { tx: signedTx };
  }
}
