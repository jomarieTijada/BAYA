/** Native SQLite owns its connection lifecycle through closeAsync(). */
export async function releaseSqliteWorker(): Promise<void> {}
