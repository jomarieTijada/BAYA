import { getApprovedStorybookActivity } from '../../content/approvedStorybook';
import { approvedCurriculum } from "../../content/approvedCurriculum";
import { parseActivity } from "../../content/parseActivity";
import type { TopicActivityData } from "../../content/types";
import {
  activityContentRepository,
  type ContentRecord,
} from "../repositories/activityContentRepository";
import type { DatabaseConnection } from "../types";

/** A future authenticated CMS adapter implements this interface. No network access in UI. */
export interface ActivityContentSource {
  getByTopicId(id: string): Promise<ContentRecord | null>;
}
export function createActivityContentService(source: ActivityContentSource) {
  return {
    async getByTopicId(id: string): Promise<TopicActivityData | null> {
      const module = approvedCurriculum.find((m) =>
        m.topics.some((t) => t.id === id),
      );
      if (!module) return null;
      try {
        const row = await source.getByTopicId(id);
        if (
          !row ||
          row.activity_id !== id ||
          row.validation_status !== "approved" ||
          !row.reviewed_by?.trim() ||
          !row.reviewed_at ||
          !Number.isFinite(Date.parse(row.reviewed_at)) ||
          !Number.isInteger(row.revision) ||
          row.revision < 1 ||
          typeof row.payload_json !== "string" ||
          row.payload_json.length > 1000000
        )
          return null;
        const parsed = parseActivity(JSON.parse(row.payload_json), id);
        if (!parsed || parsed.moduleId !== module.id) return null;
        const index = module.topics.findIndex((t) => t.id === id);
        return {
          ...parsed,
          title: module.topics[index].title,
          moduleTitle: module.title,
          activityIndex: index + 1,
          totalActivitiesInModule: module.topics.length,
        };
      } catch {
        return null;
      }
    },
  };
}
function withApprovedStorybook(source: ActivityContentSource) {
  const reviewed = createActivityContentService(source);
  return {
    async getByTopicId(id: string): Promise<TopicActivityData | null> {
      // The supplied approved pages also work offline. Old database previews
      // cannot override their exact teaching text.
      return getApprovedStorybookActivity(id) ?? reviewed.getByTopicId(id);
    },
  };
}
export const activityContentService = withApprovedStorybook(activityContentRepository);
export const activityContentFromDatabase = (db: DatabaseConnection) => withApprovedStorybook({
  getByTopicId: id => activityContentRepository.getByTopicId(id, db),
});
