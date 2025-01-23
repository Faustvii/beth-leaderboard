interface UserFormProps {
  formId: string;
  action_url: string;
  submit_text: string;
}

export const UserForm = async ({
  formId,
  action_url,
  submit_text,
}: UserFormProps) => {
  return (
    <>
      <form
        class="flex w-full flex-col"
        method="put"
        id={formId}
        hx-ext="response-targets"
        enctype="multipart/form-data"
        hx-indicator=".progress-bar"
        hx-sync="this:abort"
        hx-swap="outerHTML"
        hx-target={`#${formId}`}
        hx-target-400="#errors"
      >
        <div class="group relative mb-6 w-full">
          <input
            type="text"
            form={formId}
            name="name"
            id="name"
            placeholder=" "
            required={true}
            class="peer block w-full appearance-none border-0 border-b-2 border-gray-600 bg-transparent px-0 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-0"
          />
          <label
            for="name"
            class="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-400 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:font-medium peer-focus:text-blue-500"
          >
            Full name
          </label>
        </div>
        <button
          hx-put={action_url}
          type="submit"
          class="rounded-lg bg-teal-700 p-2"
          hx-indicator=".progress-bar"
          _="on click set my.innerText to 'Saving...'"
        >
          {submit_text}
        </button>
        <div id="errors" class="text-red-500"></div>
      </form>
    </>
  );
};
