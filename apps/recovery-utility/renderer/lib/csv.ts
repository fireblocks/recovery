import { parse, unparse } from "papaparse";
import { addressCsv } from "./schemas";

/**
 * Parsed row
 */
export type ParsedRow = {
  accountName?: string;
  accountId: number;
  assetId: string;
  assetName: string;
  address: string;
  addressType: "Permanent" | "Deposit";
  addressDescription?: string;
  tag?: string;
  pathParts: number[];
  publicKey?: string;
  privateKey?: string;
  privateKeyWif?: string;
};

/**
 * CSV row
 */
type CsvRow = {
  "Account Name"?: string;
  "Account ID": number;
  Asset: string;
  "Asset Name": string;
  Address: string;
  "Address Type": "Permanent" | "Deposit";
  "Address Description"?: string;
  Tag?: string;
  "HD Path": string;
  "Public Key"?: string;
  "Private Key"?: string;
  "Private Key (WIF)"?: string;
};

/**
 * Parsed row properties
 */
const props: Array<keyof ParsedRow> = [
  "accountName",
  "accountId",
  "assetId",
  "assetName",
  "address",
  "addressType",
  "addressDescription",
  "tag",
  "pathParts",
  "publicKey",
  "privateKey",
  "privateKeyWif",
];

/**
 * CSV headers
 */
const headers: Array<keyof CsvRow> = [
  "Account Name",
  "Account ID",
  "Asset",
  "Asset Name",
  "Address",
  "Address Type",
  "Address Description",
  "Tag",
  "HD Path",
  "Public Key",
  "Private Key",
  "Private Key (WIF)",
];

const parseRow = (row: CsvRow) => {
  try {
    const parsedRow = props.reduce((parsedRow, prop, index) => {
      const header = headers[index];

      let value: string | number | number[] | undefined = row[header];

      if (prop === "pathParts") {
        value = (value as string)
          .split(" / ")
          .filter((part) => part !== "m")
          .map(Number);
      }

      return { ...parsedRow, [prop]: value ?? undefined };
    }, {} as ParsedRow);

    return addressCsv.parse(parsedRow);
  } catch (error) {
    console.error(error);

    throw new Error("Failed to parse CSV row");
  }
};

export const csvImport = async (
  csvFile: File,
  handleRow: (row: ParsedRow) => void
) =>
  new Promise<void>((resolve, reject) =>
    parse<CsvRow>(csvFile, {
      worker: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: "greedy",
      fastMode: true,
      step: ({ data, errors }) => {
        if (errors.length > 0) {
          return reject(errors.length > 1 ? errors : errors[0]);
        }

        const row = parseRow(data);

        handleRow(row);
      },
      complete: () => resolve(),
    })
  );

export const csvExport = (rows: ParsedRow[]) => {
  const data = rows.map((row) => props.map((prop) => row[prop]));

  const csv = unparse({ data, fields: headers });

  return csv;
};
