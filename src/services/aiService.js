import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_KEY || "dummy-key";
const genAI = new GoogleGenerativeAI(API_KEY);

export const getNexusResponse = async (userInput, currentState, chatHistory) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const historyContext = chatHistory.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');

        const prompt = `
        You are NEXUS BRAIN, an expert physics and science tutor.
        Current Experiment Context: ${JSON.stringify(currentState)}
        Recent Chat: ${historyContext}

        User: ${userInput}

        Provide a concise, helpful explanation.

        SPECIAL CAPABILITY:
        If the user wants to change a parameter (e.g. "set gravity to 20", "make it faster", "double the mass"),
        you must include a JSON command block at the end of your response like this:
        COMMAND:{"update": {"parameterName": newValue}}

        Only use parameters present in the Current Experiment Context.
        If the user says "faster" or "slower", adjust the 'velocity' or 'speed' parameter by 50%.
        Keep the textual part high-school level and encouraging.
        `;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch {
        return "I'm having trouble connecting to my knowledge base, but let's keep exploring the simulation.";
    }
};

export const generateSimulationConfig = async (topic) => {
    const prompt = `
 Generate a physics simulation configuration for "${topic}".

 Return ONLY a JSON object with:
 {
   "title": "Short Title",
   "initialConfig": { "param1": value, "param2": value },
   "description": "Brief explanation",
   "difficulty": 1, 2, or 3
 }

 Stick to standard physics parameters (gravity, mass, velocity, angle, length, etc).
 `;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
        return null;
    }
};