export function safeOpenWindow(url: string) {
  try {
    const openedWindow = window.open(url, "_blank", "noopener,noreferrer");

    if (!openedWindow) {
      window.location.href = url;
    }
  } catch (error) {
    window.location.href = url;
  }
}
