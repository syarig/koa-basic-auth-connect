import { timingSafeEqual } from "crypto";
import { Users, Authorizer } from "./options";

export function safeCompare(input: string, secret: string) {
  const inputLength = Buffer.byteLength(input);
  const secretLength = Buffer.byteLength(secret);

  const inputBuffer = Buffer.alloc(inputLength, 0, "utf8");
  inputBuffer.write(input);
  const secretBuffer = Buffer.alloc(inputLength, 0, "utf8");
  secretBuffer.write(secret);

  return (
    timingSafeEqual(inputBuffer, secretBuffer) && inputLength === secretLength
  );
}

export function staticUsersAuthorizer(users: Users): Authorizer {
  return (username: string, password: string) => {
    for (const key of Object.keys(users))
      if (safeCompare(username, key) && safeCompare(password, users[key])) {
        return true;
      }

    return false;
  };
}
