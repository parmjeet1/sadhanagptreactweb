/**
 * Service to interact with free AI APIs for analysis
 */

export const getAIAnalysis = async (studentsData) => {
  try {
    const prompt = `
      You are an expert spiritual life coach and counsellor. 
      Analyze the following spiritual daily activities for these students and provide a structured, high-impact analysis for the counsellor.
      
      CRITICAL: Use the following MARKDOWN structure for your response:
      ### 🌐 Group Overview
      (Summary of collective discipline)
      
      ### 📊 Performance Summary Table
      | Student | Wakeup | Chanting | Reading | Hearing | Sleep |
      | :--- | :--- | :--- | :--- | :--- | :--- |
      (Insert data for each student)
      
      ### 👤 Individual Highlights
      - **[Student Name]:** (Specific insight based on their data)
      
      ### 💡 Actionable Advice
      - (Bullet point 1)
      - (Bullet point 2)

      Students Data:
      ${JSON.stringify(studentsData, null, 2)}

      Keep it clean, professional, and spiritual. Max 250 words.
    `;

    const AI_URL = import.meta.env.VITE_AI_API_URL || 'https://text.pollinations.ai';
    const response = await fetch(`${AI_URL}/prompt/${encodeURIComponent(prompt)}?model=openai&seed=42`);
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
