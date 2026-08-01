import type {
  SessionResponseDtoOutput,
  SessionResponseDtoOutputHouseholdsItem,
  SessionResponseDtoOutputUser,
  SessionResponseDtoOutputZonesItem,
} from "@/api/generated/magodoEstateAPI.schemas";

export type Session = SessionResponseDtoOutput;
export type SessionUser = SessionResponseDtoOutputUser;
export type ZoneMembership = SessionResponseDtoOutputZonesItem;
export type HouseholdMembership = SessionResponseDtoOutputHouseholdsItem;
