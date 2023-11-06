import { Dispatch, SetStateAction, useState } from 'react';
import { LOGGER_NAME_SHARED } from '../constants';
import { getLogger } from './getLogger';
import { sanatize } from './sanatize';

const logger = getLogger(LOGGER_NAME_SHARED);

export function useWrappedState<S>(
  paramName: string,
  defaultValue: S | (() => S),
  shouldSanatize = false,
): [S, Dispatch<SetStateAction<S>>] {
  const [param, paramFn] = useState<S>(defaultValue);

  const setParam = (v: S) => {
    if (shouldSanatize) {
      const copy = { ...v };
      logger.logStateChange(paramName, JSON.stringify(sanatize(copy)));
    } else {
      logger.logStateChange(paramName, v);
    }

    paramFn(v);
  };

  return [param, setParam as Dispatch<SetStateAction<S>>];
}
