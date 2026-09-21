/**
 * Safely copies prompt text to clipboard and navigates to ChatGPT.
 * If the prompt text is longer than 1500 characters, it passes a short pre-filled URL query
 * so browsers/Cloudflare don't fail with ERR_CONNECTION_CLOSED due to excessive URL length.
 */
export const openChatGPTWithPrompt = async (fullPrompt, newWin = null) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(fullPrompt);
    }
  } catch (err) {
    console.warn("Could not copy prompt to clipboard:", err);
  }

  let chatGptUrl = '';
  if (fullPrompt.length <= 1500) {
    chatGptUrl = `https://chatgpt.com/?q=${encodeURIComponent(fullPrompt)}`;
  } else {
    const headerMsg = "Hare Krishna! The full sadhana report data is copied to my clipboard. Please analyze the performance data below:";
    chatGptUrl = `https://chatgpt.com/?q=${encodeURIComponent(headerMsg)}`;
  }

  if (newWin && !newWin.closed) {
    newWin.location.href = chatGptUrl;
  } else {
    window.open(chatGptUrl, '_blank');
  }
};
