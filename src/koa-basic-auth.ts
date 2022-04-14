import basicAuth from "basic-auth";
import assert from "assert";
import { FunctionalOption, Options } from "./options";
import { staticUsersAuthorizer } from "./authorizer";
import { Context, Next } from "koa";

type EnsureFunction<T> = (ctx: Context) => T | undefined;

function ensureFunction<T>(
  option?: FunctionalOption<T>,
  defaultValue?: T
): EnsureFunction<T> {
  if (!option)
    return () => {
      return defaultValue;
    };

  if (typeof option !== "function") {
    return () => option;
  }

  return option as EnsureFunction<T>;
}

function koaBasicAuth(options: Options) {
  const challenge = Boolean(options.challenge);
  const users = options.users;
  const authorize = options.authorizer || staticUsersAuthorizer(users);
  const continueIfUnauthorized = ensureFunction(
    options.continueIfUnauthorized,
    false
  );
  const realm = ensureFunction(options.realm);

  assert(
    typeof users == "object",
    "Expected an object for the basic auth users, found " +
      typeof users +
      " instead"
  );
  assert(
    typeof authorize == "function",
    "Expected a function for the basic auth authorizer, found " +
      typeof authorize +
      " instead"
  );

  const unauthorized = async (ctx: Context, next: Next) => {
    if (challenge) {
      let challengeString = "Basic";
      const realmName = realm(ctx);

      if (realmName) {
        challengeString += ' realm="' + realmName + '"';
      }

      ctx.set("WWW-Authenticate", challengeString);
    }

    ctx.status = 401;

    if (continueIfUnauthorized(ctx)) {
      return next();
    }
  };

  return async function koaBasicAuth(ctx: Context, next: Next) {
    const authentication = basicAuth(ctx.req);

    if (!authentication) {
      return unauthorized(ctx, next);
    }

    ctx.state.auth = {
      user: authentication.name,
      password: authentication.pass,
    };

    const isAuthorized = await authorize(
      authentication.name,
      authentication.pass
    );
    if (!isAuthorized) {
      return unauthorized(ctx, next);
    }

    return next();
  };
}

export default koaBasicAuth;
