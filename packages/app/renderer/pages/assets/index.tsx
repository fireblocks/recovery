import type { NextPageWithLayout } from "../_app";
import { Layout } from "../../components/Layout";
import { useRouter } from "next/router";
import { useEffect } from "react";

const Wallets: NextPageWithLayout = () => {
  const router = useRouter();

  useEffect(() => {
    router.push("/assets/[assetId]", "/assets/BTC");
  });

  return null;
};

Wallets.getLayout = (page) => <Layout>{page}</Layout>;

export default Wallets;
