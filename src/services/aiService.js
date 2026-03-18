/**
 * Service to interact with free AI APIs for analysis
 */

export const getAIAnalysis = async (studentsData) => {
  try {
    const prompt = `
      You are an expert spiritual life coach and counsellor. 
      Analyze the following spiritual daily activities for these students and provide a helpful, concise summary and guidance for the counsellor.
      
      Areas to look for:
      - Consistency in waking up early (Brahma Muhurta).
      - Depth of chanting (number of rounds).
      - Engagement in reading and morning prayers (Mangal Aarti).
      - Sleep discipline.

      Students Data:
      ${JSON.stringify(studentsData, null, 2)}

      Please provide:
      1. A general overview of the group's discipline.
      2. Specific highlights for individual students if needed.
      3. Actionable advice for the counsellor to help them improve.

      Keep the tone encouraging and professional. Max 250 words.
    `;

    const response = await fetch(`https://text.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=openai&seed=42`);
    console.log('response', response);
    if (!response.ok) {
      throw new Error('AI Service request failed');
    }

    const data = await response.text();
    return data;
  } catch (error) {
    console.error('Error in AI Analysis:', error);
    return "I'm sorry, I couldn't process the AI analysis at this moment. Please try again later.";
  }
};
