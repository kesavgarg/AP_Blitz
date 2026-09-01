import "server-only";

/** Static reads so Next.js includes these in the server runtime. */
export const AUTH_SECRET = process.env.AUTH_SECRET ?? "";
export const DATABASE_URL = process.env.DATABASE_URL ?? "";
