import type {
  AssessHouseholdDuesResponseDtoOutput,
  DuesPeriodResponseDtoOutput,
  HouseholdDuesResponseDtoOutput,
  ListHouseholdDuesResponseDtoOutputItemsItem,
} from "@/api/generated/magodoEstateAPI.schemas";

export type TDuesPeriod = DuesPeriodResponseDtoOutput;
export type THouseholdDuesItem = ListHouseholdDuesResponseDtoOutputItemsItem;
export type THouseholdDues = HouseholdDuesResponseDtoOutput;
export type TAssessHouseholdsResult = AssessHouseholdDuesResponseDtoOutput;
