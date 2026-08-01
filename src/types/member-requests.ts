import type {
  HouseholdMemberRequestResponseDtoOutput,
  ListHouseholdMemberRequestsResponseDtoOutputItemsItem,
} from "@/api/generated/magodoEstateAPI.schemas";

export type THouseholdMemberRequest = ListHouseholdMemberRequestsResponseDtoOutputItemsItem;
export type TCreatedHouseholdMemberRequest = HouseholdMemberRequestResponseDtoOutput;
