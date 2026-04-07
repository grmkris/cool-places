import { relations } from "drizzle-orm"
import { coolPlace, placeVisit } from "./place.db"
import { user } from "../auth/auth.db"

export const coolPlaceRelations = relations(coolPlace, ({ one, many }) => ({
  user: one(user, {
    fields: [coolPlace.userId],
    references: [user.id],
    relationName: "userPlaces",
  }),
  visits: many(placeVisit, { relationName: "placeVisits" }),
}))

export const placeVisitRelations = relations(placeVisit, ({ one }) => ({
  place: one(coolPlace, {
    fields: [placeVisit.placeId],
    references: [coolPlace.id],
    relationName: "placeVisits",
  }),
  user: one(user, {
    fields: [placeVisit.userId],
    references: [user.id],
    relationName: "userVisits",
  }),
}))
