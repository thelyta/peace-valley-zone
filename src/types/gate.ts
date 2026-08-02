import type {
  ListGateEventsResponseDtoOutputItemsItem,
  MyGatesResponseDtoOutputItemsItem,
  VerifyVisitorResponseDtoOutput,
} from "@/api/generated/estatelyAPI.schemas";

export type TMyGate = MyGatesResponseDtoOutputItemsItem;
export type TGateEvent = ListGateEventsResponseDtoOutputItemsItem;
export type TGateVerification = VerifyVisitorResponseDtoOutput;
export type TGateVerificationValid = Extract<TGateVerification, { valid: true }>;
