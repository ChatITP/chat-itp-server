import { MilvusClient } from "@zilliz/milvus2-sdk-node";
import generateEmbedding from "../../llm/generateEmbedding";

if (!process.env.MILVUS_HOST) {
  throw new Error("MILVUS_HOST is not set");
}
if (!process.env.MILVUS_USERNAME) {
  throw new Error("MILVUS_USERNAME is not set");
}
if (!process.env.MILVUS_PASSWORD) {
  throw new Error("MILVUS_PASSWORD is not set");
}

const client = new MilvusClient({
  address: process.env.MILVUS_HOST,
  username: process.env.MILVUS_USERNAME,
  password: process.env.MILVUS_PASSWORD,
});

/**
 * Connect to the chatitp database in Milvus
 */
async function connect() {
  await client.useDatabase({ db_name: "chatitp" });
}
connect();

/**
 * Search for the most similar projects to the query vector.
 * @param queryVector - The query vector to search for
 * @param limit - The number of results to return
 * @returns - The search result
 */
async function searchProjects(queryVector: number[], limit: number = 1) {
  const res = await client.search({
    collection_name: "projects",
    data: [queryVector],
    limit: limit,
  });
  return res.results;
}

/**
 * Search for the most similar projects to the text.
 * @param text - The text to search for
 * @param limit - The number of results to return
 * @returns - The search result
 */
async function searchProjectsByText(text: string, limit: number = 5) {
  const embedding = await generateEmbedding(text);
  const result = await searchProjects(embedding, limit);
  return result;
}

export { searchProjects, searchProjectsByText };
