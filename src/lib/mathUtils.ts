/**
 * Normalize a number in a range
 *
 * @example norm(10, 0, 100); // 0.1
 *
 * @param value value to be normalized
 * @param start start of range
 * @param end end of range
 * @returns
 */
export const normalize = (value: number, start: number, end: number) => {
  return (value - start) / (end - start);
};

/**
 * Maps a normalized number into a number range
 *
 * @example lerp(0.1, 0, 100); // 10
 *
 * @param value value to be mapped, must be between 0 and 1
 * @param start start of range
 * @param end end of range
 */
export const lerp = (value: number, start: number, end: number) => {
  return start + value * (end - start);
};
