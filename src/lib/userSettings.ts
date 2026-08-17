import { eq } from "drizzle-orm";
import { readDb, writeDb } from "../db";
import { userTbl } from "../db/schema";

export type SettingValue = boolean | string | undefined;

export interface UserSettings {
  showHolidays?: boolean;
  theme?: "classic" | "claude";
}

export interface CheckboxSettingDefinition {
  key: keyof UserSettings;
  label: string;
  type: "checkbox";
  description?: string;
}

export interface SelectSettingDefinition {
  key: keyof UserSettings;
  label: string;
  type: "select";
  options: string[];
  description?: string;
}

export type SettingDefinition =
  | CheckboxSettingDefinition
  | SelectSettingDefinition;

export const userSettingsDefaults: UserSettings = {
  showHolidays: true,
  theme: "classic",
};

export const settingDefinitions: SettingDefinition[] = [
  {
    key: "showHolidays",
    label: "Show Holidays",
    type: "checkbox",
  },
  {
    key: "theme",
    label: "Theme",
    type: "select",
    options: ["classic", "claude"],
  },
];

export function mergeSettingsWithDefaults(
  dbSettings: UserSettings | null,
): UserSettings {
  return {
    ...userSettingsDefaults,
    ...dbSettings,
  };
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const user = await readDb.query.userTbl.findFirst({
    columns: { settings: true },
    where: eq(userTbl.id, userId),
  });

  return mergeSettingsWithDefaults(user?.settings as UserSettings | null);
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>,
): Promise<void> {
  const settingsToSave: Record<string, unknown> = {};

  if (settings.showHolidays !== undefined) {
    settingsToSave.showHolidays = settings.showHolidays;
  }

  if (settings.theme !== undefined) {
    settingsToSave.theme = settings.theme;
  }

  if (Object.keys(settingsToSave).length > 0) {
    await writeDb
      .update(userTbl)
      .set({ settings: settingsToSave })
      .where(eq(userTbl.id, userId));
  }
}
