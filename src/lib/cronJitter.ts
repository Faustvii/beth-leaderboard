import { sleep } from "bun";
import { hashCode } from "./utils";

export const applyCronJitter = async (
  cronName: string,
  maxJitterMs: number,
) => {
  if (maxJitterMs <= 0) {
    return;
  }

  const podIdentity = process.env.HOSTNAME ?? `${process.pid}`;
  const jitterSeed = `${cronName}:${podIdentity}`;
  const jitterMs = Math.abs(hashCode(jitterSeed)) % (maxJitterMs + 1);

  if (jitterMs > 0) {
    await sleep(jitterMs);
  }
};
