import type { NextPageWithLayout } from "./_app";
import type { ReactElement } from "react";
import { Layout } from "../components/Layout";

const Settings: NextPageWithLayout = () => null;

Settings.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default Settings;
