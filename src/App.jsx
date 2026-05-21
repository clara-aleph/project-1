import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateBetterImage } from "./services/huggingface";
import { uploadImage, saveGeneration } from "./services/storage";

function App() {

  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [userName, setUserName] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

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

      // Step 1: Generate AI image + get Gemini analysis
      setStatus("Generating AI image...");
      const result = await generateBetterImage(selectedFile);

      if (!result?.data?.[0]?.url) {
        throw new Error("Image generation failed");
      }

      const generatedImageUrl = result.data[0].url;
      const analysis = result.analysis || null;

      // Step 2: Upload original image to Supabase Storage
      setStatus("Saving original image...");
      const timestamp = Date.now();
      const originalFileName = `originals/${timestamp}-original.jpg`;
      const originalUrl = await uploadImage(selectedFile, originalFileName);

      // Step 3: Fetch generated image and upload it
      setStatus("Saving generated image...");
      const generatedResponse = await fetch(generatedImageUrl);
      const generatedBlob = await generatedResponse.blob();
      const generatedFileName = `generated/${timestamp}-generated.jpg`;
      const savedGeneratedUrl = await uploadImage(generatedBlob, generatedFileName);

      // Step 4: Save everything to the database
      setStatus("Saving to database...");
      const generation = await saveGeneration(
        originalUrl,
        savedGeneratedUrl,
        userName.trim() || "Anonymous",
        userLocation.trim() || "Unknown",
        analysis
      );

      // Step 5: Redirect to result page
      navigate(`/result/${generation.id}`);

    } catch (error) {
      console.error(error);
      alert("Something went wrong: " + error.message);
    } finally {
      setLoading(false);
      setStatus("");
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

        {/* Name and Location inputs */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama kamu
            </label>
            <input
              type="text"
              placeholder="Contoh: Budi Santoso"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kota kamu
            </label>
            <input
              type="text"
              placeholder="Contoh: Jakarta"
              value={userLocation}
              onChange={(e) => setUserLocation(e.target.value)}
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
            />
          </div>
        </div>

        {/* File upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Foto lingkungan
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={loading}
            className="w-full border border-gray-300 rounded-lg p-3 disabled:opacity-50"
          />
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !selectedFile}
          className="w-full bg-black text-white py-3 rounded-xl font-medium hover:opacity-90 transition mb-2 disabled:opacity-50"
        >
          {loading ? status || "Processing..." : "Generate Better Version"}
        </button>

        <p className="text-center text-xs text-gray-400 mb-6">
          Nama dan kota bersifat opsional namun membantu kami memahami dampaknya.
        </p>

        {/* Preview */}
        {selectedImage && (
          <div>
            <h2 className="font-semibold mb-3">Original</h2>
            <img
              src={selectedImage}
              alt="Original"
              className="rounded-xl w-full"
            />
          </div>
        )}

      </div>
    </div>
  );
}

export default App;