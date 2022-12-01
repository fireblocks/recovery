import type { NextPageWithLayout } from "./_app";
import type { ReactElement } from "react";
import { Layout } from "../components/Layout";

const Verify: NextPageWithLayout = () => null;

Verify.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default Verify;
