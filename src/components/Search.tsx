interface Props extends JSX.HtmlInputTag {
  outputField: string;
  dataListId: string;
  label: string;
}

export const SearchHtml = ({ ...props }: Props) => (
  <>
    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
      <svg
        class="h-4 w-4 text-gray-500 dark:text-gray-400"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 20 20"
      >
        <path
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
        />
      </svg>
    </div>
    <input
      hx-swap="innerHtml"
      hx-get="/match/search"
      hx-target={`#${props.dataListId}`}
      hx-params="name"
      name="name"
      list={props.dataListId}
      id={`${props.dataListId}-input`}
      class="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 pl-10 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-0 dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
      placeholder=" "
      autocomplete="off"
      hx-trigger="keyup changed delay:300ms"
      hx-sync="this:replace"
      hx-indicator=".progress-bar"
      _={`on change 
      get <#${props.dataListId} option[value="\${my.value}"]/> 
      then put its @id into #${props.outputField}@value`}
      {...props}
    />
    <label
      for={`${props.dataListId}-input`}
      class="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform pl-10 text-sm text-gray-500 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:pl-0 peer-focus:font-medium peer-focus:text-blue-600 dark:text-gray-400 peer-focus:dark:text-blue-500"
    >
      {props.label}
    </label>
    <datalist id={props.dataListId}></datalist>
  </>
);
