export const readFileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;

      const base64String = dataUrl.split(',')[1];

      resolve(base64String);
    };

    reader.onerror = (error) => reject(error);

    reader.readAsDataURL(file);
  });

export const readFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);

    reader.readAsText(file);
  });
