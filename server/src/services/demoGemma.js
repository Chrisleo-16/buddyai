/**
 * Scripted but realistic responses for DEMO MODE (unreliable venue Wi-Fi / API outages).
 * Every response is tagged provider:'demo' and the UI labels it clearly. It never pretends to be Gemma.
 */
let n = 0;
const FAILS = {
  'outer gloves': ['Small tear near the left outer-glove cuff.', 'Machozi madogo karibu na kofi ya glavu ya nje ya kushoto.', 'glove_tear'],
  'gown or coverall': ['Possible splash on the lower gown front.', 'Huenda kuna mrashao sehemu ya chini ya gauni.', 'visible_contamination'],
};
export function demoCheck(step) {
  n += 1;
  const items = step.expectedItems || [];
  // First check of a critical step flags one issue (to show coaching), the next passes.
  const fail = step.critical && items.length > 0 && n % 2 === 1;
  const bad = fail ? items.find((i) => FAILS[i]) || items[0] : null;
  const [issueEn, issueSw, flag] = FAILS[bad] || [`${bad} not positioned correctly.`, `${bad} haijawekwa sawa.`, 'incorrect_position'];
  return {
    items: items.map((name) => ({ name, present: true, correct: name !== bad, issue: name === bad ? issueEn : '', confidence: name === bad ? 0.72 : 0.88 })),
    step_ok: !fail,
    feedback_en: fail ? `Pause. ${issueEn} Address it before continuing, and move slowly.` : `Good. "${step.title.en}" looks complete. Continue when ready.`,
    feedback_sw: fail ? `Simama kidogo. ${issueSw} Rekebisha kabla ya kuendelea, songa taratibu.` : `Vizuri. "${step.title.sw}" imekamilika. Endelea ukiwa tayari.`,
    risk_flags: fail ? [flag] : [],
  };
}
export function demoCoaching(risk) {
  return {
    coaching_en: `[Demo mode] Risk ${risk.score}/100 (${risk.level}). You kept a steady order through the critical steps. The key correction: inspect outer gloves closely before removal. Next time, pause and narrate each glove step to your observer.`,
    coaching_sw: `[Hali ya maonyesho] Hatari ${risk.score}/100 (${risk.level}). Ulifuata mpangilio vizuri katika hatua muhimu. Marekebisho makuu: kagua glavu za nje kwa makini kabla ya kuzivua. Wakati ujao, simama na ueleze kila hatua ya glavu kwa mwangalizi wako.`,
  };
}
