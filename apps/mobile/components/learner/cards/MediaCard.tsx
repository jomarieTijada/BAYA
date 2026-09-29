import React from "react";
import { ActivityCard, type ActivityCardProps } from "./ActivityCard";
export function MediaCard(props: ActivityCardProps) {
  return <ActivityCard type="video" {...props} />;
}
