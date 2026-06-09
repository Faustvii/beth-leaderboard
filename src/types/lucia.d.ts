/* eslint-disable @typescript-eslint/consistent-type-imports */
/// <reference types="lucia" />
declare namespace Lucia {
  type Auth = import("../auth/index").ReadAuth;
  interface DatabaseUserAttributes {
    name: string;
    nickname: string;
    email?: string | null;
    picture?: string | null;
    roles?: string | null;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Lucia module augmentation hook
  interface DatabaseSessionAttributes {}
}
