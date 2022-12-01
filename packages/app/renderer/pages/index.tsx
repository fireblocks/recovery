import type { NextPageWithLayout } from "./_app";
import type { ReactElement } from "react";
import { Layout } from "../components/Layout";
import { useRouter } from "next/router";
import { useEffect } from "react";

const Index: NextPageWithLayout = () => {
  const router = useRouter();

  useEffect(() => {
    router.push("/recover");
  });

  return null;
};

Index.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default Index;
