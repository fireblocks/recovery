import type { NextPageWithLayout } from "../_app";
import { Layout } from "../../components/Layout";
import { useRouter } from "next/router";
import { useEffect } from "react";

const Accounts: NextPageWithLayout = () => {
  const router = useRouter();

  useEffect(() => {
    router.push("/accounts/vault");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

Accounts.getLayout = (page) => <Layout>{page}</Layout>;

export default Accounts;
