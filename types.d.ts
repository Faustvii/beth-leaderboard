declare namespace JSX {
  interface HtmlTag {
    onblur?: string;
    _?: string;
  }
}

declare namespace Htmx {
  type HxSync = `${string}:${
    | "drop"
    | "abort"
    | "replace"
    | "queue"
    | "queue first"
    | "queue last"
    | "queue all"}`;
}
