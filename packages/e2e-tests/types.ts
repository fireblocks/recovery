export type AssetTestConfig = { assetId: string; endpoint?: string };

export type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;
export type AsyncFn = (...args: any[]) => Promise<any>;
