import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = 3000;

const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const systemInstruction = `
Kamu adalah "Bakuin", asisten bahasa Indonesia yang bertugas menilai apakah kata atau frasa yang diberikan pengguna tergolong baku atau tidak baku menurut kaidah ejaan bahasa Indonesia dan bentuk baku yang lazim digunakan.

Aturan perilaku:
1. Selalu jawab dalam bahasa Indonesia.
2. Jangan menyebut bahwa kamu adalah AI, model, atau sistem.
3. Fokus utama adalah analisis ejaan baku/tidak baku, koreksi kata, dan saran penulisan yang tepat.
4. Jika pengguna memberi satu kata atau perbandingan kata, tentukan statusnya dengan tegas.
5. Jika bentuk baku bergantung konteks, jelaskan singkat bahwa perlu konteks.
6. Untuk nama dagang, singkatan khas, bahasa daerah, atau istilah yang bukan kosakata umum bahasa Indonesia, beri catatan kehati-hatian.
7. Hindari jawaban terlalu panjang; tetap padat, jelas, dan edukatif.

Format jawaban yang diutamakan:
Status: <Baku / Tidak baku / Perlu konteks>
Bentuk baku: <isi bentuk baku atau tulis "sudah baku">
Alasan: <penjelasan singkat berdasarkan kaidah ejaan atau pemakaian bentuk baku>
Contoh: <contoh kalimat singkat>

Jika pengguna mengirim kalimat penuh, identifikasi kata yang tidak baku lalu beri versi perbaikannya.
`;

const commonNonstandardWords = {
  praktek: "praktik",
  aktifitas: "aktivitas",
  ijin: "izin",
  resiko: "risiko",
  apotik: "apotek",
  analisa: "analisis",
  nasehat: "nasihat",
  sekedar: "sekadar",
  silahkan: "silakan",
  hembuskan: "embuskan",
  merubah: "mengubah",
  difoto: "dipotret",
  karir: "karier",
  fikiran: "pikiran",
  kwalitas: "kualitas",
  telpon: "telepon",
  tehnik: "teknik",
  obyek: "objek",
  subyek: "subjek",
  sistim: "sistem",
  antri: "antre",
  kaos: "kaus",
  bis: "bus",
  nopember: "november",
  jumat: "jumat",
};

// Mengambil pesan terakhir dari pengguna untuk dijadikan fokus analisis.
function getLatestUserMessage(conversation = []) {
  for (let i = conversation.length - 1; i >= 0; i -= 1) {
    if (conversation[i]?.role === "user" && typeof conversation[i]?.text === "string") {
      return conversation[i].text.trim();
    }
  }

  return "";
}

// Menyederhanakan input agar mudah dicek apakah berupa satu kata atau perbandingan dua kata.
function detectWordPattern(text = "") {
  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/[?!"'`,.:;()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return null;

  const comparisonMatch = normalized.match(/^([a-zA-Z-]+)\s*(atau|vs)\s*([a-zA-Z-]+)$/i);
  if (comparisonMatch) {
    return {
      mode: "comparison",
      tokens: [comparisonMatch[1].toLowerCase(), comparisonMatch[3].toLowerCase()],
    };
  }

  const words = normalized.split(" ").filter(Boolean);
  if (words.length === 1) {
    return { mode: "single", tokens: [words[0]] };
  }

  return null;
}

// Membuat arahan singkat untuk model agar jawaban tetap fokus pada kata yang ingin dicek.
function buildFocusInstruction(latestUserMessage) {
  const candidate = detectWordPattern(latestUserMessage);

  if (!candidate) {
    return "Fokus pada pesan terbaru pengguna. Jika ada kata yang tidak baku, tunjukkan perbaikannya dengan ringkas.";
  }

  if (candidate.mode === "single") {
    const [token] = candidate.tokens;
    const knownCorrection = commonNonstandardWords[token];

    if (knownCorrection) {
      return `Pesan terbaru berisi satu kata: "${token}". Kata ini sering dianggap tidak baku. Pastikan jawabanmu menilai kata tersebut dan menyebut "${knownCorrection}" sebagai bentuk baku yang disarankan, kecuali konteks pengguna jelas menunjukkan pengecualian.`;
    }

    return `Pesan terbaru berisi satu kata: "${token}". Nilai apakah kata itu baku, tidak baku, atau perlu konteks.`;
  }

  const [left, right] = candidate.tokens;
  const leftCorrection = commonNonstandardWords[left];
  const rightCorrection = commonNonstandardWords[right];

  return `Pesan terbaru meminta perbandingan dua kata: "${left}" dan "${right}". Bandingkan keduanya, tentukan mana yang baku, dan jika salah satunya tidak baku gunakan petunjuk ini bila relevan: "${left}" -> "${leftCorrection || left}", "${right}" -> "${rightCorrection || right}".`;
}

// Mengubah riwayat chat ke format yang dibutuhkan Gemini dan menambahkan fokus instruksi terakhir.
function buildContents(conversation = []) {
  const latestUserMessage = getLatestUserMessage(conversation);
  const contents = conversation
    .filter(
      (message) =>
        message &&
        typeof message.role === "string" &&
        typeof message.text === "string" &&
        message.text.trim()
    )
    .map(({ role, text }) => ({
      role: role === "model" ? "model" : "user",
      parts: [{ text: text.trim() }],
    }));

  if (latestUserMessage) {
    contents.push({
      role: "user",
      parts: [{ text: `Instruksi tambahan: ${buildFocusInstruction(latestUserMessage)}` }],
    });
  }

  return { latestUserMessage, contents };
}

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/chat", async (req, res) => {
  const { conversation } = req.body;

  try {
    if (!Array.isArray(conversation)) {
      return res.status(400).json({
        error: "Conversation must be an array of messages",
      });
    }

    const { latestUserMessage, contents } = buildContents(conversation);
    if (!latestUserMessage) {
      return res.status(400).json({
        error: "Pesan pengguna tidak boleh kosong",
      });
    }

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents,
      config: {
        temperature: 0.2,
        topK: 10,
        topP: 0.8,
        maxOutputTokens: 300,
        systemInstruction,
      },
    });

    res.json({ result: response.text });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
