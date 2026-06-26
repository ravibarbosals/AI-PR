require("dotenv").config();
const OpenAI = require("openai");
const { execSync } = require("child_process");
const fs = require("fs");

const MODEL = "llama-3.1-8b-instant";
// Limite conservador: ~60k chars ≈ 15k tokens, deixa margem para system prompt + resposta
const DIFF_MAX_CHARS = 60_000;

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

// Garante a ordem comentários -> resumo, independente do que o modelo decidiu.
function reordenarSaida(texto) {
  const startIdx = texto.indexOf("## Resumo do Review");
  if (startIdx === -1) return texto.trim(); // sem bloco de resumo identificável

  const recIdx = texto.indexOf("### Recomendação", startIdx);
  if (recIdx === -1) return texto.trim();

  let endIdx = texto.indexOf("\n\n", recIdx);
  if (endIdx === -1) endIdx = texto.length;

  const resumoBloco = texto.slice(startIdx, endIdx).trim();
  const resto = (texto.slice(0, startIdx) + texto.slice(endIdx)).trim();

  return resto.length > 0 ? `${resto}\n\n${resumoBloco}` : resumoBloco;
}

async function main() {
  const prNumber = process.env.PR_NUMBER;
  let diff = execSync(`gh pr diff ${prNumber}`, {
    encoding: "utf-8",
    maxBuffer: 1024 * 1024 * 20,
  });

  if (diff.length > DIFF_MAX_CHARS) {
    console.warn(`⚠️  Diff truncado: ${diff.length} → ${DIFF_MAX_CHARS} chars. Aumente DIFF_MAX_CHARS se necessário.`);
    diff = diff.slice(0, DIFF_MAX_CHARS) + "\n\n[... diff truncado por limite de tokens ...]";
  }

  const regras = lerRegras();

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    max_tokens: 2048,
    messages: [
      { role: "system", content: regras },
      {
        role: "user",
        content: `Revise o diff abaixo seguindo as regras do sistema.

IMPORTANTE:
- Responda APENAS com os comentários (se houver) e o resumo final, NESSA EXATA ORDEM: comentários primeiro, bloco "## Resumo do Review" por último.
- Cada comentário usa o template completo com cabeçalho [P_ - Categoria] e os rótulos **Problema:**, **Por que isso é um problema:**, **Correção sugerida:** em negrito — nunca texto solto.
- Não repita, não resuma e não cite o conteúdo das regras na sua resposta.

Diff do PR:

${diff}`,
      },
    ],
  });

  const choice = response.choices[0];
  if (choice.finish_reason === "length") {
    console.warn("⚠️  Resposta truncada por max_tokens. Aumente o limite no script.");
  }

  const review = reordenarSaida(choice.message.content);
  fs.writeFileSync("review.md", `## 🤖 Review automático (Llama 3.1 8B via Groq)\n\n${review}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});