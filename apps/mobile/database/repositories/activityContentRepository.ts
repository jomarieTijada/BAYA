import { getDatabaseConnection } from "../connection";
import type { DatabaseConnection } from "../types";
export interface ContentRecord {
  activity_id: string;
  revision: number;
  validation_status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  payload_json: string;
}
export const activityContentRepository = {
  async getByTopicId(
    id: string,
    override?: DatabaseConnection,
  ): Promise<ContentRecord | null> {
    const db = override ?? (await getDatabaseConnection());
    return db.getFirstAsync<ContentRecord>(
      "SELECT activity_id, revision, validation_status, reviewed_by, reviewed_at, payload_json FROM activity_content WHERE activity_id = ?;",
      [id],
    );
  },
};
