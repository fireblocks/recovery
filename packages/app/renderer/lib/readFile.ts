const readFile = <
  T extends
    | "readAsArrayBuffer"
    | "readAsBinaryString"
    | "readAsDataURL"
    | "readAsText",
  U extends T extends "readAsArrayBuffer" ? ArrayBuffer : string
>(
  file: File,
  method: T
) =>
  new Promise<U>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result as U);

    reader.onerror = (error) => reject(error);

    reader[method](file);
  });

export const readFileToBase64 = async (file: File) => {
  const dataUrl = await readFile(file, "readAsDataURL");

  const base64String = dataUrl.split(",")[1];

  return base64String;
};

export const readFileToText = async (file: File) =>
  readFile(file, "readAsText");
