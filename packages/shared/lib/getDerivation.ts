export function getDerivationMapKey(assetId: string, fromAdd: string): string {
  return `${assetId}-${fromAdd}`;
}
