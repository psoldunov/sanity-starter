import { defineLive } from "next-sanity/live";
import { readToken } from "../env";
import { client } from "./client";

if (!readToken) {
  throw new Error("Missing SANITY_API_READ_TOKEN");
}

export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: readToken,
  browserToken: readToken,
});
