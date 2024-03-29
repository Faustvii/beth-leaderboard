import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...classes: ClassValue[]) => twMerge(clsx(...classes));

export const isDefined = <T>(x: T | null | undefined): x is T => {
  return typeof x !== "undefined" && x !== null;
};
