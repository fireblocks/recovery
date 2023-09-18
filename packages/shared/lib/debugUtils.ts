import { Dispatch, SetStateAction } from 'react';
import { LOGGER_NAME_SHARED } from '../constants';
import { getLogger } from './getLogger';

const logger = getLogger(LOGGER_NAME_SHARED);

export function wrapState<S>(paramName: string, func: Dispatch<SetStateAction<S>>): Dispatch<SetStateAction<S>> {
  return ((v: S) => {
    logger.info(`Altering varaiable ${paramName} to ${v}`);
    logger.info(Error().stack);
    console.trace();
    func(v);
  }) as Dispatch<SetStateAction<S>>;
}
