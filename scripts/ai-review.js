require("dotenv").config();
const OpenAI = require("openai");
const { execSync } = require("child_process");
const fs = require("fs");

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

function lerRegras() {
  const core = fs.readFileSync(".github/REVIEW.core.md", "utf-8");
  const domain = process.env.REVIEW_DOMAIN;
  let domainContent = "";
  if (domain) {
    const path = `.github/domains/${domain}.md`;
    if (fs.existsSync(path)) domainContent = fs.readFileSync(path, "utf-8");
  }
  return `${core}\n\n${domainContent}`;
}

async function main() {
  const prNumber = process.env.PR_NUMBER;
  const diff = execSync(`gh pr diff ${prNumber}`, {
    encoding: "utf-8",
    maxBuffer: 1024 * 1024 * 20,
  });

  const regras = lerRegras();

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    messages: [
      { role: "system", content: regras },
      { role: "user", content: `Revise o diff abaixo seguindo as regras acima.\n\nDiff do PR:\n\n${diff}` },
    ],
  });

  const review = response.choices[0].message.content;
  fs.writeFileSync("review.md", `## 🤖 Review automático (Llama 3.3 70B via Groq)\n\n${review}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});