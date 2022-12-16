import { z } from "zod";
import { AssetId } from "shared";
import { recoverKeysInput } from "./schemas";

export const pythonServerUrlParams = { server: "" };

if (typeof window !== "undefined") {
  const urlParams = new URLSearchParams(window.location.search);

  pythonServerUrlParams.server = urlParams.get("server") ?? "";
}

const request = async <
  T extends U extends "json" ? any : string,
  U extends "json" | "text" = "json"
>(
  path: string,
  resFormat?: U,
  init?: RequestInit
) => {
  const res = await fetch(`${pythonServerUrlParams.server}${path}`, init);

  try {
    const data = (
      resFormat === "json" ? await res.json() : await res.text()
    ) as T;

    if (res.ok) {
      return data;
    }

    throw new Error((data as { reason: string })?.reason ?? "Request failed");
  } catch (error) {
    console.error(error);

    throw new Error("Request failed");
  }
};

export type ExtendedKeysResponse = {
  xprv: string;
  fprv: string;
  xpub: string;
  fpub: string;
};

export const getExtendedKeys = async () => {
  try {
    const keys = await request<ExtendedKeysResponse>(
      `/show-extended-keys`,
      "json"
    );

    return keys;
  } catch {
    throw new Error("Failed to get extended keys");
  }
};

type RecoverKeysInput = z.infer<typeof recoverKeysInput>;

export const recoverKeys = async (input: RecoverKeysInput) => {
  try {
    const keys = await request<ExtendedKeysResponse>(
      `/recover-keys?recover-prv=true`,
      "json",
      {
        method: "POST",
        body: JSON.stringify({
          zip: input.zip,
          passphrase: input.passphrase,
          "rsa-key": input.rsaKey,
          "rsa-key-passphrase": input.rsaKeyPassphrase,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return keys;
  } catch (error) {
    throw new Error("Key recovery failed");
  }
};

export type DeriveKeysInput = {
  assetId: AssetId;
  isTestnet: boolean;
  accountId: number;
  indexStart: number;
  indexEnd: number;
  legacy: boolean;
};

export type DeriveKeysResponse = {
  wif: string | undefined;
  prv: string;
  pub: string;
  address: string;
  path: string;
};

export const deriveKeys = async ({
  assetId,
  isTestnet,
  accountId,
  indexStart,
  indexEnd,
  legacy,
}: DeriveKeysInput) => {
  try {
    const params = new URLSearchParams({
      asset: assetId,
      account: String(accountId),
      change: "0",
      index_start: String(indexStart),
      index_end: String(indexEnd),
      xpub: "false",
      testnet: String(isTestnet),
      legacy: String(legacy),
    });

    const derivations = await request<DeriveKeysResponse[]>(
      `/derive-keys?${params.toString()}`,
      "json"
    );

    return derivations;
  } catch (error) {
    throw new Error("Key derivation failed");
  }
};
