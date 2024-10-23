import { Page } from 'playwright-core';

export type AssetTestConfig = {
  assetId: string;
  newEndpoint?: string;
  toAddress?: string;
  postTestFn?: (utility: Page, relay: Page) => Promise<void>;
};

export type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;
export type AsyncFn = (...args: any[]) => Promise<any>;

// An error that is not code fixable, usually insufficient balances and the like
export class SkipError extends Error {}
// An error that requires code fixes, not an expected failure
export class FixableError extends Error {}

export class RelayBalanceFetchError extends FixableError {}
export class RelayMissingEndpointError extends FixableError {}
export class UtilityDisabledAssetError extends FixableError {}
export class UtilityInvalidAddressFormatError extends FixableError {}
export class UtilityUnknownError extends FixableError {}
