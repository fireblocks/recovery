import { z } from "zod";

export const nonNegativeInt = () => z.number().int().nonnegative();
