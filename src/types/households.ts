import type {
  HouseholdMembershipResponseDtoOutput,
  ListHouseholdMembersResponseDtoOutputItemsItem,
  ListHouseholdsResponseDtoOutputItemsItem,
} from "@/api/generated/magodoEstateAPI.schemas";

export type THouseholdItem = ListHouseholdsResponseDtoOutputItemsItem;
export type THouseholdMemberItem = ListHouseholdMembersResponseDtoOutputItemsItem;
export type THouseholdMembership = HouseholdMembershipResponseDtoOutput;
