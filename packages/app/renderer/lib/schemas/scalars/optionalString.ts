import { z } from "zod";

export const optionalString = () => z.coerce.string().trim().optional();
