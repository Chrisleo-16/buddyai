import { config } from '../config.js';

/** Optional Africa's Talking SMS to the supervisor. Disabled by default; stubbed unless AT_SMS_ENABLED=true. */
export async function alertSupervisor({ workerName, riskScore, kind }) {
  const s = config.sms;
  const message = `BuddyAI: high-risk ${kind} session for ${workerName} (risk ${riskScore}/100). Please review.`;
  if (!s.enabled || riskScore < s.riskThreshold) return { sent: false, stub: true, message };
  if (!s.username || !s.apiKey || !s.supervisorPhone) return { sent: false, error: 'sms_not_configured' };
  try {
    const r = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: { apiKey: s.apiKey, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: s.username, to: s.supervisorPhone, message }),
    });
    return { sent: r.ok, status: r.status };
  } catch (e) { return { sent: false, error: e.message }; }
}
