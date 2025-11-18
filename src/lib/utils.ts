import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...classes: ClassValue[]) => twMerge(clsx(...classes));

export const isDefined = <T>(x: T | null | undefined): x is T => {
  return typeof x !== "undefined" && x !== null;
};

/**
 * @param array Array to pick from.
 * @param count Count of elements to pick.
 * @returns Array of length count containing distinct elements from input array.
 */
export function pick<T>(array: T[], count: number) {
  const result: T[] = [];

  const nonPickedIndices = Array(array.length)
    .fill(undefined)
    .map((_, i) => i);

  for (let i = 0; i < count; i++) {
    const randomIndexIndex = Math.floor(
      Math.random() * nonPickedIndices.length,
    );
    const pickedIndex = nonPickedIndices.splice(randomIndexIndex, 1)[0];
    result.push(array[pickedIndex]);
  }

  return result;
}

/**
 * Returns a hash code for a string. Compatible to Java's `String.hashCode()`.
 *
 * @link
 * https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0?permalink_comment_id=2694461#gistcomment-2694461
 * .
 *
 * @param s Input string.
 * @returns Hash code of the input string.
 */
export function hashCode(string: string): number {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = (Math.imul(31, hash) + string.charCodeAt(i)) | 0;
  }
  return hash;
}
