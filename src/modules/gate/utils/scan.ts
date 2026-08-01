export const QR_PAYLOAD_PREFIX = "pvz://pass/v1/";

export function isQrPayload(value: string) {
  return value.startsWith(QR_PAYLOAD_PREFIX);
}

export function isAcceptableScan(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  if (isQrPayload(trimmed)) {
    return trimmed.length > QR_PAYLOAD_PREFIX.length;
  }
  // Allow raw human codes if somehow scanned from printed material.
  return /^[2-9A-HJ-NP-Z]{4,12}$/i.test(trimmed.replace(/\s+/g, ""));
}
