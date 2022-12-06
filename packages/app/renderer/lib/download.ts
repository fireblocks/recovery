export const download = (data: BlobPart, filename: string, type: string) => {
  const file = new Blob([data], { type });

  const element = document.createElement("a");
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();

  // TODO: Free up memory
  // URL.revokeObjectURL(element.href);
  // document.body.removeChild(element);
};
