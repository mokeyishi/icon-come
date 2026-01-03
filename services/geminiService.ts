
import { GoogleGenAI, Type } from "@google/genai";
import { BrandAnalysis } from "../types";

export const analyzeBrand = async (domain: string): Promise<BrandAnalysis | null> => {
  // Use the process.env.API_KEY directly as per the coding guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the visual brand identity of the website "${domain}". Even without seeing the live site, use your knowledge of this brand (or typical design patterns for this type of domain) to describe its favicon design. Return a JSON object representing its brand identity.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            colors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Dominant Hex color codes associated with the brand (e.g. ['#FFFFFF', '#000000'])",
            },
            style: {
              type: Type.STRING,
              description: "Design style (e.g., Minimalist, Flat, 3D, Corporate, Playful)",
            },
            brandIdentity: {
              type: Type.STRING,
              description: "A short paragraph describing what the brand represents visually.",
            },
            suggestedImprovements: {
              type: Type.STRING,
              description: "A suggestion for improving their icon design for high-resolution displays.",
            },
          },
          required: ["colors", "style", "brandIdentity", "suggestedImprovements"],
        },
      },
    });

    // Extract text output using the .text property (not a method)
    const text = response.text;
    if (text) {
      return JSON.parse(text) as BrandAnalysis;
    }
  } catch (error) {
    console.error("Gemini analysis error:", error);
  }
  return null;
};
