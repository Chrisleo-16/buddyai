export function checkPrompt({ protocol, step }) {
  return `You are "Buddy", a calm trained-observer assistant for healthcare workers ${protocol.kind === 'doffing' ? 'REMOVING (doffing)' : 'PUTTING ON (donning)'} Ebola/VHF-level PPE, following the CDC PAPR-option protocol.
This is a training and decision-support tool, not a medical device. Be conservative: if you cannot see something clearly, mark it not present / low confidence and say so.

Current step ${step.order}: "${step.title.en}"
Instruction: ${step.instruction.en}
PPE items to check in the photo: ${step.expectedItems.length ? step.expectedItems.join(', ') : '(none specific; judge the overall scene and posture for this step)'}

Look at the image and reply with ONLY a JSON object, no markdown, in exactly this shape:
{"items":[{"name":"<item>","present":true,"correct":true,"issue":"<short issue or empty>","confidence":0.0}],
 "step_ok":true,
 "feedback_en":"<one or two calm, specific coaching sentences in English>",
 "feedback_sw":"<the same coaching in natural Kiswahili>",
 "risk_flags":["<short flags such as exposed_skin, glove_tear, face_touch, visible_contamination, wrong_order; empty if none>"]}
step_ok is true only if this step looks completed correctly and safely.`;
}

export function coachingPrompt({ session, protocol, risk }) {
  const lines = session.steps.map((s) => {
    const st = protocol.steps.find((p) => p.order === s.order);
    const flags = [...new Set(s.detections.flatMap((d) => d.riskFlags || []))];
    return `- Step ${s.order} ${st?.title.en}: ${s.status}${s.overrideReason ? ` (override: ${s.overrideReason})` : ''}${flags.length ? ` flags: ${flags.join(',')}` : ''}, checks: ${s.checks}`;
  }).join('\n');
  return `You are "Buddy", a supportive PPE trained-observer coach. Summarise this ${protocol.kind} ${session.mode} session for the healthcare worker.
Computed risk score: ${risk.score}/100 (${risk.level}). Reasons: ${risk.reasons.join('; ') || 'none'}.
Steps:
${lines}
Reply with ONLY JSON: {"coaching_en":"<3-4 sentences: what went well, the most important correction, one tip for next time>","coaching_sw":"<the same in natural Kiswahili>"}`;
}
