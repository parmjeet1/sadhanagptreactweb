import React from "react";
import NumberActivityInput from "./NumberActivityInput";
import DurationActivityInput from "./DurationActivityInput";
import TextActivityInput from "./TextActivityInput";

/**
 * Fallback renderer for "custom" or unrecognized activity.type values.
 * Infers the best behavior from whatever metadata IS present so a brand
 * new, never-seen-before activity still works without a code change:
 *  - has `unit` + numeric quickOptions/goal  -> behaves like a duration/number input
 *  - has `unit` only                          -> number input with that unit
 *  - otherwise                                 -> free text input
 */
export function GenericActivityInput({ activity, onSubmit }) {
  if (activity.unit && (activity.quickOptions?.length || activity.goal)) {
    return <DurationActivityInput activity={activity} onSubmit={onSubmit} />;
  }
  if (activity.unit) {
    return <NumberActivityInput activity={activity} onSubmit={onSubmit} />;
  }
  return <TextActivityInput activity={activity} onSubmit={onSubmit} />;
}

export default GenericActivityInput;
