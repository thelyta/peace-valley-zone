import type {
  HouseholdMembershipResponseDtoOutput,
  ListHouseholdMembersResponseDtoOutputItemsItem,
  ListHouseholdsResponseDtoOutput,
  ListHouseholdsResponseDtoOutputItemsItem,
} from "@/api/generated/estatelyAPI.schemas";
import type { HouseholdDuesStatus } from "@/types/enums";

/** The directory API includes the current annual dues status for each household. */
export type THouseholdItem = ListHouseholdsResponseDtoOutputItemsItem & {
  duesStatus: HouseholdDuesStatus;
};
export type THouseholdsResponse = Omit<ListHouseholdsResponseDtoOutput, "items"> & {
  items: THouseholdItem[];
};
export type THouseholdMemberItem = ListHouseholdMembersResponseDtoOutputItemsItem;
export type THouseholdMembership = HouseholdMembershipResponseDtoOutput;
