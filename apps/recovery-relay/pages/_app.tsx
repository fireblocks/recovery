import type { AppProps as NextAppProps } from 'next/app';
import type { EmotionCache } from '@emotion/react';
import { ErrorBoundary, SharedProviders } from '@fireblocks/recovery-shared';
import SuperJSON from 'superjson';
import { PushTransactionArgs } from 'eosjs/dist/eosjs-rpc-interfaces';
import { CosmosFee } from '@fireblocks/wallet-derivation/wallets/chains/ATOM';
import { WorkspaceProvider } from '../context/Workspace';
import { Layout } from '../components/Layout';
import { SettingsProvider } from '../context/Settings';

type AppProps = NextAppProps & {
  emotionCache?: EmotionCache;
};

SuperJSON.registerCustom<CosmosFee, string>(
  {
    isApplicable(v: any): v is CosmosFee {
      return typeof v === 'object' && 'gas' in v && 'amount' in v;
    },
    serialize(v: CosmosFee) {
      return `${v.gas}:${v.amount.map((amount) => `${amount.amount}-${amount.denom}`).join('<>')}`;
    },
    deserialize(v: unknown) {
      const [gas, amountArr] = Object.values(v as object).join('');
      const amount: { amount: string; denom: string }[] = [];
      amountArr.split('<>').forEach((amt) => {
        const [amtValue, denom] = amt.split('-');
        amount.push({
          amount: amtValue,
          denom,
        });
      });

      return {
        gas,
        amount,
      };
    },
  },
  'cosmosFee',
);

SuperJSON.registerCustom<PushTransactionArgs, string>(
  {
    isApplicable(v: any): v is PushTransactionArgs {
      return typeof v === 'object' && 'serializedTransaction' in v;
    },
    serialize(v: PushTransactionArgs) {
      const serTx = Buffer.from(v.serializedTransaction).toString('hex');
      const serTxCtx = v.serializedContextFreeData ? Buffer.from(v.serializedContextFreeData!).toString('hex') : '';
      const comp = v.compression ? v.compression! : -1;
      const sigs = v.signatures.join('<>');
      return `${comp}:${serTx}:${serTxCtx}:${sigs}`;
    },
    deserialize(v: unknown) {
      const value = Object.values(v as object).join('');
      const [comp, serTx, serTxCtx, sigs] = value.split(':');
      const compression = parseInt(comp, 10) === -1 ? undefined : parseInt(comp, 10);
      const serializedContextFreeData = serTxCtx.length === 0 ? undefined : Uint8Array.from(Buffer.from(serTxCtx, 'hex'));
      return {
        compression,
        serializedTransaction: Uint8Array.from(Buffer.from(serTx, 'hex')),
        serializedContextFreeData,
        signatures: sigs.split('<>'),
      };
    },
  },
  'pushTransactionArgs',
);

// Temporarily using @ts-ignore since TypeScript and React are not in sync

export default function App({ Component, emotionCache, pageProps }: AppProps) {
  return (
    <SharedProviders emotionCache={emotionCache}>
      <SettingsProvider>
        <WorkspaceProvider>
          {/* @ts-ignore */}
          <ErrorBoundary>
            <Layout>
              {/* @ts-ignore */}
              <Component {...pageProps} />
            </Layout>
          </ErrorBoundary>
        </WorkspaceProvider>
      </SettingsProvider>
    </SharedProviders>
  );
}
