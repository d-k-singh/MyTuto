/** Laravel serializes dates as full ISO datetimes; <input type="date"> needs plain YYYY-MM-DD. */
export function toDateInputValue(isoDate: string | null): string {
  return isoDate ? isoDate.slice(0, 10) : "";
}
