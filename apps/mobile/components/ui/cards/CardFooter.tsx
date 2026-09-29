import React from "react";
import { View, type ViewProps } from "react-native";
export function CardFooter({
  children,
  icon,
  style,
  ...props
}: ViewProps & { icon?: React.ReactNode }) {
  return (
    <View {...props} style={[{ gap: 8 }, style]}>
      {icon}
      {children}
    </View>
  );
}
