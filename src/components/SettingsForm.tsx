import {
  settingDefinitions,
  type SettingDefinition,
  type SettingValue,
  type UserSettings,
} from "../lib/userSettings";

interface SettingFieldProps {
  settingDefinition: SettingDefinition;
  value: SettingValue;
}

const SettingField = ({ settingDefinition, value }: SettingFieldProps) => {
  if (settingDefinition.type === "checkbox") {
    return (
      <div class="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          name={settingDefinition.key}
          id={settingDefinition.key}
          value="true"
          checked={value as boolean}
          class="h-4 w-4 rounded border-gray-600 bg-gray-700 text-teal-700 focus:ring-teal-700"
        />
        <label
          for={settingDefinition.key}
          class="text-sm font-medium text-gray-300"
        >
          {settingDefinition.label}
        </label>
      </div>
    );
  }

  if (settingDefinition.type === "select") {
    return (
      <div class="mb-4">
        <label
          for={settingDefinition.key}
          class="block text-sm font-medium text-gray-300"
        >
          {settingDefinition.label}
        </label>
        <select
          name={settingDefinition.key}
          id={settingDefinition.key}
          class="mt-1 w-full rounded-lg border-gray-600 bg-gray-700 p-2 text-gray-300 focus:border-teal-700 focus:ring-teal-700"
        >
          {settingDefinition.options.map((option) => (
            <option value={option} selected={value === option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return null;
};

interface SettingsFormProps {
  settings: UserSettings;
  showSuccessMessage?: boolean;
}

export const SettingsForm = ({
  settings,
  showSuccessMessage = false,
}: SettingsFormProps) => {
  return (
    <>
      <form
        class="flex w-full flex-col"
        method="put"
        id="settings-form"
        hx-ext="response-targets"
        enctype="multipart/form-data"
        hx-indicator=".progress-bar"
        hx-sync="this:abort"
        hx-swap="outerHTML"
        hx-target={`#settings-form`}
        hx-target-400="#settings-errors"
      >
        {settingDefinitions.map((setting) => (
          <SettingField
            settingDefinition={setting}
            value={settings[setting.key] as boolean | string | undefined}
          />
        ))}
        <button
          hx-put="/api/settings"
          type="submit"
          class="rounded-lg bg-teal-700 p-2"
          hx-indicator=".progress-bar"
          _="on click set my.innerText to 'Saving...'"
        >
          Save Settings
        </button>
        <div id="settings-errors" class="text-red-500"></div>
        {showSuccessMessage && (
          <div class="text-green-500">Settings saved successfully!</div>
        )}
      </form>
    </>
  );
};
