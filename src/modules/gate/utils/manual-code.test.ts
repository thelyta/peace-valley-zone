import { describe, expect, it } from "vitest";
import { isCompleteManualVisitorCode, normalizeManualVisitorCode } from "./manual-code";

describe("manual visitor codes", () => {
  it("normalizes pasted codes before checking their length", () => {
    expect(normalizeManualVisitorCode("ab-c 234")).toBe("ABC234");
    expect(isCompleteManualVisitorCode("ab-c 234")).toBe(true);
  });

  it("waits until all six characters are present", () => {
    expect(isCompleteManualVisitorCode("ABC23")).toBe(false);
  });
});
