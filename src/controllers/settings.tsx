import Elysia, { t } from "elysia";
import { SettingsForm } from "../components/SettingsForm";
import { ctx } from "../context";
import { getCurrentUser } from "../lib/store";
import {
  getUserSettings,
  settingDefinitions,
  updateUserSettings,
  type UserSettings,
} from "../lib/userSettings";

const settingsBodySchema = t.Object(
  Object.fromEntries(
    settingDefinitions.map((setting) => [setting.key, t.Optional(t.String())]),
  ),
);

export const settingsController = new Elysia({
  prefix: "/settings",
})
  .use(ctx)
  .get("/", async ({ set }) => {
    const user = getCurrentUser();
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const settings = await getUserSettings(user.id);
    return settings;
  })
  .put(
    "/",
    async ({ set, body }) => {
      const user = getCurrentUser();
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const settingsToUpdate: UserSettings = {
        showHolidays: body.showHolidays === "true",
        theme: (["classic", "claude"].includes(body.theme ?? "")
          ? body.theme
          : "classic") as UserSettings["theme"],
      };

      await updateUserSettings(user.id, settingsToUpdate);

      const updatedSettings = await getUserSettings(user.id);
      return <SettingsForm settings={updatedSettings} showSuccessMessage />;
    },
    {
      body: settingsBodySchema,
    },
  );
