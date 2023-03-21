import { Transaction } from '../../types';
import { getTxFromRelay } from '../../lib/relayUrl';

export const reduceTransactions = (transactions: Map<string, Transaction>, txInput: Partial<Transaction>) => {
  const tx = getTxFromRelay(txInput);

  if (!tx) {
    return transactions;
  }

  const updatedTransactions = new Map(transactions);

  updatedTransactions.set(tx.id, {
    ...transactions.get(tx.id),
    ...tx,
  });

  return updatedTransactions;
};
