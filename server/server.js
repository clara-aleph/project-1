import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { Client, handle_file } from "@gradio/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

app.use(cors({
    origin: [
        "https://project-1-gold-chi.vercel.app",
        "http://localhost:5173"
    ]
}));

const upload = multer({ dest: "uploads/" });

// Set up Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Helper: convert a local file to base64 for Gemini ──────────
function fileToBase64(filePath) {
    const buffer = fs.readFileSync(filePath);
    return buffer.toString("base64");
}

// ── Helper: fetch a remote image URL and convert to base64 ─────
async function urlToBase64(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString("base64");
}

// ── Main generate route ────────────────────────────────────────
app.post("/generate", upload.single("image"), async (req, res) => {

    try {
        console.log("Connecting to Hugging Face Space...");

        const client = await Client.connect("clara-aleph/lebih-baik-gpt");

        console.log("Sending image to AI...");

        const result = await client.predict("/predict", {
            image: await handle_file(req.file.path)
        });

        console.log("Image generated. Now analyzing with Gemini...");

        // Get the generated image URL from Hugging Face
        const generatedImageUrl = result?.data?.[0]?.url;

        if (!generatedImageUrl) {
            throw new Error("No image URL returned from Hugging Face");
        }

        // Convert both images to base64 for Gemini
        const originalBase64 = fileToBase64(req.file.path);
        const generatedBase64 = await urlToBase64(generatedImageUrl);

        // Ask Gemini to analyze both images
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Kamu adalah seorang urban planner dan desainer lingkungan yang berpengalaman.

Kamu diberikan dua foto:
- Foto pertama: kondisi lingkungan SEBELUM perbaikan
- Foto kedua: kondisi lingkungan SESUDAH perbaikan (hasil AI)

Bandingkan kedua foto dan identifikasi perbaikan yang dilakukan.

Berikan respons HANYA dalam format JSON berikut, tanpa teks lain di luar JSON:

{
  "fixes": [
    {
      "issue": "masalah yang terlihat di foto sebelum",
      "fix": "perbaikan yang terlihat di foto sesudah",
      "needs_purchase": true,
      "purchase_keyword": "kata kunci untuk mencari di toko online (bahasa indonesia, 2-4 kata)"
    }
  ],
  "summary": "Ringkasan singkat 1-2 kalimat tentang keseluruhan perbaikan"
}

Aturan penting untuk needs_purchase:
- needs_purchase = true HANYA jika perbaikan membutuhkan pembelian material fisik yang bisa dibeli di toko, contoh: cat, bahan bangunan, tanaman, lampu, paving block
- needs_purchase = false untuk pekerjaan jasa atau tenaga manusia, contoh: membersihkan sampah, merapikan kabel, mengecat ulang (jika catnya sudah ada), memangkas tanaman, menyapu
- Jangan beri link Tokopedia untuk pekerjaan kebersihan, pemangkasan, atau perapian yang hanya butuh tenaga
- purchase_keyword hanya diisi jika needs_purchase = true, jika tidak isi dengan null

Aturan lain:
- Tulis dalam Bahasa Indonesia
- Maksimal 6 perbaikan
- Fokus pada perbaikan yang benar-benar terlihat berbeda antara dua foto`;

        const geminiResult = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: originalBase64
                }
            },
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: generatedBase64
                }
            }
        ]);

        const geminiText = geminiResult.response.text();
        console.log("Gemini response:", geminiText);

        // Parse the JSON from Gemini
        let analysis;
        try {
            // Remove any markdown code fences if present
            const cleaned = geminiText.replace(/```json|```/g, "").trim();
            analysis = JSON.parse(cleaned);
        } catch (parseError) {
            console.error("Failed to parse Gemini JSON:", parseError);
            // Fallback if Gemini returns unexpected format
            analysis = {
                fixes: [],
                summary: "Analisis tidak tersedia saat ini."
            };
        }

        // Clean up temp file
        fs.unlinkSync(req.file.path);

        // Return everything to the frontend
        res.json({
            ...result,
            analysis
        });

    } catch (error) {
        console.error("FULL ERROR:");
        console.error(error.message);
        console.error(error.stack);

        // Clean up temp file if it exists
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            error: "Generation failed",
            detail: error.message
        });
    }
});

app.listen(3001, () => {
    console.log("Server running on http://localhost:3001");
});