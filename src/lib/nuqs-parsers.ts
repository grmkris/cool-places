import { createParser } from "nuqs"
import { CoolPlaceId, type CoolPlaceId as CoolPlaceIdType } from "@/lib/typeid"

export const parseAsCoolPlaceId = createParser<CoolPlaceIdType>({
  parse: (value) => {
    const result = CoolPlaceId.safeParse(value)
    return result.success ? result.data : null
  },
  serialize: (value) => value,
})
