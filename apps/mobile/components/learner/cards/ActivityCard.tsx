import { Text } from '../../../localization/components';
import React from "react";

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
            (() => {
              if (type === "video") {
                return "video";
              } else {
                if (type === "writing") {
                  return "pencil";
                } else {
                  return "lessons";
                }
              }
            })()
          }
        />
      }
      header={
        (() => {
          if (title) {
            return <Text accessibilityRole="header">{title}</Text>;
          } else {
            return undefined;
          }
        })()
      }
      {...props}
    />
  );
}
