import { useState } from "react";
import { generateBetterImage } from "./services/huggingface";

function App() {

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [generatedImage, setGeneratedImage] = useState(null);

  const [loading, setLoading] = useState(false);

  const handleImageUpload = (event) => {

    const file = event.target.files[0];

    if (file) {
      setSelectedFile(file);
      setSelectedImage(URL.createObjectURL(file));
    }
  };

  const handleGenerate = async () => {

    if (!selectedFile) return;

    try {

      setLoading(true);

      const result = await generateBetterImage(selectedFile);

      console.log(result);

      if (result?.data?.[0]?.url) {

        setGeneratedImage(result.data[0].url);

      } else {

        console.log(result);

        alert("Image generation failed");
      }

    } catch (error) {

      console.error(error);

      alert("Gagal generate image");

    } finally {

      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center items-center">

      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-5xl">

        <h1 className="text-3xl font-bold text-center mb-2">
          Jadi Lebih Baik
        </h1>

        <p className="text-center text-gray-600 mb-6">
          Upload foto lingkungan dan lihat versi lebih baik dengan AI.
        </p>

        <div className="mb-6">

          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full border border-gray-300 rounded-lg p-3"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-xl font-medium hover:opacity-90 transition mb-6"
        >
          {loading ? "Generating..." : "Generate Better Version"}
        </button>

        <div className="grid md:grid-cols-2 gap-6">

          {selectedImage && (
            <div>
              <h2 className="font-semibold mb-3">
                Original
              </h2>

              <img
                src={selectedImage}
                alt="Original"
                className="rounded-xl w-full"
              />
            </div>
          )}

          {generatedImage && (
            <div>
              <h2 className="font-semibold mb-3">
                AI Result
              </h2>

              <img
                src={generatedImage}
                alt="Generated"
                className="rounded-xl w-full"
              />
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default App;