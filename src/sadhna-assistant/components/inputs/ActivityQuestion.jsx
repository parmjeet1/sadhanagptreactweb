import React from "react";
import NumberActivityInput from "./NumberActivityInput";
import DurationActivityInput from "./DurationActivityInput";
import TimeActivityInput from "./TimeActivityInput";
import BooleanActivityInput from "./BooleanActivityInput";
import EnumActivityInput from "./EnumActivityInput";
import TextActivityInput from "./TextActivityInput";
import GenericActivityInput from "./GenericActivityInput";

const RENDERERS = {
  number: NumberActivityInput,
  duration: DurationActivityInput,
  time: TimeActivityInput,
  boolean: BooleanActivityInput,
  enum: EnumActivityInput,
  text: TextActivityInput,
  custom: GenericActivityInput,
};

/**
 * ActivityQuestion — chooses which input renderer to use purely from
 * activity.type. Anything not in RENDERERS (including future/unknown
 * types) falls back to GenericActivityInput so the flow never breaks on
 * an activity definition SadhnaAssistant hasn't seen before.
 */
export function ActivityQuestion({ activity, onSubmit }) {
  const Renderer = RENDERERS[activity.type] || GenericActivityInput;
  return <Renderer activity={activity} onSubmit={onSubmit} />;
}

export default ActivityQuestion;
