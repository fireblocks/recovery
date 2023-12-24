import { AccountData, LegacyUTXOType, SegwitUTXOType } from '../types';
import { BTCRelayWalletUtils, StandardBTCRelayWalletUtils } from './BTCRelayWalletUtils';

export class BTCRelayWallet {
  private static readonly satsPerBtc = 100000000;

  static _satsToBtc(sats: number) {
    return sats / BTCRelayWallet.satsPerBtc;
  }

  public async getBalance(): Promise<number> {
    // @ts-ignore
    const utils = (this.utils as BTCRelayWalletUtils) || new StandardBTCRelayWalletUtils(this.baseUrl);
    // @ts-ignore
    const balance = await utils.getAddressBalance(this.address);
    const btcBalance = BTCRelayWallet._satsToBtc(balance);
    return btcBalance;
  }

  public async prepare(): Promise<AccountData> {
    // @ts-ignore
    const { isLegacy, relayLogger: logger, baseUrl, address } = this;

    // @ts-ignore
    const utils = (this.utils as BTCRelayWalletUtils) || new StandardBTCRelayWalletUtils(baseUrl);
    const balance = await BTCRelayWallet.prototype.getBalance.bind(this)();

    if (balance === 0) {
      return {
        balance,
        insufficientBalance: true,
      };
    }

    const utxos = await utils.getAddressUTXOs(address);

    const getInputMethod = isLegacy ? utils.getLegacyFullUTXO!.bind(utils) : utils.getSegwitUTXO.bind(utils);

    const inputs = await Promise.all(utxos.map((utxo) => getInputMethod(utxo)));

    const feeRate = await utils.getFeeRate();

    const preparedData = {
      balance,
      utxos: inputs,
      utxoType: isLegacy ? LegacyUTXOType : SegwitUTXOType,
      feeRate,
    };

    logger.logPreparedData('BTCBased', preparedData);
    return preparedData as AccountData;
  }

  public async broadcastTx(txHex: string): Promise<string> {
    // BTC Tx are automatically signed and resulting hex is signed, so no need to do anything special.
    // const tx = Psbt.fromHex(txHex, { network: this.network });

    // @ts-ignore
    const { relayLogger: logger } = this;

    // @ts-ignore
    const utils = new StandardBTCRelayWalletUtils(this.baseUrl);
    return utils.broadcastTx(txHex, logger);
  }
}
