// Invite link a counsellor shares with mentees so they join the counsellor's group.
export const buildInviteLink = (userId) => `https://sadhanagpt.com?ref=${btoa(String(userId))}`;

export const INVITE_SHARE_TEXT = 'Hare Krishna! Please join my group on SadhanaGPT using this link:';

/** Copies the link. Returns true when copied. */
export const copyInviteLink = async (link) => {
  try {
    await navigator.clipboard.writeText(link);
    return true;
  } catch {
    return false;
  }
};

/**
 * Opens the phone/browser share sheet (WhatsApp, Telegram, ...).
 * Returns 'shared' | 'cancelled' | 'unsupported' | 'failed'.
 */
export const shareInviteLink = async (link) => {
  if (!navigator.share) return 'unsupported';
  try {
    await navigator.share({ title: 'Join my group on SadhanaGPT', text: INVITE_SHARE_TEXT, url: link });
    return 'shared';
  } catch (err) {
    return err?.name === 'AbortError' ? 'cancelled' : 'failed';
  }
};
