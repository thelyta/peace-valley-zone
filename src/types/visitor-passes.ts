import type {
  CreateVisitorPassResponseDtoOutput,
  HouseholdEntryGatesResponseDtoOutputItemsItem,
  ListVisitorPassesResponseDtoOutputItemsItem,
  VisitorEligibilityResponseDtoOutput,
} from "@/api/generated/estatelyAPI.schemas";

export type TEntryGate = HouseholdEntryGatesResponseDtoOutputItemsItem;
export type TVisitorEligibility = VisitorEligibilityResponseDtoOutput;
export type TVisitorPass = ListVisitorPassesResponseDtoOutputItemsItem;
export type TCreatedVisitorPass = CreateVisitorPassResponseDtoOutput;
