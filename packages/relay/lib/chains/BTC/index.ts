import * as bitcoin from "bitcoinjs-lib";
import wif from "wif";
import * as ecc from "tiny-secp256k1";
import ECPairFactory from "ecpair";

const ECPair = ECPairFactory(ecc);

const getNetwork = (isTestnet: boolean) =>
  bitcoin.networks[isTestnet ? "testnet" : "bitcoin"];

export const getWifFromPrivateKeyHex = (
  privateKeyHex: string,
  isTestnet = false
) => {
  const privateKeyBuffer = Buffer.from(privateKeyHex, "hex");

  const privateKeyWif = wif.encode(
    isTestnet ? 239 : 128,
    privateKeyBuffer,
    true
  );

  return privateKeyWif;
};

export const getAddressFromWif = (
  privateKeyWif: string,
  isTestnet = false,
  isSegWit = false
) => {
  const keyPair = ECPair.fromWIF(privateKeyWif, getNetwork(isTestnet));

  const payment: bitcoin.Payment = {
    pubkey: keyPair.publicKey,
    network: getNetwork(isTestnet),
  };

  if (isSegWit) {
    const { address } = bitcoin.payments.p2wpkh(payment);

    return address;
  }

  const { address } = bitcoin.payments.p2pkh(payment);

  return address;
};

/**
 * Create (and broadcast via 3PBP) a typical transaction
 */
export const createTransaction = async (
  privateKeyWif: string,
  isTestnet = false,
  to: string,
  amount: number
) => {
  // to build and broadcast to the actual Bitcoin network, see https://github.com/bitcoinjs/bitcoinjs-lib/issues/839

  const network = getNetwork(isTestnet);

  const keyPair = ECPair.fromWIF(privateKeyWif, network);

  const address = getAddressFromWif(privateKeyWif, isTestnet, false);

  console.info({
    network,
    privateKeyWif,
    privateKey: keyPair.privateKey?.toString("hex"),
    publicKey: keyPair.publicKey.toString("hex"),
    address,
  });

  const addressRes = await fetch(
    `https://blockchain.info/rawaddr/${address}?limit=50`
  );

  const addressData = (await addressRes.json()) as {
    hash160: string;
    address: string;
    n_tx: number;
    n_unredeemed: number;
    total_received: number;
    total_sent: number;
    final_balance: number;
    txs: any[];
  };

  console.info({ addressData });

  const latestTx = addressData.txs?.[0].hash;
  const fee = 26456; // TODO: calculate fee
  const whatIsLeft = addressData.final_balance - fee - amount;

  console.info({
    latestTx,
    whatIsLeft,
  });

  // const tx = new bitcoin.Transaction();

  // tx.addInput(latestTx, 1);
  // tx.addOutput(Buffer.from(to, "hex"), amount);
  // tx.addOutput(keyPair.publicKey, whatIsLeft);
  // tx.sign(0, keyPair);
  // const body = tx.build().toHex();
  // console.log(body);
};
