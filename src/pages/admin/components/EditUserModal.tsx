import { type User } from "../../../db/schema/auth";
import { cn } from "../../../lib/utils";

type EditableUserFields = Pick<User, "id" | "name" | "nickname">;

interface EditUserModalProps {
  user: EditableUserFields;
}

export const EditUserModal = ({ user }: EditUserModalProps) => {
  const formId = `edit-user-${user.id}-form`;

  return (
    <div
      id="edit-user-modal"
      class={cn(
        "fixed bottom-0 left-0 right-0 top-0 z-40 backdrop-brightness-50",
        "flex flex-col items-center justify-center",
      )}
      _="on closeEditModal remove me"
    >
      <div
        class="absolute bottom-0 left-0 right-0 top-0 -z-50"
        _="on click trigger closeEditModal"
      />
      <div class="-z-20 w-[80%] max-w-[600px] rounded-md bg-slate-800 p-4 text-white shadow-md lg:p-8">
        <h1 class="mb-4 text-2xl font-semibold">Edit user</h1>
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
          <input type="hidden" name="userId" value={user.id} form={formId} />
          <div class="group relative mb-6 w-full">
            <input
              type="text"
              form={formId}
              name="fullName"
              id={`${formId}-fullName`}
              placeholder=" "
              required={true}
              value={user.name}
              class="peer block w-full appearance-none border-0 border-b-2 border-gray-400 bg-transparent px-0 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-0"
            />
            <label
              for={`${formId}-fullName`}
              class="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-400 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:font-medium peer-focus:text-blue-400"
            >
              Full name
            </label>
          </div>
          <div class="group relative mb-6 w-full">
            <input
              type="text"
              form={formId}
              name="nickname"
              id={`${formId}-nickname`}
              placeholder=" "
              required={true}
              value={user.nickname}
              class="peer block w-full appearance-none border-0 border-b-2 border-gray-400 bg-transparent px-0 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-0"
            />
            <label
              for={`${formId}-nickname`}
              class="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-400 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:font-medium peer-focus:text-blue-400"
            >
              Nickname
            </label>
          </div>
          <div class="mt-3 flex justify-end gap-3">
            <button
              type="button"
              class="rounded-lg bg-red-700 p-2"
              _="on click trigger closeEditModal"
            >
              Cancel
            </button>
            <button
              hx-put="/admin/edit-user"
              type="submit"
              class="rounded-lg bg-teal-700 p-2"
              hx-indicator=".progress-bar"
              _="on click set my.innerText to 'Saving...' then wait for htmx:afterRequest then set my.innerText to 'Save'"
            >
              Save
            </button>
          </div>
          <div id="errors" class="mt-2 text-red-400"></div>
        </form>
      </div>
    </div>
  );
};
