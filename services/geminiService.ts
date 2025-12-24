
import { GoogleGenAI, Modality } from "@google/genai";

// Initialize with named parameter and direct environment variable access
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateShiftReport = async (
  driverName: string, 
  environment: string, 
  score: number
): Promise<string> => {
  try {
    const prompt = `
      Character: ${driverName}, a rideshare driver.
      Location: ${environment}.
      Performance: Scored ${score} points (higher is better).
      
      Write a very short, funny, 1-sentence social media status update or "tweet" from this character complaining or bragging about their shift. 
      Use slang appropriate for the character.
      Max 20 words.
    `;

    // Direct text prompt usage
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Access text property directly
    return response.text || "Just another day on the road.";
  } catch (error) {
    console.error("Gemini generation error:", error);
    return "The app connection is spotty, but the cash is real.";
  }
};

export const generateSpeech = async (text: string, voiceName: string): Promise<string | null> => {
  try {
    // TTS requires Modality.AUDIO and specific contents structure
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
    
    // Extract audio bytes from candidates
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Speech generation failed:", error);
    return null;
  }
}
