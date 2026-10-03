import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const reservations = sqliteTable("reservations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  stage: text("stage").notNull(),
  question: text("question").notNull().default(""),
  status: text("status").notNull().default("pending_contact"),
  createdAt: integer("created_at").notNull(),
});
