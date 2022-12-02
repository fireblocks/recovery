import { z } from "zod";

export const optionalBoolean = () => z.boolean().optional();
