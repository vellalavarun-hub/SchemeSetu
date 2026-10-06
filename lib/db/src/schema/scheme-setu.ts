import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  integer,
  index,
  jsonb,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";

export const savedSchemeStatus = pgEnum("saved_scheme_status", [
  "saved",
  "applied",
  "approved",
  "rejected",
]);

export type ApplicationPlan = {
  overview: string;
  steps: string[];
  documents_checklist: string[];
  tips: string[];
  warnings: string[];
};

export const usersTable = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const profilesTable = pgTable(
  "profiles",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    age: integer("age").notNull(),
    gender: text("gender").notNull(),
    state: text("state").notNull(),
    annualIncome: real("annual_income").notNull(),
    category: text("category").notNull(),
    occupation: text("occupation").notNull(),
    isStudent: boolean("is_student").notNull().default(false),
    isFarmer: boolean("is_farmer").notNull().default(false),
    hasDisability: boolean("has_disability").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("profiles_user_id_unique").on(table.userId)],
);

const emptyTextArray = sql`ARRAY[]::text[]`;

export const schemesTable = pgTable(
  "schemes",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    description: text("description").notNull(),
    benefits: text("benefits").notNull(),
    minAge: real("min_age"),
    maxAge: real("max_age"),
    maxIncome: real("max_income"),
    gender: text("gender"),
    states: text("states").array().notNull().default(emptyTextArray),
    categoriesAllowed: text("categories_allowed")
      .array()
      .notNull()
      .default(emptyTextArray),
    occupations: text("occupations").array().notNull().default(emptyTextArray),
    isStudent: boolean("is_student"),
    isFarmer: boolean("is_farmer"),
    hasDisability: boolean("has_disability"),
    documentsRequired: jsonb("documents_required")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    applyUrl: text("apply_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("schemes_name_unique").on(table.name),
    index("schemes_category_idx").on(table.category),
  ],
);

export const savedSchemesTable = pgTable(
  "saved_schemes",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    schemeId: integer("scheme_id")
      .notNull()
      .references(() => schemesTable.id, { onDelete: "cascade" }),
    status: savedSchemeStatus("status").notNull().default("saved"),
    notes: text("notes"),
    aiPlan: jsonb("ai_plan").$type<ApplicationPlan>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("saved_schemes_user_scheme_unique").on(table.userId, table.schemeId),
    index("saved_schemes_user_idx").on(table.userId),
  ],
);

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertProfileSchema = createInsertSchema(profilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertSchemeSchema = createInsertSchema(schemesTable).omit({
  id: true,
  updatedAt: true,
});
export const insertSavedSchemeSchema = createInsertSchema(savedSchemesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type User = typeof usersTable.$inferSelect;
export type Profile = typeof profilesTable.$inferSelect;
export type Scheme = typeof schemesTable.$inferSelect;
export type SavedScheme = typeof savedSchemesTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type InsertScheme = z.infer<typeof insertSchemeSchema>;
export type InsertSavedScheme = z.infer<typeof insertSavedSchemeSchema>;
