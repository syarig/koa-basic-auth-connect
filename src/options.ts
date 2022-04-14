import { Context } from "koa";

export type Users = Record<string, string>;

export type FunctionalOption<T> = T | ((ctx: Context) => T);
export type Authorizer = (
  name: string,
  pass: string
) => Promise<boolean> | boolean;

export type Options = {
  users: Users;
  realm?: FunctionalOption<string>;
  challenge?: boolean;
  authorizer?: Authorizer;
  continueIfUnauthorized?: FunctionalOption<boolean>;
};
