import { Client } from "@gradio/client"

export const generateBetterImage = async (file) => {

    // Connect directly to Hugging Face from the browser
    // This bypasses Render's 30-second timeout entirely
    const client = await Client.connect("clara-aleph/lebih-baik-gpt")

    const result = await client.predict("/predict", {
        image: file
    })

    return result
}