import React from "react";
import { Text } from "react-native";
import { BaseCard, type BaseCardProps } from "../../ui/cards/BaseCard";
import { AppIcon } from "../../ui/AppIcon";
export type ActivityCardProps = BaseCardProps & {
  type?: "video" | "story" | "practice" | "writing" | "audio";
  title?: string;
};
export function ActivityCard({
  type = "story",
  title,
  ...props
}: ActivityCardProps) {
  return (
    <BaseCard
      icon={
        <AppIcon
          name={
            type === "video"
              ? "video"
              : type === "writing"
                ? "pencil"
                : "lessons"
          }
        />
      }
      header={
        title ? <Text accessibilityRole="header">{title}</Text> : undefined
      }
      {...props}
    />
  );
}
