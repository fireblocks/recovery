import { Layout } from '../components/Layout';
import type { NextPageWithLayout } from './_app';
import { RecoveryForm } from '../components/RecoveryForm';

const Verify: NextPageWithLayout = () => <RecoveryForm verifyOnly />;

Verify.getLayout = (page) => <Layout>{page}</Layout>;

export default Verify;
