import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function generateEmbeddingVectors(text: string) {
  type embeddingArray = { embedding: number[] }[];

  const output = (await replicate.run(
    "replicate/all-mpnet-base-v2:b6b7585c9640cd7a9572c6e129c9549d79c9c31f0d3fdce7baac7c67ca38f305",
    { input: { text } }
  )) as embeddingArray;
  console.log(output[0].embedding);
  return output[0].embedding;
}
