import { GoogleGenAI } from "@google/genai";

// Initialize with named parameter and direct environment variable access
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCartoonAsset = async (prompt: string, aspectRatio: string = "1:1"): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `${prompt} Style: High quality vector art, flat cartoon style, vibrant colors, thick outlines, game asset, cel shaded, consistent aesthetic.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        }
      }
    });

    // Iterate through parts to find image data
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Asset generation failed:", error);
  }
  return null;
};

export const getDriverPrompt = (driverName: string, description: string) => {
  let extraVisual = "";
  if (driverName.includes("Randy")) {
    extraVisual = "He looks slightly grumpy but less angry than usual, and he is holding a disposable paper coffee cup.";
  } else if (driverName === "Samalie") {
    extraVisual = "She has a warm, friendly Hispanic look with kind eyes.";
  } else if (driverName === "Jason") {
    // Updated to specify mixed race as requested
    extraVisual = "He is a man of mixed race with a friendly, funny facial expression and a welcoming vibe.";
  }

  return `A close-up square avatar icon of ${driverName}, a rideshare driver. ${description}. ${extraVisual} Plain white background.`;
};

export const getPassengerPrompt = (visualDescription: string) => {
  return `A close-up square avatar icon of a passenger: ${visualDescription}. Plain white background.`;
};

export const getObstaclePrompt = (visualDescription: string) => {
  return `A close-up square avatar icon representing a problem: ${visualDescription}. Danger or warning aesthetic. Plain white background.`;
};

export const getEnvironmentPrompt = (envName: string) => {
  return `Full-screen mobile game background of ${envName}. Perspective: Street level looking forward from a car dashboard view. Style: Flat vector art, clean lines, vibrant saturated colors, simple geometric shapes, urban cartoon aesthetic. No people. 9:16 portrait aspect ratio.`;
};