import { RelayRequestParams, RelayResponseParams } from '../../../schemas';
import { getRelayParams, getRelayUrl } from '../../../lib/relayUrl';
import { LOGGER_NAME_SHARED } from '../../../constants';
import { getLogger } from '../../../lib/getLogger';
import { useWrappedState } from '../../../lib/debugUtils';

// eslint-disable-next-line import/no-mutable-exports
export let initialHref: string | undefined;

if (typeof window !== 'undefined') {
  initialHref = window.location.href;
  window.location.hash = '';
}

const logger = getLogger(LOGGER_NAME_SHARED);

export const useRelayUrl = <App extends 'utility' | 'relay'>(app: App, baseUrl: string) => {
  type InboundParams = App extends 'utility' ? RelayResponseParams : RelayRequestParams;
  type OutboundParams = App extends 'utility' ? RelayRequestParams : RelayResponseParams;

  const recipient = app === 'utility' ? 'relay' : 'utility';

  /**
   * Get parameters from an inbound Relay URL
   *
   * @param relayUrl Relay URL
   * @returns Relay URL params
   */
  const getInboundRelayParams = <Params extends InboundParams>(relayUrl: string) => getRelayParams<Params, App>(app, relayUrl);

  /**
   * Get parameters from the initial page URL
   *
   * @returns
   */
  const getInboundRelayParamsFromWindow = () => {
    if (!initialHref) {
      return undefined;
    }

    try {
      return getInboundRelayParams(initialHref);
    } catch {
      return undefined;
    }
  };

  /**
   * Get an outbound Relay URL
   *
   * @param params outbound Relay URL params
   * @returns Relay URL
   */
  const getOutboundRelayUrl = <Params extends OutboundParams>(params: Params) => getRelayUrl(recipient, baseUrl, params);

  const [inboundRelayParams, setInboundRelayParams] = useWrappedState<any>('inboundRelayParams', getInboundRelayParamsFromWindow);

  /**
   * Set `inboundRelayParams` based on a Relay URL
   *
   * @param relayUrl Relay URL
   * @returns void
   */
  const setInboundRelayUrl = (relayUrl: string | null) => {
    try {
      logger.debug('setInboundRelayUrl', { relayUrl });
      if (!relayUrl) {
        // setInboundRelayParams(undefined);
        return false;
      } else {
        const params = getInboundRelayParams(relayUrl);

        setInboundRelayParams(params);
        return true;
      }
    } catch (error) {
      logger.error(error);
      return false;
    }
  };

  const resetInboundRelayUrl = () => setInboundRelayParams(undefined);

  return { inboundRelayParams, setInboundRelayUrl, resetInboundRelayUrl, getOutboundRelayUrl };
};
