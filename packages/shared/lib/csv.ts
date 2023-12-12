import { LocalFile, parse, unparse } from 'papaparse';
import { z } from 'zod';
import { addressesCsv, AddressesCsv, balancesCsv, BalancesCsv } from '../schemas';
import { getLogger } from './getLogger';
import { LOGGER_NAME_SHARED } from '../constants';
import { sanatize } from './sanatize';

/**
 * Addresses CSV row
 */
type AddressesCsvRow = {
  'Account Name'?: string;
  'Account ID': number;
  Asset: string;
  'Asset Name': string;
  Address: string;
  'Address Type': 'Permanent' | 'Deposit';
  'Address Description'?: string;
  Tag?: string;
  'HD Path': string;
  'Public Key'?: string;
  'Private Key'?: string;
  'Private Key (WIF)'?: string;
};

/**
 * Balances CSV row
 */
type BalancesCsvRow = {
  'Account Name'?: string;
  'Account ID': number;
  Asset: string;
  'Asset Name': string;
  'Total Balance': number;
  'Total Balance - Last Update': string;
  'HD Path': string;
};

/**
 * Addresses CSV headers
 */
const addressesCsvHeaders: Array<keyof AddressesCsvRow | keyof BalancesCsvRow> = [
  'Account Name',
  'Account ID',
  'Asset',
  'Asset Name',
  'Total Balance',
  'Total Balance - Last Update',
  'Address',
  'Address Type',
  'Address Description',
  'Tag',
  'HD Path',
  'Public Key',
  'Private Key',
  'Private Key (WIF)',
];

/**
 * Balances CSV headers
 */
const balancesCsvHeaders: Array<keyof AddressesCsvRow | keyof BalancesCsvRow> = [
  'Account Name',
  'Account ID',
  'Asset',
  'Asset Name',
  'Total Balance',
  'Total Balance - Last Update',
  'HD Path',
];

const logger = getLogger(LOGGER_NAME_SHARED);

const parseRow = <T extends 'addresses' | 'balances'>(row: T extends 'addresses' ? AddressesCsvRow : BalancesCsvRow, type: T) => {
  try {
    if (type === 'addresses') {
      const {
        'Account Name': accountName,
        'Account ID': accountId,
        Asset: assetId,
        'Asset Name': assetName,
        Address: address,
        'Address Type': addressType,
        'Address Description': addressDescription,
        Tag: tag,
        'HD Path': path,
        'Public Key': publicKey,
        'Private Key': privateKey,
        'Private Key (WIF)': privateKeyWif,
      } = row as AddressesCsvRow;

      // If field contains with =,  -, +, " or @, - prevent loading
      const invalidRow = Object.keys(row as AddressesCsvRow).filter((x) => ['=', '-', '+', '"', '@'].some((y) => x.includes(y)));
      if (invalidRow) {
        throw new Error('Row contains prohibited characters - please reset workspace and check your importing CSV');
      }

      const pathParts = path.match(/(\d+)/g)?.map(Number);
      logger.debug('parseRow path parts -', { pathParts });
      return addressesCsv.parse({
        accountName,
        accountId,
        assetId,
        assetName,
        address,
        addressType,
        addressDescription,
        tag,
        pathParts,
        publicKey,
        privateKey,
        privateKeyWif,
      });
    }

    const {
      'Account Name': accountName,
      'Account ID': accountId,
      Asset: assetId,
      'Asset Name': assetName,
      'Total Balance': totalBalance,
      'Total Balance - Last Update': lastUpdate,
      'HD Path': path,
    } = row as BalancesCsvRow;

    const partialPathParts = path.match(/(\d+)/g)?.map(Number);

    return balancesCsv.parse({
      accountName,
      accountId,
      assetId,
      assetName,
      totalBalance,
      lastUpdate: new Date(lastUpdate),
      partialPathParts,
    });
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

export const csvImport = async <T extends 'addresses' | 'balances'>(
  csvFile: LocalFile,
  type: T,
  handleRow: (row: T extends 'addresses' ? AddressesCsv : BalancesCsv) => void,
) =>
  new Promise<void>((resolve, reject) => {
    parse<T extends 'addresses' ? AddressesCsvRow : BalancesCsvRow>(csvFile, {
      worker: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
      fastMode: true,
      step: ({ data, errors }) => {
        const sanatizedData = sanatize(data as unknown);
        logger.debug('csvImport', { sanatizedData, errors });
        if (errors.length > 0) {
          reject(errors.length > 1 ? errors : errors[0]);
          return;
        }
        try {
          const row = parseRow(data, type) as T extends 'addresses' ? AddressesCsv : BalancesCsv;

          handleRow(row);
        } catch (e) {
          reject(e);
          return;
        }
      },
      error: (error: Error, file: LocalFile) => reject(error),
      complete: () => resolve(),
    });
  });

export const csvExport = <T extends typeof addressesCsv | typeof balancesCsv>(rows: z.infer<T>[], schema: T) => {
  const props = Object.keys(schema.keyof().enum) as (T extends typeof addressesCsv ? keyof AddressesCsv : keyof BalancesCsv)[];

  const data = rows.map((row) => props.map((prop) => row[prop as keyof typeof row]));

  const headers = schema === addressesCsv ? addressesCsvHeaders : balancesCsvHeaders;

  const csv = unparse({ data, fields: headers });

  return csv;
};
