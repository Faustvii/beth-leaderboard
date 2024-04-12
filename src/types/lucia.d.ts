/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/consistent-type-imports */
/// <reference types="lucia" />
declare namespace Lucia {
  type Auth = import("../auth/index").ReadAuth;
  interface DatabaseUserAttributes {
    name: string;
    email?: string | null;
    picture?: string | null;
  }
  interface DatabaseSessionAttributes {}
}
