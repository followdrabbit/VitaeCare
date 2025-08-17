// Event bus for data change notifications
export const DATA_CHANGED = "vitaecare:data-changed" as const;
export type Change = { type: "oils" | "recipes"; source?: "import" | "save" | "delete" | "reset" };

export function notifyChange(change: Change) {
  window.dispatchEvent(new CustomEvent<Change>(DATA_CHANGED, { detail: change }));
}

export function onChange(cb: (change: Change) => void) {
  const handler = (e: Event) => cb((e as CustomEvent<Change>).detail);
  window.addEventListener(DATA_CHANGED, handler as EventListener);
  return () => window.removeEventListener(DATA_CHANGED, handler as EventListener);
}