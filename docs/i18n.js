// UI translations. English is the source of truth; Cantonese is a UI-layer
// skin. The assembled prompt itself always ships in English — nothing in this
// file ever reaches assemble.js or the grammar.
//
// Grammar files stay monolingual on purpose. Everything a visitor can read is
// addressed by a KEY, and `test/i18n-required-keys.json` is the closed list of
// those keys: a label with no key, or a key with no string, fails the suite.
//
// Keys derived from the grammar are built by the helpers at the bottom of this
// file, so a key is spelled the same way in the UI, in the manifest and in the
// tests:
//
//   mode.{modeId}.label                              mode name
//   mode.{modeId}.hint                               the line under the name
//   mode.{modeId}.lockedNote                         the locked-row paragraph
//   mode.{modeId}.control.{controlId}.label          chip group heading
//   mode.{modeId}.control.{controlId}.opt.{optionId} one chip
//   mode.{modeId}.control.{controlId}.why            why a locked group is locked
//   mode.{modeId}.ref.{refId}.label                  a reference checkbox
//   register.phoneToggle.{modeId}                    the phone-shot switch

export const LANG_KEY = 'promptDirector.lang';

export const STRINGS = {
  en: {
    'nav.agent': 'Use in your agent',
    'nav.chatgpt': 'ChatGPT version',
    'label.subject': 'Subject',
    'subject.placeholder': 'East Asian man, navy suit, studio headshot',
    'label.mode': 'Mode',
    'label.media': 'Make',
    'label.apiKey': 'OpenRouter key',
    'media.image': 'Image',
    'media.video': 'Video',
    'media.seedanceBadge': 'Seedance',
    'field.action.label': 'What happens',
    'field.action.placeholder': 'the bottle turns slowly, light sweeping across the label',
    'refs.label': 'Reference images',
    'refs.instruction': 'Attach these in your generator, named exactly: {files}',
    'register.label': 'Register',
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
    'hint.emptySubject': 'Type a subject to build the prompt.',
    'prompt.chars': '{n} characters',
    'copy.done': 'Copied.',
    'copy.manual': 'Press and hold the highlighted text to copy.',
    'locked.label': 'Locked by the grammar',
    'ratio.hint': "Set {ratio} in your generator's UI",
    'enhance.asking': 'Asking {model}...',
    'enhance.cancelled': 'Cancelled.',
    'enhance.keyCleared': 'Key cleared.',
    'enhance.needSubject': 'Type a subject first. Enhance rewrites the prompt you can already see.',
    'enhance.needKey': 'Paste your OpenRouter key first.',
    'enhance.err.badJson': 'The model did not answer in the JSON shape this page asked for. Your prompt is untouched.',
    'enhance.err.badKeys': 'The model answered with the wrong set of blocks. Your prompt is untouched.',
    'enhance.err.emptyValue': 'The model left one of the four blocks empty. Your prompt is untouched.',
    'enhance.err.offContract': 'The model wrote something this grammar does not allow. Your prompt is untouched.',
  },
  yue: {
    'nav.agent': '俾 agent 用',
    'nav.chatgpt': 'ChatGPT 版',
    'label.subject': '主題',
    'subject.placeholder': '亞洲男人，深藍色西裝，影樓頭像',
    'label.mode': '模式',
    'label.media': '整咩',
    'label.apiKey': 'OpenRouter key',
    'media.image': '圖',
    'media.video': '片',
    'media.seedanceBadge': 'Seedance',
    'field.action.label': '發生咩事',
    'field.action.placeholder': '樽慢慢轉，光掃過個樽身',
    'refs.label': '參考圖',
    'refs.instruction': '喺你個生成器度加返呢啲圖，名要一模一樣：{files}',
    'register.label': '風格',
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
    'hint.emptySubject': '打個主題先砌到 prompt。',
    'prompt.chars': '{n} 個字',
    'copy.done': '複製咗。',
    'copy.manual': '長按已反白嘅文字嚟複製。',
    'locked.label': '文法鎖定',
    'ratio.hint': '喺你個生成器入面設定 {ratio}',
    'enhance.asking': '問緊 {model}...',
    'enhance.cancelled': '取消咗。',
    'enhance.keyCleared': '清除咗個 key。',
    'enhance.needSubject': '打個主題先。加強係改寫你眼前嗰個 prompt。',
    'enhance.needKey': '貼你個 OpenRouter key 先。',
    'enhance.err.badJson': '個 model 冇照呢頁要求嘅 JSON 格式覆。你個 prompt 冇郁過。',
    'enhance.err.badKeys': '個 model 覆錯咗 block 嘅組合。你個 prompt 冇郁過。',
    'enhance.err.emptyValue': '四個 block 入面有一個係空嘅。你個 prompt 冇郁過。',
    'enhance.err.offContract': '個 model 寫咗呢套文法唔容許嘅嘢。你個 prompt 冇郁過。',
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
  'product-shot': '你件產品睇落高級又真實',
  'ad-916': '直度廣告圖，上面留白俾標題',
  'poster': '構圖行先嘅主視覺，留白做嘢',
  'video-product-ad': '你件產品郁起上嚟一樣高級',
  'video-ugc': '扮手機影嘅用家分享，對住鏡頭講嘢',
  'video-narrative': '一個劇情場口，角色喺度做緊嘢',
  'video-atmospheric': '淨係場景同氣氛，冇人，b-roll 空鏡',
};

export const LOCKED_NOTES_YUE = {
  'face-lock': '燈光同鏡頭由文法鎖死：參考圖唔帶任何燈光資訊。',
  'outfit-styling': '燈光同鏡頭由文法鎖死：參考圖唔帶任何燈光資訊。',
  'char-sheet': '排版、燈光同鏡頭由文法鎖死。三格結構就係重點。',
};

// v1 control groups and options, keyed by control id then option id. Video and
// ad modes address their chips per mode instead (MODE_CONTROLS_YUE), because
// the same control id means different things in different modes: Product Ad's
// "room" is studio room tone, UGC's "room" is a quiet flat.
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

const RUNTIME_YUE = {
  label: '長度',
  options: { '5s': '快鏡 5 秒', '8s': '標準 8 秒', '12s': '長鏡 12 秒' },
};

const AIR_YUE = {
  label: '空氣',
  options: { clear: '通透', light: '輕微煙霧', heavy: '厚重煙霧' },
};

// Per-mode chip strings for the ad and video modes.
export const MODE_CONTROLS_YUE = {
  'product-shot': {
    surface: { label: '檯面', options: { seamless: '影樓無縫', context: '真實檯面' } },
  },
  poster: {
    lighting: { label: '燈光', options: { side: '硬側光', silhouette: '門口剪影', pool: '頭頂光池' } },
  },
  'video-product-ad': {
    runtime: RUNTIME_YUE,
    lens: {
      label: '鏡頭',
      options: { 47: '平視 47° (50mm)', 29: '壓縮 29° (85mm)', 12: '微距 12° (200mm)' },
    },
    surface: { label: '檯面', options: { seamless: '影樓無縫', context: '真實檯面' } },
    atmosphere: AIR_YUE,
    sound: {
      label: '聲',
      options: { room: '影樓房間聲', handling: '攞產品嘅聲', retail: '舖頭環境聲' },
    },
    camera: {
      label: '運鏡',
      options: {
        tripod: '腳架慢推',
        orbit: '圍住轉圈',
        static: '完全定鏡',
        pedestal: '垂直升鏡',
      },
    },
  },
  'video-ugc': {
    runtime: RUNTIME_YUE,
    framing: { label: '點攞機', options: { selfie: '伸手自拍', propped: '部機放低' } },
    lens: {
      label: '鏡頭',
      options: { 63: '手機主鏡 63° (28mm)' },
      why: '手機風格鎖死鏡頭：手機主鏡頭係細細哋廣角嗰隻。',
    },
    sound: {
      label: '聲',
      options: { room: '靜靜哋嘅房', street: '街外聲入嚟', cafe: '咖啡店' },
    },
  },
  'video-narrative': {
    runtime: RUNTIME_YUE,
    lens: {
      label: '鏡頭',
      options: {
        84: '廣角 84° (24mm)',
        63: '紀實 63° (35mm)',
        47: '平視 47° (50mm)',
        29: '人像 29° (85mm)',
      },
    },
    atmosphere: AIR_YUE,
    sound: {
      label: '聲',
      options: { interior: '室內環境聲', street: '街道環境聲', weather: '天氣聲' },
    },
    camera: {
      label: '運鏡',
      options: {
        handheld: '手持呼吸感',
        follow: '背後跟拍',
        reverse: '倒退跟拍',
        side: '平行側跟',
        dollyin: '慢推埋去',
        arc: '弧形環繞',
      },
    },
  },
  'video-atmospheric': {
    runtime: RUNTIME_YUE,
    lens: {
      label: '鏡頭',
      options: { 107: '超廣 107° (16mm)', 84: '廣角 84° (24mm)', 29: '壓縮 29° (85mm)' },
    },
    energy: {
      label: '運鏡',
      options: {
        static: '定鏡',
        push: '極慢推鏡',
        drift: '慢慢橫移',
        crane: '吊臂升鏡',
        pullback: '航拍拉遠',
      },
    },
    timeofday: {
      label: '時間',
      options: { dawn: '天光前藍調', golden: '黃金時段', overcast: '陰天中午', night: '夜晚燈光' },
    },
    atmosphere: AIR_YUE,
    sound: {
      label: '聲',
      options: { wind: '風同遠處聲', rain: '雨打落表面', hum: '室內低鳴' },
    },
  },
};

export const REF_LABELS_YUE = {
  'outfit-styling': { person_ref: '我有角色嘅相' },
  'char-sheet': { person_ref: '我有角色嘅相' },
  'scene': { person_ref: '我有角色嘅相' },
  'detail': { person_ref: '我有角色嘅相' },
  'product-shot': { product_ref: '我有產品相' },
  'ad-916': { product_ref: '我有產品相' },
  'poster': { product_ref: '我有產品相' },
  'video-product-ad': { product_ref: '我有產品相' },
  'video-ugc': { person_ref: '我有講嘢嗰個人嘅相', product_ref: '我有產品相' },
  'video-narrative': { person_ref: '我有角色嘅相' },
};

export const REGISTER_TOGGLES_YUE = {
  'product-shot': '手機影嘅風格',
  'ad-916': '手機影嘅風格',
};

/* ---------- key builders: one spelling for the UI, the manifest and the tests ---------- */

export const key = {
  modeLabel: (modeId) => `mode.${modeId}.label`,
  modeHint: (modeId) => `mode.${modeId}.hint`,
  modeLocked: (modeId) => `mode.${modeId}.lockedNote`,
  controlLabel: (modeId, controlId) => `mode.${modeId}.control.${controlId}.label`,
  controlOption: (modeId, controlId, optionId) =>
    `mode.${modeId}.control.${controlId}.opt.${optionId}`,
  controlWhy: (modeId, controlId) => `mode.${modeId}.control.${controlId}.why`,
  refLabel: (modeId, refId) => `mode.${modeId}.ref.${refId}.label`,
  registerToggle: (modeId) => `register.phoneToggle.${modeId}`,
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

function fill(text, vars) {
  if (!vars) return text;
  let out = text;
  for (const [name, value] of Object.entries(vars)) out = out.replace(`{${name}}`, String(value));
  return out;
}

export function makeT(lang) {
  const table = STRINGS[lang] || STRINGS.en;
  return (name, vars) => fill(table[name] ?? STRINGS.en[name] ?? name, vars);
}

/* ---------- grammar-derived labels ---------- */

export function modeLabel(mode) {
  return mode.label;
}

export function modeHint(lang, mode) {
  if (lang === 'yue' && MODE_HINTS_YUE[mode.id]) return MODE_HINTS_YUE[mode.id];
  return mode.hint;
}

export function lockedNote(lang, mode) {
  if (lang === 'yue' && LOCKED_NOTES_YUE[mode.id]) return LOCKED_NOTES_YUE[mode.id];
  return mode.lockedNote;
}

function modeControl(modeId, controlId) {
  return (MODE_CONTROLS_YUE[modeId] || {})[controlId];
}

export function controlLabel(lang, modeId, controlId, group) {
  if (lang === 'yue') {
    const perMode = modeControl(modeId, controlId);
    if (perMode?.label) return perMode.label;
    if (CONTROLS_YUE[controlId]?.label) return CONTROLS_YUE[controlId].label;
  }
  return group.label;
}

export function optionLabel(lang, modeId, controlId, option) {
  if (lang === 'yue') {
    const perMode = modeControl(modeId, controlId);
    if (perMode?.options?.[option.id]) return perMode.options[option.id];
    if (CONTROLS_YUE[controlId]?.options[option.id]) return CONTROLS_YUE[controlId].options[option.id];
  }
  return option.label;
}

export function lockedWhy(lang, modeId, controlId, group) {
  if (lang === 'yue') {
    const perMode = modeControl(modeId, controlId);
    if (perMode?.why) return perMode.why;
  }
  return group.why;
}

export function refLabel(lang, modeId, ref) {
  if (lang === 'yue' && REF_LABELS_YUE[modeId]?.[ref.id]) return REF_LABELS_YUE[modeId][ref.id];
  return ref.label;
}

export function registerToggleLabel(lang, mode) {
  if (lang === 'yue' && REGISTER_TOGGLES_YUE[mode.id]) return REGISTER_TOGGLES_YUE[mode.id];
  return mode.registers.toggleLabel;
}

/**
 * Resolve any manifest key the way the page would render it.
 * The i18n suite walks the manifest through this, so the test and the UI can
 * never disagree about what a key means.
 */
export function resolveKey(lang, name, presets) {
  if (STRINGS.en[name] !== undefined) return makeT(lang)(name);

  const registerMatch = /^register\.phoneToggle\.(.+)$/.exec(name);
  if (registerMatch) {
    const mode = presets.modes.find((candidate) => candidate.id === registerMatch[1]);
    return mode && mode.registers ? registerToggleLabel(lang, mode) : null;
  }

  const modeMatch = /^mode\.([^.]+)\.(.+)$/.exec(name);
  if (!modeMatch) return null;
  const mode = presets.modes.find((candidate) => candidate.id === modeMatch[1]);
  if (!mode) return null;
  const rest = modeMatch[2];

  if (rest === 'label') return modeLabel(mode);
  if (rest === 'hint') return modeHint(lang, mode);
  if (rest === 'lockedNote') return lockedNote(lang, mode);

  const refMatch = /^ref\.([^.]+)\.label$/.exec(rest);
  if (refMatch) {
    const ref = (mode.refs || []).find((candidate) => candidate.id === refMatch[1]);
    return ref ? refLabel(lang, mode.id, ref) : null;
  }

  const controlMatch = /^control\.([^.]+)\.(.+)$/.exec(rest);
  if (!controlMatch) return null;
  const group = (mode.controls || {})[controlMatch[1]];
  if (!group) return null;
  const tail = controlMatch[2];

  if (tail === 'label') return controlLabel(lang, mode.id, controlMatch[1], group);
  if (tail === 'why') return lockedWhy(lang, mode.id, controlMatch[1], group);

  const optionMatch = /^opt\.(.+)$/.exec(tail);
  if (!optionMatch) return null;
  const option = group.options.find((candidate) => candidate.id === optionMatch[1]);
  return option ? optionLabel(lang, mode.id, controlMatch[1], option) : null;
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
