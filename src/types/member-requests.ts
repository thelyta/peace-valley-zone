import type {
  HouseholdMemberRequestResponseDtoOutput,
  ListHouseholdMemberRequestsResponseDtoOutputItemsItem,
} from "@/api/generated/estatelyAPI.schemas";

export type THouseholdMemberRequest = ListHouseholdMemberRequestsResponseDtoOutputItemsItem;
export type TCreatedHouseholdMemberRequest = HouseholdMemberRequestResponseDtoOutput;
