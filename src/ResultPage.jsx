import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "./services/supabase";

function ResultPage() {
    const { id } = useParams();
    const [generation, setGeneration] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const resultUrl = `${window.location.origin}/result/${id}`;

    useEffect(() => {
        const fetchGeneration = async () => {
            const { data, error } = await supabase
                .from("generations")
                .select("*")
                .eq("id", id)
                .single();

            if (error) {
                console.error(error);
            } else {
                setGeneration(data);
            }
            setLoading(false);
        };

        fetchGeneration();
    }, [id]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(resultUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Loading result...</p>
            </div>
        );
    }

    if (!generation) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Result not found.</p>
                    <Link to="/" className="text-blue-500 underline">Go back home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
                    <h1 className="text-3xl font-bold mb-1">Jadi Lebih Baik</h1>
                    <p className="text-gray-500 text-sm">
                        {generation.user_name && generation.user_name !== "Anonymous"
                            ? `Dibuat oleh ${generation.user_name}`
                            : "Dibuat oleh seseorang"}
                        {generation.user_location && generation.user_location !== "Unknown"
                            ? ` dari ${generation.user_location}`
                            : ""}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                        {new Date(generation.created_at).toLocaleDateString("id-ID", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>
                </div>

                {/* Before / After */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-2xl shadow-lg p-4">
                        <h2 className="font-semibold mb-3 text-gray-700">📷 Sebelum</h2>
                        <img
                            src={generation.original_url}
                            alt="Original"
                            className="rounded-xl w-full object-cover"
                        />
                    </div>
                    <div className="bg-white rounded-2xl shadow-lg p-4">
                        <h2 className="font-semibold mb-3 text-gray-700">✨ Sesudah (AI)</h2>
                        <img
                            src={generation.generated_url}
                            alt="Generated"
                            className="rounded-xl w-full object-cover"
                        />
                    </div>
                </div>

                {/* Share section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h2 className="font-semibold mb-4">Bagikan hasil ini</h2>
                    <div className="flex flex-col md:flex-row gap-6 items-center">

                        <div className="flex flex-col items-center gap-2">
                            <QRCodeSVG value={resultUrl} size={140} />
                            <p className="text-xs text-gray-400">Scan untuk membuka</p>
                        </div>

                        <div className="flex-1 w-full">
                            <p className="text-sm text-gray-500 mb-2">Atau salin link:</p>
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={resultUrl}
                                    className="flex-1 border border-gray-200 rounded-lg p-2 text-sm bg-gray-50"
                                />
                                <button
                                    onClick={handleCopyLink}
                                    className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:opacity-80 transition"
                                >
                                    {copied ? "Tersalin!" : "Salin"}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Back button */}
                <div className="text-center">
                    <Link
                        to="/"
                        className="inline-block bg-white text-black border border-gray-200 px-6 py-3 rounded-xl hover:bg-gray-50 transition font-medium"
                    >
                        ← Generate lagi
                    </Link>
                </div>

            </div>
        </div>
    );
}

export default ResultPage;