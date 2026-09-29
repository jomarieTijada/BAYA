import { parseActivity } from "../parseActivity";
import { getActivityData, getActivitySteps } from "../activities";
import { isValidRemoteUrl } from "../mediaPolicy";
const payload = {
  id: "topic-7-20",
  moduleId: "module-7",
  moduleTitle: "Module 7",
  title: "Topic 20",
  steps: [
    {
      id: "story-1",
      type: "story",
      title: "Story",
      content: {
        title: "Story",
        content: "Reviewed text",
        storyMessage: "Message",
        illustration: { type: "asset", assetId: "new-art" },
      },
    },
  ],
};
describe("Data-driven content boundary", () => {
  it("accepts a new module/topic and illustration ID without a screen change", () => {
    const result = parseActivity(payload);
    expect(result?.moduleId).toBe("module-7");
    expect(result?.steps[0].content).toMatchObject({
      illustration: { type: "asset", assetId: "new-art" },
      storyMessage: "Message",
    });
  });
  it.each([
    null,
    {},
    { ...payload, steps: [] },
    { ...payload, steps: [...payload.steps, ...payload.steps] },
    {
      ...payload,
      steps: [
        {
          ...payload.steps[0],
          content: { title: "x", content: { html: "<script />" } },
        },
      ],
    },
    { ...payload, steps: [{ ...payload.steps[0], type: "execute" }] },
  ])("rejects malformed or unsupported payloads", (value) =>
    expect(parseActivity(value)).toBeNull(),
  );
  it("rejects mismatched IDs and arbitrary local paths from storage", () => {
    expect(parseActivity(payload, "different")).toBeNull();
    expect(
      parseActivity({
        ...payload,
        steps: [
          {
            ...payload.steps[0],
            content: {
              title: "x",
              content: "x",
              illustration: { type: "local", source: "C:/secret.png" },
            },
          },
        ],
      }),
    ).toBeNull();
  });
  it("does not show another topic for an unknown ID", () => {
    expect(getActivityData("missing").id).toBe("missing");
    expect(getActivitySteps(getActivityData("missing"))).toEqual([]);
  });
  it("requires exact approved HTTPS origins, not URL prefixes", () => {
    const allow = ["https://media.baya.example"];
    expect(
      isValidRemoteUrl("https://media.baya.example/movie.mp4", allow),
    ).toBe(true);
    for (const url of [
      "https://media.baya.example.evil.test/x",
      "https://media.baya.example@evil.test/x",
      "https://user:pass@media.baya.example/x",
      "http://media.baya.example/x",
      "javascript:alert(1)",
      "file:///secret",
      "https://media.baya.example:8443/x",
    ])
      expect(isValidRemoteUrl(url, allow)).toBe(false);
    expect(isValidRemoteUrl("https://unapproved.example/x")).toBe(false);
  });
});
