import React from "react";
import Sticker from "./visuals/Sticker";

/**
 * A single message bubble in the transcript. Bot bubbles can optionally
 * carry a small sticker (per the "stickers enhance moments, not every
 * message" rule — most bot bubbles pass no `visual`, only meaningful ones
 * do). User bubbles are plain echoes of what was chosen/typed.
 */
export function ChatBubble({ role, text, visual, animation = "none", size = "sm" }) {
  const isUser = role === "user";
  const stickerSize = size === "lg" ? 56 : 34;

  if (isUser) {
    return (
      <div className="flex justify-end animate-sadhna-in">
        <div className="max-w-[80%] bg-saffron-500 text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm shadow-sm">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start items-end gap-2 animate-sadhna-in">
      {visual && <Sticker name={visual} size={stickerSize} animation={animation} />}
      <div className="max-w-[82%] bg-white border border-saffron-100 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-saffron-950 shadow-sm whitespace-pre-line">
        {text}
      </div>
    </div>
  );
}

export default ChatBubble;
