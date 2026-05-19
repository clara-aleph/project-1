export const generateBetterImage = async (file) => {

    const formData = new FormData();

    formData.append("image", file);

    const response = await fetch(
        "http://localhost:3001/generate",
        {
            method: "POST",
            body: formData,
        }
    );

    if (!response.ok) {
        throw new Error("Failed to generate image");
    }

    return response.json();
};