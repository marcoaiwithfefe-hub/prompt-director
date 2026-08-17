// UI translations. English is the source of truth; Cantonese is a UI-layer
// skin. The assembled prompt itself always ships in English — nothing in this
// file ever reaches assemble.js or the grammar.
//
// Grammar files stay monolingual on purpose: mode labels, control labels and
// options are translated here by id, with a fallback to the preset's own
// English label, so a new grammar option never breaks the page.

export const LANG_KEY = 'promptDirector.lang';

export const STRINGS = {
  en: {
    'nav.grammar': 'Grammar',
    'nav.agent': 'Use in your agent',
    'nav.chatgpt': 'ChatGPT version',
    'label.subject': 'Subject',
    'subject.placeholder': 'East Asian man, navy suit, studio headshot',
    'label.mode': 'Mode',
    'out.head': 'Prompt · assembles as you pick',
    'out.copy': 'Copy prompt',
    'enhance.summary': 'AI enhance · your own OpenRouter key',
    'enhance.note1': 'Optional. Your key goes straight from this page to OpenRouter and nowhere else. Leave the box below unticked and the key is gone the moment you close the tab.',
    'enhance.remember': 'Remember this key on this device',
    'enhance.btn': 'Enhance',
    'enhance.cancel': 'Cancel',
    'enhance.clear': 'Clear key',
    'enhance.note2': 'Model is pinned to google/gemini-2.5-flash. One call, no retries, 30 second limit. The prompt above is never overwritten.',
    'enhanced.head': 'Enhanced · from your OpenRouter key',
    'enhanced.copy': 'Copy enhanced',
    'foot.built': 'Built by Marco',
    'foot.mit': 'MIT licensed, free to use and fork.',
    'foot.readme': 'Read the README',
    'prompt.empty': 'Type a subject on the left. The prompt builds itself as you pick.',
    'prompt.hint': 'Type a subject to build the prompt.',
    'prompt.chars': '{n} characters',
    'copy.done': 'Copied.',
    'copy.manual': 'Press and hold the highlighted text to copy.',
    'locked.label': 'Locked by the grammar',
    'ratio.chip': "Set {ratio} in your generator's UI",
    'enhance.asking': 'Asking {model}...',
    'enhance.cancelled': 'Cancelled.',
    'enhance.keyCleared': 'Key cleared.',
    'enhance.needSubject': 'Type a subject first. Enhance rewrites the prompt you can already see.',
    'enhance.needKey': 'Paste your OpenRouter key first.',
  },
  yue: {
    'nav.grammar': '文法',
    'nav.agent': '俾 agent 用',
    'nav.chatgpt': 'ChatGPT 版',
    'label.subject': '主題',
    'subject.placeholder': '亞洲男人，深藍色西裝，影樓頭像',
    'label.mode': '模式',
    'out.head': 'Prompt · 一路揀一路砌',
    'out.copy': '複製 prompt',
    'enhance.summary': 'AI 加強 · 用你自己嘅 OpenRouter key',
    'enhance.note1': '用唔用都得。你個 key 由呢頁直接送去 OpenRouter，唔會經其他地方。下面個格唔剔，閂咗個 tab 個 key 就冇咗。',
    'enhance.remember': '喺呢部機記住個 key',
    'enhance.btn': '加強',
    'enhance.cancel': '取消',
    'enhance.clear': '清除 key',
    'enhance.note2': '型號鎖定 google/gemini-2.5-flash。淨係 call 一次，唔重試，上限 30 秒。上面個 prompt 唔會郁。',
    'enhanced.head': '加強版 · 嚟自你嘅 OpenRouter key',
    'enhanced.copy': '複製加強版',
    'foot.built': 'Marco 整嘅',
    'foot.mit': 'MIT 授權，免費用，隨便 fork。',
    'foot.readme': '睇 README',
    'prompt.empty': '喺左邊打個主題，個 prompt 會自己砌出嚟。',
    'prompt.hint': '打個主題先砌到 prompt。',
    'prompt.chars': '{n} 個字',
    'copy.done': '複製咗。',
    'copy.manual': '長按已反白嘅文字嚟複製。',
    'locked.label': '文法鎖定',
    'ratio.chip': '喺你個生成器入面設定 {ratio}',
    'enhance.asking': '問緊 {model}...',
    'enhance.cancelled': '取消咗。',
    'enhance.keyCleared': '清除咗個 key。',
    'enhance.needSubject': '打個主題先。加強係改寫你眼前嗰個 prompt。',
    'enhance.needKey': '貼你個 OpenRouter key 先。',
  },
};

