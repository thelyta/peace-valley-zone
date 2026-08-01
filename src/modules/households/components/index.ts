import type { HouseholdMembership } from "@/types/session";

export type {
  THouseholdItem,
  THouseholdMemberItem,
  THouseholdMembership,
} from "@/types/households";
export { useAddHouseholdMember } from "../mutations/use-add-household-member";
export { useCreateHousehold } from "../mutations/use-create-household";
export { useUpdateHousehold } from "../mutations/use-update-household";
export { useUpdateHouseholdMember } from "../mutations/use-update-household-member";
export {
  householdMembersQueryOptions,
  useFetchHouseholdMembers,
} from "../queries/use-fetch-household-members";
export { householdsQueryOptions, useFetchHouseholds } from "../queries/use-fetch-households";
export { HouseholdsDirectory } from "./directory";
export { HouseholdMembersPanel } from "./household-members-panel";
export { MemberRequestsList } from "./member-requests-list";
export { MyMemberRequestsList } from "./my-member-requests-list";
export { RequestHouseholdMemberForm } from "./request-member-form";

export function householdsForZone(households: HouseholdMembership[], zoneId: string) {
  return households.filter((household) => household.zoneId === zoneId);
}

export function householdLabel(household: HouseholdMembership) {
  return `${household.houseNumber} ${household.streetName}`;
}
