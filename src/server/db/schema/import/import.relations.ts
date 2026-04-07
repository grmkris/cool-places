import { relations } from "drizzle-orm"
import {
  extractionResult,
  importedItem,
  pinterestBoard,
  pinterestConnection,
} from "./import.db"
import { user } from "../auth/auth.db"
import { coolPlace } from "../place/place.db"

export const importedItemRelations = relations(
  importedItem,
  ({ one }) => ({
    user: one(user, {
      fields: [importedItem.userId],
      references: [user.id],
      relationName: "userImports",
    }),
    coolPlace: one(coolPlace, {
      fields: [importedItem.coolPlaceId],
      references: [coolPlace.id],
      relationName: "placeImports",
    }),
    extraction: one(extractionResult, {
      fields: [importedItem.id],
      references: [extractionResult.importedItemId],
      relationName: "importedItemExtraction",
    }),
  })
)

export const extractionResultRelations = relations(
  extractionResult,
  ({ one }) => ({
    importedItem: one(importedItem, {
      fields: [extractionResult.importedItemId],
      references: [importedItem.id],
      relationName: "importedItemExtraction",
    }),
  })
)

export const pinterestConnectionRelations = relations(
  pinterestConnection,
  ({ one }) => ({
    user: one(user, {
      fields: [pinterestConnection.userId],
      references: [user.id],
      relationName: "userPinterestConnection",
    }),
  })
)

export const pinterestBoardRelations = relations(
  pinterestBoard,
  ({ one }) => ({
    user: one(user, {
      fields: [pinterestBoard.userId],
      references: [user.id],
      relationName: "userPinterestBoards",
    }),
  })
)
