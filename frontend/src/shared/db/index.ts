// src/shared/db/index.ts
// Drizzle(PostgreSQL) 연결.
// Better Auth Drizzle adapter는 Drizzle db 인스턴스를 받아서 동작합니다.
// https://better-auth.com/docs/adapters/drizzle :contentReference[oaicite:12]{index=12}

import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import * as schema from "./schema"
import { env } from "@/shared/config/env"

const client = postgres(env.DATABASE_URL, {
  max: 10, // 커넥션 풀
})

export const db = drizzle(client, { schema })
export type DB = typeof db
