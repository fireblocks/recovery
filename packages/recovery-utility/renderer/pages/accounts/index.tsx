import type { NextPageWithLayout } from "../_app";
import { Layout } from "../../components/Layout";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { pythonServerUrlParams } from "../../lib/pythonClient";

const Accounts: NextPageWithLayout = () => {
  const router = useRouter();

  useEffect(() => {
    router.push({ pathname: "/accounts/vault", query: pythonServerUrlParams });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

Accounts.getLayout = (page) => <Layout>{page}</Layout>;

export default Accounts;
