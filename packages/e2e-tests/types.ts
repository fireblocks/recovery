export type AssetTestConfig = { assetId: string; endpoint?: string };

export type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;
export type AsyncFn = (...args: any[]) => Promise<any>;

export class SkipError extends Error {}
export class FixError extends Error {}
