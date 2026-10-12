import React from 'react';
import { safeLink, shortenLink } from '../links';

/** A small clickable link line under a lecture (nothing when the lecture has no link) */
const LinkLine = ({ link, className = '' }) => {
  const l = safeLink(link);
  if (!l) return null;
  return (
    <a
      href={l} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
      className={`block text-[11px] font-semibold text-blue-500 underline truncate ${className}`}
    >🔗 {shortenLink(l)}</a>
  );
};

export default LinkLine;
