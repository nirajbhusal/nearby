export type ToastDetail = {
  message: string;
  undo?: () => void;
};

export function showToast(message: string, undo?: () => void) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastDetail>("nearby-toast", { detail: { message, undo } }));
}
