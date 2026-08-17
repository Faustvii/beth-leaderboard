interface UserFormProps {
  formId: string;
}

export const UserForm = async ({ formId }: UserFormProps) => {
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
            class="peer block w-full appearance-none border-0 border-b-2 border-border-input bg-transparent px-0 py-2.5 text-sm focus:border-action focus:outline-none focus:ring-0"
          />
          <label
            for="name"
            class="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-text-muted duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:font-medium peer-focus:text-action"
          >
            Full name
          </label>
        </div>
        <div class="group relative mb-6 w-full">
          <input
            type="text"
            form={formId}
            name="nickname"
            id="nickname"
            placeholder=" "
            required={true}
            class="peer block w-full appearance-none border-0 border-b-2 border-border-input bg-transparent px-0 py-2.5 text-sm focus:border-action focus:outline-none focus:ring-0"
          />
          <label
            for="nickname"
            class="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-text-muted duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:font-medium peer-focus:text-action"
          >
            Nickname
          </label>
        </div>
        <button
          hx-put="/admin/guest-user"
          type="submit"
          class="rounded-lg bg-success p-2"
          hx-indicator=".progress-bar"
          _="on click set my.innerText to 'Saving...'"
        >
          Create guest user
        </button>
        <div id="errors" class="text-danger"></div>
      </form>
    </>
  );
};
