import { nanoid } from "nanoid";
import { Transaction } from "../../types";

export const reduceTransactions = (
  transactions: Map<string, Transaction>,
  tx: Partial<Transaction>
) => {
  const {
    id = nanoid(),
    state = tx.signature ? "signed" : "created",
    assetId,
    accountId = 0,
    addressIndex = 0,
    from,
    to,
    amount = 0,
    remainingBalance = 0,
    memo,
    contractCall,
    hex,
    signature,
    hash,
    error,
  } = tx;

  const hasTransaction = !!(
    id &&
    assetId &&
    from &&
    to &&
    typeof amount === "number" &&
    hex
  );

  if (!hasTransaction) {
    return transactions;
  }

  const updatedTransactions = new Map(transactions);

  updatedTransactions.set(id, {
    ...transactions.get(id),
    id,
    state,
    assetId,
    accountId,
    addressIndex,
    from,
    to,
    amount,
    remainingBalance,
    memo,
    contractCall,
    hex,
    signature,
    hash,
    error,
  });

  return updatedTransactions;
};
