import React from "react";
import { Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { BaseCard } from "../BaseCard";
describe("Shared card interaction", () => {
  it("locks interaction without dropping header/content/footer slots", () => {
    const onPress = jest.fn();
    const view = render(
      <BaseCard
        accessibilityLabel="Lesson"
        status="locked"
        onPress={onPress}
        header={<Text>Title</Text>}
        content={<Text>Body</Text>}
        footer={<Text>Footer</Text>}
      />,
    );
    fireEvent.press(screen.getByLabelText("Lesson"));
    expect(onPress).not.toHaveBeenCalled();
    for (const text of ["Title", "Body", "Footer"])
      expect(screen.getByText(text)).toBeTruthy();
    view.rerender(
      <BaseCard
        accessibilityLabel="Lesson"
        status="available"
        onPress={onPress}
      />,
    );
    fireEvent.press(screen.getByLabelText("Lesson"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
