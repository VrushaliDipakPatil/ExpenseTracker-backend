const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function suggestCategory(description) {
  const interaction = await ai.interactions.create({
    model: "gemini-3.5-flash-lite",
    input: `Suggest the most suitable expense category for this description: "${description}".

    You can suggest any relevant category.
    Return only the category name. Do not explain.`,
  });

  return interaction.output_text.trim();
}

module.exports = { suggestCategory };