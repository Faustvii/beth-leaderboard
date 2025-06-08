declare namespace JSX {
  interface HtmlTag {
    onblur?: string;
    onload?: string;
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
