import { z } from 'zod';
import { errorUtil } from 'zod/lib/helpers/errorUtil';

export const nonEmptyString = (message?: errorUtil.ErrMessage) => z.string().trim().min(1, message);
