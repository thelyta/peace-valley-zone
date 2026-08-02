import type {
  HouseholdMembershipResponseDtoOutput,
  ListHouseholdMembersResponseDtoOutputItemsItem,
  ListHouseholdsResponseDtoOutputItemsItem,
} from "@/api/generated/estatelyAPI.schemas";
import type { HouseholdDuesStatus } from "@/types/enums";

/** The directory API includes the current annual dues status for each household. */
export type THouseholdItem = ListHouseholdsResponseDtoOutputItemsItem & {
  duesStatus: HouseholdDuesStatus | null;
};
export type THouseholdMemberItem = ListHouseholdMembersResponseDtoOutputItemsItem;
export type THouseholdMembership = HouseholdMembershipResponseDtoOutput;
