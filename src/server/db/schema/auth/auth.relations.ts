import { relations } from "drizzle-orm"
import { user, session, account, walletAddress } from "./auth.db"
import { coolPlace, placeVisit } from "../place/place.db"
import {
  importedItem,
  pinterestBoard,
  pinterestConnection,
} from "../import/import.db"

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session, { relationName: "userSessions" }),
  accounts: many(account, { relationName: "userAccounts" }),
  wallets: many(walletAddress, { relationName: "userWallets" }),
  places: many(coolPlace, { relationName: "userPlaces" }),
  visits: many(placeVisit, { relationName: "userVisits" }),
  imports: many(importedItem, { relationName: "userImports" }),
  pinterestBoards: many(pinterestBoard, {
    relationName: "userPinterestBoards",
  }),
  pinterestConnection: one(pinterestConnection, {
    fields: [user.id],
    references: [pinterestConnection.userId],
    relationName: "userPinterestConnection",
  }),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
    relationName: "userSessions",
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
    relationName: "userAccounts",
  }),
}))

export const walletAddressRelations = relations(walletAddress, ({ one }) => ({
  user: one(user, {
    fields: [walletAddress.userId],
    references: [user.id],
    relationName: "userWallets",
  }),
}))
