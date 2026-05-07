import { type User } from "../../../db/schema/auth";
import { EditIcon } from "../../../lib/icons";
import { cn } from "../../../lib/utils";

interface EditUserCardProps {
  user: User;
}

export const EditUserCard = ({ user }: EditUserCardProps) => {
  return (
    <div
      id={user.id}
      class={cn(
        "border-1 mb-3 flex w-full flex-col gap-3 rounded-md border p-4 shadow-md",
        "lg:mb-[1%] lg:w-[49.5%]",
      )}
    >
      <div class="flex min-h-0 flex-col gap-1">
        <span class="text-lg font-medium leading-tight">{user.name}</span>
        <span class="text-sm text-gray-500">{user.nickname}</span>
        {user.email ? (
          <span class="truncate text-sm text-gray-400">{user.email}</span>
        ) : null}
      </div>
      <button
        type="button"
        hx-get={`edit-user/${user.id}`}
        hx-target="#mainContainer"
        hx-swap="afterend"
        class={cn(
          "mt-auto flex w-full justify-center gap-3 rounded-lg",
          "bg-teal-700 p-2 hover:bg-teal-700/85",
        )}
        _={`on htmx:afterSettle js htmx.process(document.body) end`}
      >
        <EditIcon />
        <p class="hidden sm:block">Edit</p>
      </button>
    </div>
  );
};
