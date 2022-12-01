import { useRouter } from "next/router";
import { useEffect } from "react";

const Wallets = () => {
  const router = useRouter();

  useEffect(() => {
    router.push("/wallets/[assetId]", "/wallets/BTC");
  });

  return null;
};

export default Wallets;
