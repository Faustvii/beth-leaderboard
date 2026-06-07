import { AsyncLocalStorage } from "node:async_hooks";
import { type User } from "../db/schema/auth";

interface CurrentUserContext {
  user: User | undefined;
}

export const CurrentUserStore = new AsyncLocalStorage<CurrentUserContext>();

export const initializeCurrentUserStore = () => {
  CurrentUserStore.enterWith({ user: undefined });
};

export const setCurrentUser = (user: User | undefined) => {
  const store = CurrentUserStore.getStore();
  if (store) {
    store.user = user;
    return;
  }

  CurrentUserStore.enterWith({ user });
};

export const getCurrentUser = (): User | undefined => {
  return CurrentUserStore.getStore()?.user;
};
