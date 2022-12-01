import type { NextPageWithLayout } from "../_app";
import type { ReactElement } from "react";
import { Layout } from "../../components/Layout";
import { useRouter } from "next/router";
import { useEffect } from "react";

const Wallets: NextPageWithLayout = () => {
  const router = useRouter();

  useEffect(() => {
    router.push("/wallets/[assetId]", "/wallets/BTC");
  });

  return null;
};

Wallets.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default Wallets;
