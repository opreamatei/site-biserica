import "server-only";
import { createClient, SanityClient } from "@sanity/client";

const projectId = process.env.SANITY_PROJECT_ID || "2pm9yycs";
const dataset = process.env.SANITY_DATASET || "programari";
const apiVersion = process.env.SANITY_API_VERSION || "2025-01-01";
const token = process.env.SANITY_WRITE_TOKEN;
const readToken = process.env.SANITY_READ_TOKEN || token;

const baseConfig = {
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
};

export const readClient = createClient(
  readToken ? { ...baseConfig, token: readToken } : baseConfig,
);

const writeConfig =
  token != null && token.length > 0
    ? createClient({ ...baseConfig, token })
    : null;

export function getWriteClient(): SanityClient {
  if (!writeConfig) {
    throw new Error("Missing SANITY_WRITE_TOKEN env var for write access to Sanity.");
  }
  return writeConfig;
}
