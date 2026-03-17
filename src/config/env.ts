import { z } from "zod"

export interface EnvConfig {
  baseUrl: string
  projectId: number
  email: string
  password: string
  locale: string
  branchId: number
  clientVersion: string
  clientMode: string
  loginUseLdap: boolean
}

const envSchema = z.object({
  APIFOX_BASE_URL: z.url().default("https://example.apifox.com"),
  APIFOX_PROJECT_ID: z.string().min(1, "APIFOX_PROJECT_ID is required"),
  APIFOX_EMAIL: z.email("APIFOX_EMAIL is required"),
  APIFOX_PASSWORD: z.string().min(1, "APIFOX_PASSWORD is required"),
  APIFOX_LOCALE: z.string().default("zh-CN"),
  APIFOX_BRANCH_ID: z.string().default("0"),
  APIFOX_CLIENT_VERSION: z.string().default("2.7.2"),
  APIFOX_CLIENT_MODE: z.string().default("web"),
  APIFOX_LOGIN_USE_LDAP: z.enum(["true", "false"]).default("false"),
})

const trimTrailingSlash = (value: string): string => value.replace(/\/$/, "")

export const parseEnvConfig = (env: NodeJS.ProcessEnv): EnvConfig => {
  const parsed = envSchema.parse(env)
  const projectId = Number.parseInt(parsed.APIFOX_PROJECT_ID, 10)
  const branchId = Number.parseInt(parsed.APIFOX_BRANCH_ID, 10)

  if (Number.isNaN(projectId) || projectId <= 0) {
    throw new Error("APIFOX_PROJECT_ID must be a positive integer")
  }

  if (Number.isNaN(branchId) || branchId < 0) {
    throw new Error("APIFOX_BRANCH_ID must be a non-negative integer")
  }

  return {
    baseUrl: trimTrailingSlash(parsed.APIFOX_BASE_URL),
    projectId,
    email: parsed.APIFOX_EMAIL,
    password: parsed.APIFOX_PASSWORD,
    locale: parsed.APIFOX_LOCALE,
    branchId,
    clientVersion: parsed.APIFOX_CLIENT_VERSION,
    clientMode: parsed.APIFOX_CLIENT_MODE,
    loginUseLdap: parsed.APIFOX_LOGIN_USE_LDAP === "true",
  }
}
