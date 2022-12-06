export const serializePath = (pathParts: string[] | number[]) =>
  `m/${pathParts[0]}'/${pathParts[1]}'/${pathParts[2]}'/${pathParts[3]}/${pathParts[4]}`;

export const deserializePath = <T extends string | number>(pathParts: T[]) => {
  const [purpose, coinType, accountId, change, index] = pathParts;

  return { purpose, coinType, accountId, change, index };
};
