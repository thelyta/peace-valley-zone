import type {
  HouseholdMembershipResponseDtoOutput,
  ListHouseholdMembersResponseDtoOutputItemsItem,
  ListHouseholdsResponseDtoOutputItemsItem,
} from "@/api/generated/estatelyAPI.schemas";

export type THouseholdItem = ListHouseholdsResponseDtoOutputItemsItem;
export type THouseholdMemberItem = ListHouseholdMembersResponseDtoOutputItemsItem;
export type THouseholdMembership = HouseholdMembershipResponseDtoOutput;
