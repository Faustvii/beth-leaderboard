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
 * Merges two arrays using a mapping function
 */
export const zip = <Ta, Tb, Tout>(arrA: Ta[], arrB: Tb[], mapFn: (a: Ta, b: Tb) => Tout): Tout[] => {
  const result: Tout[] = [];
  for(let i = 0; i < arrA.length; i++){
    result.push(mapFn(arrA[i], arrB[i]))
  }
  return result;
};
