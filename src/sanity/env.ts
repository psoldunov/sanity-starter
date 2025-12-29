const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "";
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "";
const readToken = process.env.NEXT_PUBLIC_SANITY_API_READ_TOKEN || "";
const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";

export { apiVersion, dataset, projectId, readToken, writeToken };
