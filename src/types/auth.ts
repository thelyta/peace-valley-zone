import type {
  AuthenticatedAuthResponseDtoOutput,
  DeviceVerificationRequiredAuthResponseDtoOutput,
  ListSessionsResponseDtoOutputItemsItem,
  LoginResponseDtoOutput,
} from "@/api/generated/magodoEstateAPI.schemas";

export type TLoginResponse = LoginResponseDtoOutput;
export type TAuthenticatedLoginResponse = AuthenticatedAuthResponseDtoOutput;
export type TDeviceVerificationRequiredResponse = DeviceVerificationRequiredAuthResponseDtoOutput;
export type TDeviceSession = ListSessionsResponseDtoOutputItemsItem;
