// Lecture links: only real web links are opened or shown (never javascript: and the like)

export const safeLink = (link) => (/^https?:\/\/\S+$/i.test(String(link || '').trim()) ? String(link).trim() : '');

/** Opens a lecture link in a new tab when there is one */
export const openLink = (link) => { const l = safeLink(link); if (l) window.open(l, '_blank', 'noopener,noreferrer'); };

/** "https://www.example.com/a/" -> "example.com/a" */
export const shortenLink = (l) => l.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
