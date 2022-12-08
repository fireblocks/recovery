import type { NextPageWithLayout } from "./_app";
import { QrReader } from "../components/QrReader";

const Scan: NextPageWithLayout = () => {
  return (
    <QrReader
      onResult={(result, error) => {
        if (result) {
          alert(result.getText());
        }

        if (error) {
          console.error(error);
        }
      }}
    />
  );
};

export default Scan;
