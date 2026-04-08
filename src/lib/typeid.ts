import { fromString, getType, TypeID, toUUID, typeid } from "typeid-js"
import { z } from "zod"

const typeIdLength = 26

export const idTypesMapNameToPrefix = {
  // App entities
  coolPlace: "cpl",
  placeVisit: "vst",
  // Auth entities (Better Auth)
  user: "usr",
  session: "ses",
  account: "acc",
  verification: "ver",
  walletAddress: "wal",
} as const

export type IdTypePrefixNames = keyof typeof idTypesMapNameToPrefix

export type TypeIdString<T extends IdTypePrefixNames> =
  `${(typeof idTypesMapNameToPrefix)[T]}_${string}`

export const typeIdValidator = <const T extends IdTypePrefixNames>(prefix: T) =>
  z
    .string()
    .startsWith(`${idTypesMapNameToPrefix[prefix]}_`)
    .length(typeIdLength + idTypesMapNameToPrefix[prefix].length + 1)
    .refine(
      (input) => {
        try {
          TypeID.fromString(input).asType(idTypesMapNameToPrefix[prefix])
          return true
        } catch {
          return false
        }
      },
      {
        message: `Invalid ${prefix} TypeID format`,
      }
    ) as z.ZodType<TypeIdString<T>, TypeIdString<T>>

export const typeIdGenerator = <const T extends IdTypePrefixNames>(prefix: T) =>
  typeid(idTypesMapNameToPrefix[prefix]).toString() as TypeIdString<T>

export const typeIdFromUuid = <const T extends IdTypePrefixNames>(
  prefix: T,
  uuid: string
) => {
  const actualPrefix = idTypesMapNameToPrefix[prefix]
  return TypeID.fromUUID(actualPrefix, uuid).toString() as TypeIdString<T>
}

export const typeIdToUuid = <const T extends IdTypePrefixNames>(
  input: TypeIdString<T>
) => {
  const id = fromString(input)
  return {
    uuid: toUUID(id).toString(),
    prefix: getType(id),
  }
}

// Exported validators and types — App entities
export const CoolPlaceId = typeIdValidator("coolPlace")
export type CoolPlaceId = z.infer<typeof CoolPlaceId>

export const PlaceVisitId = typeIdValidator("placeVisit")
export type PlaceVisitId = z.infer<typeof PlaceVisitId>

// Exported validators and types — Auth entities
export const UserId = typeIdValidator("user")
export type UserId = z.infer<typeof UserId>

export const SessionId = typeIdValidator("session")
export type SessionId = z.infer<typeof SessionId>

export const AccountId = typeIdValidator("account")
export type AccountId = z.infer<typeof AccountId>

export const VerificationId = typeIdValidator("verification")
export type VerificationId = z.infer<typeof VerificationId>

export const WalletAddressId = typeIdValidator("walletAddress")
export type WalletAddressId = z.infer<typeof WalletAddressId>
