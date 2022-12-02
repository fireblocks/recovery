export const formatPath = (path: string) => {
  const pathParts = path.split(",");

  return `m/${pathParts[0]}'/${pathParts[1]}'/${pathParts[2]}'/${pathParts[3]}/${pathParts[4]}`;
};
