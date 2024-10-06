import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const offersTable = sqliteTable("offers", {
  id: integer("id").primaryKey(),
  roomId: text("room_id").notNull(),
  offer: text("offer").notNull(), // Store the offer as a JSON string or a text representation
  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export type InsertOffer = typeof offersTable.$inferInsert;
export type SelectOffer = typeof offersTable.$inferSelect;

export const answersTable = sqliteTable("answers", {
  id: integer("id").primaryKey(),
  roomId: text("room_id").notNull(),
  answer: text("answer").notNull(), // Store the answer as a JSON string or a text representation
  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export type InsertAnswer = typeof answersTable.$inferInsert;
export type SelectAnswer = typeof answersTable.$inferSelect;

export const iceCandidatesTable = sqliteTable("ice_candidates", {
  id: integer("id").primaryKey(),
  roomId: text("room_id").notNull(),
  candidate: text("candidate").notNull(), // Store the ICE candidate as a JSON string or a text representation
  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export type InsertIceCandidate = typeof iceCandidatesTable.$inferInsert;
export type SelectIceCandidate = typeof iceCandidatesTable.$inferSelect;