// Mode names stay in English in both locales — they are the tool's terms of
// art. Only the hint line under each name translates.
export const MODE_HINTS_YUE = {
  'face-lock': '新角色嘅標準面部參考',
  'outfit-styling': '角色全身造型，由頭到腳',
  'char-sheet': '一張圖，三個角度嘅角色參考',
  'scene': '電影感場景，有人冇人都得',
  'detail': '面部大特寫，皮膚質感最高',
};

export const LOCKED_NOTES_YUE = {
  'face-lock': '燈光同鏡頭由文法鎖死：參考圖唔帶任何燈光資訊。',
  'outfit-styling': '燈光同鏡頭由文法鎖死：參考圖唔帶任何燈光資訊。',
  'char-sheet': '排版、燈光同鏡頭由文法鎖死。三格結構就係重點。',
};

// Control groups and options, keyed by control id then option id.
export const CONTROLS_YUE = {
  baselineWardrobe: {
    label: '背心款',
    options: { camisole: '黑色吊帶背心', tank: '黑色羅紋背心' },
  },
  framing: {
    label: '構圖',
    options: {
      'full-body': '全身',
      'waist-up': '腰以上',
      'wide': '大遠景',
      'medium': '中景主角',
      'close': '近距特寫',
      'low-hero': '低角度仰拍',
      'ots': '過膊鏡',
      'chest-up': '胸以上',
      'shoulders-up': '膊頭以上',
      'face-only': '淨係面',
    },
  },
  headlessVariant: {
    label: '領口',
    options: { ghost: '隱形人效果', 'neck-cut': '頸位平切' },
  },
  lighting: {
    label: '燈光',
    options: {
      daylight: '自然日光',
      golden: '黃金時段',
      overcast: '陰天柔光',
      studio: '影樓雜誌風',
      'night-open': '夜晚（郊外）',
      'night-urban': '夜晚（市區）',
    },
  },
  backdrop: {
    label: '背景',
    options: { gray: '灰色無縫', moody: '柔和暗調' },
  },
};

export function detectLang() {
  try {
    const stored = window.localStorage.getItem(LANG_KEY);
    if (stored === 'en' || stored === 'yue') return stored;
  } catch {
    // storage unavailable: fall through to browser language
  }
  const nav = (navigator.language || '').toLowerCase();
  return nav.startsWith('zh') || nav.startsWith('yue') ? 'yue' : 'en';
}

export function storeLang(lang) {
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch {
    // private mode: the toggle still works for this visit
  }
}

export function makeT(lang) {
  const table = STRINGS[lang] || STRINGS.en;
  return (key, vars) => {
    let text = table[key] ?? STRINGS.en[key] ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        text = text.replace(`{${name}}`, String(value));
      }
    }
    return text;
  };
}

export function modeHint(lang, mode) {
  if (lang === 'yue' && MODE_HINTS_YUE[mode.id]) return MODE_HINTS_YUE[mode.id];
  return mode.hint;
}

export function lockedNote(lang, mode) {
  if (lang === 'yue' && LOCKED_NOTES_YUE[mode.id]) return LOCKED_NOTES_YUE[mode.id];
  return mode.lockedNote;
}

export function controlLabel(lang, controlId, group) {
  if (lang === 'yue' && CONTROLS_YUE[controlId]) return CONTROLS_YUE[controlId].label;
  return group.label;
}

export function optionLabel(lang, controlId, option) {
  const translated = lang === 'yue' && CONTROLS_YUE[controlId]?.options[option.id];
  return translated || option.label;
}

// Static page chrome: every element carrying data-i18n / data-i18n-placeholder
// gets its text swapped in place.
export function applyStatic(lang) {
  const t = makeT(lang);
  document.documentElement.lang = lang === 'yue' ? 'yue' : 'en';
  for (const node of document.querySelectorAll('[data-i18n]')) {
    node.textContent = t(node.dataset.i18n);
  }
  for (const node of document.querySelectorAll('[data-i18n-placeholder]')) {
    node.setAttribute('placeholder', t(node.dataset.i18nPlaceholder));
  }
}
