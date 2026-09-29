import React from "react";
import { ActivityCard, type ActivityCardProps } from "./ActivityCard";
export function StoryCard(props: ActivityCardProps) {
  return <ActivityCard type="story" theme="warm" {...props} />;
}
