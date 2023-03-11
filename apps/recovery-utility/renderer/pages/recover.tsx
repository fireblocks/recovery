import { Layout } from '../components/Layout';
import type { NextPageWithLayout } from './_app';
import { RecoveryForm } from '../components/RecoveryForm';

const Recover: NextPageWithLayout = () => <RecoveryForm />;

Recover.getLayout = (page) => <Layout>{page}</Layout>;

export default Recover;
