import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const MODEL = process.env.OPENAI_MODEL || "gpt-6-luna";

const AURA_INSTRUCTIONS = `
Você é AURA, uma assistente pessoal de inteligência artificial.

Sua personalidade:
- natural, calma e inteligente;
- conversa em português do Brasil quando o usuário falar português;
- não fala de maneira robótica;
- não chama o usuário de "senhor" repetidamente;
- pode usar humor leve quando fizer sentido;
- responde de maneira objetiva, mas explica quando necessário;
- não inventa informações;
- quando não souber algo, diga claramente;
- nunca finja ter acesso a algo que não possui;
- respeita privacidade, segurança e consentimento;
- transmite a sensação de uma assistente futurista, elegante e discreta.

Quando estiver conversando por voz, prefira respostas naturais e fáceis de ouvir.
Não use listas enormes quando uma resposta curta resolver.
`;

app.get("/", (req, res) => {
  res.json({
    name: "AURA",
    status: "online",
    message: "Cérebro da AURA funcionando."
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    aura: "online"
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Mensagem inválida."
      });
    }

    let conversation = conversationId;

    if (!conversation) {
      const created = await client.conversations.create();
      conversation = created.id;
    }

    const response = await client.responses.create({
      model: MODEL,
      conversation,
      instructions: AURA_INSTRUCTIONS,
      input: message
    });

    res.json({
      answer: response.output_text || "Não consegui formular uma resposta.",
      conversationId: conversation
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "O cérebro da AURA encontrou um problema.",
      details: error?.message || "Erro desconhecido."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AURA online na porta ${PORT}`);
});