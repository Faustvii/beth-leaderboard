import { type PropsWithChildren } from "@kitajs/html";

export const SelectHtml = ({ children }: PropsWithChildren) => (
  <>
    <label
      for="countries"
      class="mb-2 block text-sm font-medium text-gray-900 dark:text-text-primary"
    >
      Select an option
    </label>
    <select
      id="countries"
      class="border-border-input-light block w-full rounded-lg border bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-action focus:ring-action dark:border-border-input dark:bg-surface-hover dark:text-text-primary dark:placeholder-text-muted dark:focus:border-action dark:focus:ring-action"
    >
      <option selected={true}>Choose a country</option>
      <option value="US">United States</option>
      <option value="CA">Canada</option>
      <option value="FR">France</option>
      <option value="DE">Germany</option>
    </select>

    {children}
  </>
);
