/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/consistent-type-imports */
/// <reference types="lucia" />
declare namespace Lucia {
  type Auth = import("../auth/index").Auth;
  interface DatabaseUserAttributes {
    name: string;
    email?: string | null;
    picture: string;
    elo: number;
  }
  interface DatabaseSessionAttributes {}
}
