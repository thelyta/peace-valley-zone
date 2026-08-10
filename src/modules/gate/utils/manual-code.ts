export const MANUAL_VISITOR_CODE_LENGTH = 6;

export function normalizeManualVisitorCode(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

export function isCompleteManualVisitorCode(value: string) {
  return normalizeManualVisitorCode(value).length === MANUAL_VISITOR_CODE_LENGTH;
}
