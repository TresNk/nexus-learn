// src/services/aiService.js
// Using Google Gemini API

const GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY"; // Get from https://aistudio.google.com/app/apikey

export const getNexusResponse = async (userMessage, physicsData, chatHistory) => {
    const systemPrompt = `
You are Nexus, an expert Physics Tutor for the Nexus Learn platform.
You are currently monitoring a 3D physics simulation lab.

CURRENT LAB DATA:
${Object.entries(physicsData).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

INSTRUCTIONS:
1. Be concise but scientific.
2. If the student is confused, explain the formulas with their actual numbers.
3. If they ask to create/generate a new simulation, respond with a JSON object:
   {"title": "Simulation Name", "description": "What it shows", "difficulty": 1-3, "initialConfig": {"param1": value}, "features": ["feature1", "feature2"]}
4. Keep responses friendly and educational.
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: `System: ${systemPrompt}\n\nChat history:\n${chatHistory.map(m => `${m.role}: ${m.text}`).join('\n')}\n\nUser: ${userMessage}` }]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("Google API Error:", data.error);
            return "Nexus Brain is taking a moment. Please try again.";
        }

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("AI Error:", error);
        return "Connection to Nexus Brain lost. Please check your API configuration.";
    }
};

export const generateSimulationConfig = async (topic, context) => {
    const prompt = `
Generate a physics simulation configuration for "${topic}".

Return ONLY a valid JSON object with this exact structure:
{
  "title": "Clear simulation name",
  "description": "What students will learn (1-2 sentences)",
  "difficulty": 1,
  "initialConfig": {"param1": value, "param2": value},
  "features": ["feature1", "feature2", "feature3"]
}

Make it educational and appropriate for students.
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 500,
                }
            })
        });

        const data = await response.json();
        
        if (data.error) {
            return null;
        }

        const text = data.candidates[0].content.parts[0].text;
        
        // Try to parse JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        return null;
    } catch (error) {
        console.error("Generation Error:", error);
        return null;
    }
};