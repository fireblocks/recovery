import { parseAsync, FieldInfo, Options } from "json2csv";

type Row = {
  accountName?: string;
  accountId: number;
  assetId: string;
  assetName: string;
  address: string;
  addressType: "Permanent" | "Deposit";
  addressDescription?: string;
  tag?: string;
  hdPath: string;
};

const fields: FieldInfo<Row>[] = [
  {
    label: "Account Name",
    value: "accountName",
  },
  {
    label: "Account ID",
    value: "accountId",
  },
  {
    label: "Asset",
    value: "assetId",
  },
  {
    label: "Asset Name",
    value: "assetName",
  },
  {
    label: "Address",
    value: "address",
  },
  {
    label: "Address Type",
    value: "addressType",
  },
  {
    label: "Address Description",
    value: "addressDescription",
  },
  {
    label: "Tag",
    value: "tag",
  },
  {
    label: "BIP44 Path",
    value: "hdPath",
  },
];

export const csvExport = async (data: Readonly<Row> | ReadonlyArray<Row>) =>
  parseAsync(data, { fields });
