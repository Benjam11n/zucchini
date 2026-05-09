const PREVIEW_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  weekday: "short",
});

export function formatPreviewDate(date: Date): string {
  return PREVIEW_DATE_FORMAT.format(date);
}

export function getCopyrightYear(date: Date): number {
  return date.getFullYear();
}
