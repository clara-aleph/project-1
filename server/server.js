import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { Client, handle_file } from "@gradio/client";

const app = express();

app.use(cors({
    origin: [
        "https://project-1-gold-chi.vercel.app",
        "http://localhost:5173"
    ]
}));

const upload = multer({ dest: "uploads/" });

app.post("/generate", upload.single("image"), async (req, res) => {

    try {

        console.log("Connecting to Space...");

        const client = await Client.connect(
            "clara-aleph/lebih-baik-gpt"
        );

        console.log("Sending image file...");

        const result = await client.predict(
            "/predict",
            {
                image: await handle_file(req.file.path)
            }
        );

        console.log(JSON.stringify(result, null, 2));

        fs.unlinkSync(req.file.path);

        res.json(result);

    } catch (error) {

        console.error("FULL ERROR:");
        console.error(error);

        res.status(500).json({
            error: "Generation failed",
        });
    }
});

app.listen(3001, () => {
    console.log("Server running on http://localhost:3001");
});