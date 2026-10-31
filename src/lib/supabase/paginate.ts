// PostgREST caps every response at 1000 rows (Supabase's default max_rows), so
// an unbounded select silently truncates. This pages through with .range()
// until a short page comes back. The query MUST be ordered on a unique key (or
// a combination that ends in one), otherwise rows can shift between pages.
const PAGE_SIZE = 1000;

export async function fetchAllRows<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<{ data: T[]; error: { message: string } | null }> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) return { data: rows, error };
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return { data: rows, error: null };
}
