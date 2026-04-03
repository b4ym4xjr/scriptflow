import { pgTable, text, varchar, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry", {
    withTimezone: true,
  }),
  passwordResetToken: text("password_reset_token"),
  passwordResetTokenExpiry: timestamp("password_reset_token_expiry", {
    withTimezone: true,
  }),
  lastActivityDate: timestamp("last_activity_date", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
