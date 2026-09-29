import React from "react";
import { Pressable, StyleSheet, View, type ViewProps } from "react-native";
import { Colors, Radius, Spacing } from "../../../constants/theme";
import { CardHeader } from "./CardHeader";
import { CardContent } from "./CardContent";
import { CardFooter } from "./CardFooter";
export type CardStatus = "locked" | "available" | "completed" | "current";
export type BaseCardProps = ViewProps & {
  variant?: "default" | "outlined" | "filled";
  size?: "small" | "medium" | "large";
  status?: CardStatus;
  theme?: "paper" | "warm";
  icon?: React.ReactNode;
  header?: React.ReactNode;
  content?: React.ReactNode;
  footer?: React.ReactNode;
  onPress?: () => void;
};
export function BaseCard({
  variant = "default",
  size = "medium",
  status = "available",
  theme = "paper",
  icon,
  header,
  content,
  footer,
  children,
  style,
  onPress,
  ...props
}: BaseCardProps) {
  const body = (
    <>
      {(header || icon) && <CardHeader icon={icon}>{header}</CardHeader>}
      {content && <CardContent>{content}</CardContent>}
      {children}
      {footer && <CardFooter>{footer}</CardFooter>}
    </>
  );
  const cardStyle = [
    styles.base,
    {
      padding:
        size === "small"
          ? Spacing.sm
          : size === "large"
            ? Spacing.lg
            : Spacing.md,
    },
    theme === "warm" && styles.warm,
    variant === "filled" && styles.warm,
    variant === "outlined" && styles.outlined,
    status === "current" && styles.current,
    status === "completed" && styles.completed,
    status === "locked" && styles.locked,
    style,
  ];
  const accessibilityState = {
    ...props.accessibilityState,
    disabled: status === "locked" || props.accessibilityState?.disabled,
  };
  return onPress ? (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      disabled={accessibilityState.disabled}
      onPress={onPress}
      style={cardStyle}
    >
      {body}
    </Pressable>
  ) : (
    <View {...props} accessibilityState={accessibilityState} style={cardStyle}>
      {body}
    </View>
  );
}
export const Card = BaseCard;
const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    backgroundColor: "#FFFDF9",
    borderColor: "#EFE7DA",
    borderWidth: 1,
  },
  warm: { backgroundColor: "#FFF5E7" },
  outlined: { backgroundColor: "transparent" },
  current: { borderColor: Colors.rolePrimary },
  completed: { borderColor: Colors.success },
  locked: { opacity: 0.65 },
});
