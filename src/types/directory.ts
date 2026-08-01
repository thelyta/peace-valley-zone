import type {
  GateStreetResponseDtoOutput,
  ListGatesResponseDtoOutputItemsItem,
  ListStreetsResponseDtoOutputItemsItem,
  SecurityGateAssignmentResponseDtoOutput,
} from "@/api/generated/magodoEstateAPI.schemas";

export type TStreet = ListStreetsResponseDtoOutputItemsItem;
export type TGate = ListGatesResponseDtoOutputItemsItem;
export type TGateStreet = GateStreetResponseDtoOutput;
export type TSecurityGateAssignment = SecurityGateAssignmentResponseDtoOutput;
