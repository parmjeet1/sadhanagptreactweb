import { postRequest } from './api';

// One reusable way for a counsellor to message students (in-app notification + WhatsApp).
// Used with one student (mentee page) and with many (Birds Eye View): POST /cusotm-notification with student_ids.
// Returns { ok, sent, whatsapp: { sent, failed, no_mobile, not_configured }, message }.
export const sendCounsellorNotification = async ({ userId, studentIds, text }) => {
  try {
    const res = await postRequest('/cusotm-notification', { user_id: userId, student_ids: studentIds, heading: '', description: text });
    const body = res?.data || {};
    const ok = body.status === 1 || body.success === true;
    return {
      ok,
      sent: body.data?.sent || 0,
      whatsapp: body.data?.whatsapp || { sent: 0, failed: 0, no_mobile: 0, not_configured: 0 },
      message: Array.isArray(body.message) ? body.message[0] : body.message,
    };
  } catch {
    return { ok: false, sent: 0, whatsapp: { sent: 0, failed: 0, no_mobile: 0, not_configured: 0 }, message: '' };
  }
};

/** Short WhatsApp line for the success message, e.g. "WhatsApp: 4 of 5". Empty when WhatsApp is not set up on the server. */
export const whatsappLine = (result, total) => {
  const wa = result?.whatsapp || {};
  if (!total || wa.not_configured === total) return '';
  if (total === 1) {
    if (wa.sent) return 'Also sent on WhatsApp.';
    if (wa.no_mobile) return 'No WhatsApp: no mobile number.';
    return 'WhatsApp could not be sent.';
  }
  return `WhatsApp: ${wa.sent || 0} of ${total}.`;
};
