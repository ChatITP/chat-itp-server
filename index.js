const express = require("express");
const app = express();
const port = 3000;

const llmAPI = "http://localhost:11434/api/generate";

function generatePrompt(systemPrompt, userPrompt) {
  const prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>
  
${userPrompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>`;
  return prompt;
}

app.get("/", async (req, res) => {
  console.log(req.query);
  let systemPrompt = req.query.system;
  let userPrompt = req.query.user;

  const llmRes = await fetch(llmAPI, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3:instruct",
      prompt: generatePrompt(systemPrompt, userPrompt),
      stream: false,
    }),
  });
  const llmData = await llmRes.json();
  res.send(llmData.response);
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
