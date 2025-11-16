import { cn, isDefined } from "../lib/utils";

interface Props {
  title: string;
  children: JSX.Element;
  icon?: string;
  action?: string;
}

export const ActionCard = ({ title, children, icon, action }: Props) => {
  const actionProperties = isDefined(action)
    ? {
        "hx-indicator": ".progress-bar",
        "hx-target": "#mainContainer",
        "hx-swap": "innerHTML",
        "hx-push-url": "true",
        "hx-get": action,
        role: "button",
      }
    : {};

  return (
    <div
      {...actionProperties}
      class={cn(
        "flex flex-col gap-4 rounded-lg border border-primary/20 p-6",
        "transition-colors duration-200 hover:border-primary/40",
        "bg-gradient-to-br from-primary/5 to-transparent",
        isDefined(action) ? "cursor-pointer hover:bg-primary/5" : "",
      )}
    >
      <div class="flex items-start gap-3">
        {icon && <span class="text-3xl">{icon}</span>}
        <div class="flex-1">
          <h3 class="text-foreground text-lg font-semibold">{title}</h3>
        </div>
      </div>
      <div class="text-muted-foreground text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
};
