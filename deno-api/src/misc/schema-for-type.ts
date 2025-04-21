import { z } from "zod";

/** TS type => zod schema */
// deno-lint-ignore no-explicit-any
export const toSchema = <T>() => <S extends z.ZodType<T, any, any>>(arg: S) => {
  return arg;
};
