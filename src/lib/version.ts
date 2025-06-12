import { config } from "../config";

export const VERSION = {
  gitSha:
    config.env.NODE_ENV === "development"
      ? "development"
      : config.env.GIT_SHA || "unknown",
};
