// src/shared/db/schema.ts
// Better Auth core schema는 user/session/account/verification 이며,
// JWT plugin은 jwks 테이블을 추가합니다.
// (core schema 설명: Database 개념 문서)
// https://www.better-auth.com/docs/concepts/database :contentReference[oaicite:9]{index=9}
// (jwks table: JWT plugin schema 섹션)
// https://better-auth.com/docs/plugins/jwt :contentReference[oaicite:10]{index=10}

import {
  pgTable,
  text,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core"

// NOTE: Better Auth는 기본적으로 string id를 씁니다.
// 그래서 여기서는 text PK로 둡니다. (UUID로 바꾸려면 Better Auth database/id 옵션까지 같이 맞춰야 합니다.)
// https://www.better-auth.com/docs/concepts/database :contentReference[oaicite:11]{index=11}

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailUnique: uniqueIndex("user_email_unique").on(t.email),
}))

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  providerId: text("providerId").notNull(),
  accountId: text("accountId").notNull(),
  userId: text("userId").notNull(),

  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),

  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  providerAccountUnique: uniqueIndex("account_provider_account_unique").on(
    t.providerId,
    t.accountId
  ),
  userIdIdx: index("account_userId_idx").on(t.userId),
}))

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  token: text("token").notNull(),
  userId: text("userId").notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  tokenUnique: uniqueIndex("session_token_unique").on(t.token),
  userIdIdx: index("session_userId_idx").on(t.userId),
}))

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  identifierIdx: index("verification_identifier_idx").on(t.identifier),
}))

// JWT plugin: jwks table
export const jwks = pgTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("publicKey").notNull(),
  privateKey: text("privateKey").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }),
})
