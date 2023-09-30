import { type PropsWithChildren } from "beth-stack/jsx";

export const SelectHtml = ({ children }: PropsWithChildren) => (
  <>
    <label
      for="countries"
      class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
    >
      Select an option
    </label>
    <select
      id="countries"
      class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
    >
      <option selected="true">Choose a country</option>
      <option value="US">United States</option>
      <option value="CA">Canada</option>
      <option value="FR">France</option>
      <option value="DE">Germany</option>
    </select>

    {children}
  </>
);
