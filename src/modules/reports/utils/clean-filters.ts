export function cleanFilters(filters: Record<string, string | number | undefined>) {
  const query: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      query[key] = value;
    }
  }
  return query;
}
