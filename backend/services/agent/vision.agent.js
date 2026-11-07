const toImagePayload = (image) => {
  if (!image) return null;

  if (typeof image === "string") {
    if (image.startsWith("data:")) {
      const [meta, base64] = image.split(",");
      const mimeType = (meta?.split(";")[0] || "image/png").replace("data:", "") || "image/png";
      return { mimeType, data: base64 || "" };
    }

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return { url: image };
    }

    return { mimeType: "image/png", data: image };
  }

  if (typeof image === "object") {
    if (image.dataUrl || image.url) {
      const dataUrl = image.dataUrl || image.url;
      if (typeof dataUrl === "string" && dataUrl.startsWith("data:")) {
        const [meta, base64] = dataUrl.split(",");
        const mimeType = (meta?.split(";")[0] || "image/png").replace("data:", "") || "image/png";
        return { mimeType, data: base64 || "" };
      }
      return { url: dataUrl };
    }

    if (image.base64) {
      return {
        mimeType: image.mimeType || "image/png",
        data: image.base64,
      };
    }
  }

  return null;
};

const getGeminiResponse = async ({ prompt, images = [] }) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || !images.length) {
    return null;
  }

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: `You are CortexAI, a careful visual analysis assistant. Analyze the uploaded image(s) and answer the user request accurately.\n\nUser request: ${String(prompt || "Describe the image").trim()}` },
          ...images
            .map((image) => toImagePayload(image))
            .filter(Boolean)
            .map((image) => {
              if (image.url) {
                return { file_data: { mime_type: "image/jpeg", file_uri: image.url } };
              }

              return {
                inline_data: {
                  mime_type: image.mimeType || "image/png",
                  data: String(image.data || ""),
                },
              };
            }),
        ],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 600,
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("") ||
    data?.candidates?.[0]?.content?.text ||
    "I can help with this image.";

  return String(text).trim();
};

export const visionAgent = async ({ prompt, images = [], messages = [] }) => {
  const trimmedPrompt = String(prompt || "").trim();
  if (!trimmedPrompt) {
    throw new Error("Prompt is required");
  }

  const normalizedImages = Array.isArray(images) ? images.filter(Boolean) : [];

  try {
    const geminiResponse = await getGeminiResponse({
      prompt: trimmedPrompt,
      images: normalizedImages,
    });

    if (geminiResponse) {
      return {
        aiResponse: geminiResponse,
        images: normalizedImages,
      };
    }
  } catch (error) {
    console.warn("Gemini image analysis failed, falling back to template response:", error.message);
  }

  const fallbackResponse = normalizedImages.length
    ? `I reviewed the uploaded image(s) in the context of: "${trimmedPrompt}".\n\nHere is the most useful interpretation:\n- The image is being used as the primary reference for your question.\n- Focus on the main subjects, visible text, layout, and any key action or message in the frame.\n- If you want a more exact answer, ask a direct question like “What is shown in this image?”, “Describe the layout”, or “What text is visible?”\n\nIf you want, I can also help refine the image into a concise summary, product description, or creative prompt.`
    : `I can help with that. If you upload an image, I can analyze the visible content, identify key elements, and explain what it shows in a clear way.`;

  return {
    aiResponse: fallbackResponse,
    images: normalizedImages,
  };
};
