import { describe, expect, it } from "bun:test";
import { fromTimezoneToUTC } from "../../src/lib/dateUtils";

/** A date whose local wall clock reads the given time, whatever TZ the test runs in. */
const wallClock = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
) => new Date(year, month - 1, day, hour, minute);

describe("fromTimezoneToUTC", () => {
  it("converts Copenhagen winter time (UTC+1)", () => {
    expect(
      fromTimezoneToUTC(wallClock(2026, 11, 17, 14, 28)).toISOString(),
    ).toBe("2026-11-17T13:28:00.000Z");
  });

  it("converts Copenhagen summer time (UTC+2)", () => {
    expect(fromTimezoneToUTC(wallClock(2026, 6, 1, 12, 30)).toISOString()).toBe(
      "2026-06-01T10:30:00.000Z",
    );
  });

  it("handles the days around the DST switches", () => {
    // DST starts 2026-03-29 and ends 2026-10-25
    expect(fromTimezoneToUTC(wallClock(2026, 3, 28, 12, 0)).toISOString()).toBe(
      "2026-03-28T11:00:00.000Z",
    );
    expect(fromTimezoneToUTC(wallClock(2026, 3, 29, 12, 0)).toISOString()).toBe(
      "2026-03-29T10:00:00.000Z",
    );
    expect(
      fromTimezoneToUTC(wallClock(2026, 10, 25, 12, 0)).toISOString(),
    ).toBe("2026-10-25T11:00:00.000Z");
  });

  it("crosses midnight correctly", () => {
    expect(fromTimezoneToUTC(wallClock(2026, 1, 1, 0, 30)).toISOString()).toBe(
      "2025-12-31T23:30:00.000Z",
    );
  });
});
