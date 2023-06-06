import { Tezos as BaseXTZ, Input } from '@fireblocks/wallet-derivation';
import { DEFAULT_FEE, DEFAULT_STORAGE_LIMIT, TezosToolkit } from '@taquito/taquito';
import axios from 'axios';
import { ConnectedWallet } from '../ConnectedWallet';
import { AccountData } from '../types';
import BigNumber from 'bignumber.js';
import { NoopSigner } from './NoopSigner';

export class Tezos extends BaseXTZ implements ConnectedWallet {
  private tezos: TezosToolkit;

  constructor(input: Input) {
    super(input);
    this.tezos = new TezosToolkit(input.isTestnet ? 'https://ghostnet.smartpy.io' : 'https://rpc.tzbeta.net');
    this.tezos.setSignerProvider(new NoopSigner(this.publicKey, this.address));
  }

  public async getBalance(): Promise<number> {
    // TODO: Big number consideration?
    return (await this.tezos.tz.getBalance(this.address)).toNumber() / 10 ** 6;
  }

  public async prepare(to?: string): Promise<AccountData> {
    const balance = await this.getBalance();
    if (balance < 1) {
      return {
        balance,
        insufficientBalance: true,
      };
    }
    const estimate = await this.tezos.estimate.transfer({
      to: to!,
      source: this.address,
      amount: Math.round((balance - DEFAULT_FEE.TRANSFER / 10 ** 6) * 10 ** 6) / 10 ** 6,
    });

    const protocolConstants = await this._getProtocolConstants();
    const accountLimit = await this._getAccountLimits(protocolConstants);
    const blockHash = (await this.tezos.rpc.getBlockHeader()).hash;
    const protocol = (await this.tezos.rpc.getProtocols({ block: 'head' })).next_protocol;
    const headCounter = (await this.tezos.rpc.getContract(this.address, { block: 'head' })).counter || '0';
    const manager = await this.tezos.rpc.getManagerKey(this.address, { block: 'head' });
    const revealNeeded = !(manager && typeof manager === 'object' ? !!manager.key : !!manager);

    const extraParams = new Map<string, any>();
    extraParams.set(this.KEY_ESTIMATE, {
      gas: estimate.gasLimit,
      storage: estimate.storageLimit,
      fee: estimate.suggestedFeeMutez,
    });
    extraParams.set(this.KEY_BLOCK_HASH, blockHash);
    extraParams.set(this.KEY_ACCOUNT_LIMIT, accountLimit);
    extraParams.set(this.KEY_PROTOCOL_HASH, protocol);
    extraParams.set(this.KEY_HEAD_COUNTER, headCounter);
    extraParams.set(this.KEY_REVEAL, revealNeeded);

    return {
      balance,
      extraParams,
      feeRate: estimate.totalCost,
    };
  }

  public async broadcastTx(tx: string): Promise<string> {
    try {
      const res = await axios({
        url: `${this.isTestnet ? 'https://ghostnet.smartpy.io' : 'https://rpc.tzbeta.net'}/injection/operation`,
        method: 'POST',
        data: tx,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return res.data;
      // return await this.tezos.rpc.injectOperation(tx);
    } catch (e: any) {
      const resData = e.response.data;
      if (resData) {
        throw Error(resData.map((data: any) => data.msg).join(' and '));
      } else {
        throw e;
      }
    }
  }

  private async _getProtocolConstants() {
    const {
      time_between_blocks,
      minimal_block_delay,
      hard_gas_limit_per_operation,
      hard_gas_limit_per_block,
      hard_storage_limit_per_operation,
      cost_per_byte,
      tx_rollup_origination_size,
      smart_rollup_origination_size,
    } = await this.tezos.rpc.getConstants({ block: 'head' });
    return {
      time_between_blocks,
      minimal_block_delay,
      hard_gas_limit_per_operation,
      hard_gas_limit_per_block,
      hard_storage_limit_per_operation,
      cost_per_byte,
      tx_rollup_origination_size,
      smart_rollup_origination_size,
    };
  }

  private async _getAccountLimits(constants: any) {
    const balance = await this.tezos.rpc.getBalance(this.address, { block: 'head' });

    const { hard_gas_limit_per_operation, hard_storage_limit_per_operation, cost_per_byte } = constants;
    return {
      fee: 0,
      gasLimit: hard_gas_limit_per_operation.toNumber(),
      storageLimit: Math.floor(BigNumber.min(balance.dividedBy(cost_per_byte), hard_storage_limit_per_operation).toNumber()),
    };
  }
}
