/** Deterministic fake Gemma responses so the whole app runs without any AI. */
export function mockCheck(step, image) {
  // Deterministic: a frame passes unless its byte length is divisible by 7 (lets tests force a fail).
  const fail = image ? image.buffer.length % 7 === 0 : false;
  const items = (step.expectedItems || []).map((name, i) => ({
    name, present: true, correct: !(fail && i === 0), issue: fail && i === 0 ? `${name} not positioned correctly` : '', confidence: 0.9,
  }));
  return {
    items,
    step_ok: !fail,
    feedback_en: fail
      ? `Pause. Your ${items[0]?.name || 'PPE'} needs adjusting before we continue. Move slowly.`
      : `Good. "${step.title.en}" looks complete. Take a breath, then continue when ready.`,
    feedback_sw: fail
      ? `Simama kidogo. ${items[0]?.name || 'PPE'} yako inahitaji kurekebishwa kabla ya kuendelea. Songa taratibu.`
      : `Vizuri. "${step.title.sw}" imekamilika. Vuta pumzi, kisha endelea ukiwa tayari.`,
    risk_flags: fail ? ['incorrect_position'] : [],
  };
}

export function mockCoaching(risk) {
  return {
    coaching_en: `Session risk ${risk.score}/100 (${risk.level}). ${risk.reasons[0] ? `Main point: ${risk.reasons[0]}.` : 'All steps were completed in order.'} Keep your movements slow during doffing and never touch your face. Practise the glove steps once more before your next shift.`,
    coaching_sw: `Hatari ya kipindi ${risk.score}/100 (${risk.level}). ${risk.reasons[0] ? `Jambo kuu: ${risk.reasons[0]}.` : 'Hatua zote zilikamilishwa kwa mpangilio.'} Songa taratibu unapovua PPE na usiguse uso wako kamwe. Fanya mazoezi ya hatua za glavu tena kabla ya zamu yako ijayo.`,
  };
}
