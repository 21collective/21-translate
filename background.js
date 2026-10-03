const DEFAULTS = { ocrLang: 'auto', targetLang: 'tr' };
// "Otomatik": Tesseract dili kendisi algılayamıyor; Latin alfabeli yaygın dilleri birlikte deniyoruz
const AUTO_OCR_LANGS = 'eng+tur+deu+fra+spa';

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
  } catch (e) {
    // chrome:// sayfaları, Web Store vb. yerlerde script çalıştırılamaz
    console.warn('Bu sayfada çalışamıyor:', e.message);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.target === 'offscreen') return false;

  if (msg.type === 'capture') {
    handleCapture(msg, sender.tab).then(sendResponse, (e) => sendResponse({ error: String(e.message || e) }));
    return true;
  }
  if (msg.type === 'translate') {
    getSettings()
      .then((s) => translate(msg.text, msg.targetLang || s.targetLang))
      .then(sendResponse, (e) => sendResponse({ error: String(e.message || e) }));
    return true;
  }
  return false;
});

async function handleCapture({ rect, viewportWidth }, tab) {
  const settings = await getSettings();
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  chrome.tabs.sendMessage(tab.id, { type: 'captured', dataUrl }).catch(() => {});

  await ensureOffscreen();
  const ocr = await chrome.runtime.sendMessage({
    target: 'offscreen',
    type: 'ocr',
    dataUrl,
    rect,
    viewportWidth,
    lang: settings.ocrLang === 'auto' ? AUTO_OCR_LANGS : settings.ocrLang,
  });
  if (ocr.error) throw new Error(ocr.error);

  return { text: joinLines(fixOcrDigits(ocr.text)) };
}

// Satırları birleştir ki görseldeki her satır ayrı cümle gibi çevrilmesin ("We are\n\nfriends" → "We are friends").
// Satır sonu sadece önceki satır cümle sonu işaretiyle bitiyorsa korunuyor; araya boş satır girmesi
// (OCR'da geniş satır aralığı) tek başına yeni paragraf sayılmıyor.
const SENTENCE_END = /[.!?…:;]["'”’»)\]]*$/u;
function joinLines(text) {
  const lines = text
    .replace(/\r/g, '')
    .replace(/(\p{L})-\n\s*(\p{Ll})/gu, '$1$2') // satır sonunda bölünmüş kelime: "exam-\nple"
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);

  let out = '';
  for (const line of lines) {
    if (!out) out = line;
    else out += (SENTENCE_END.test(out) ? '\n' : ' ') + line;
  }
  return out;
}

// OCR'ın harf yerine okuduğu rakamları düzelt: "5avage" → "Savage", "g0od" → "good".
// Sadece harflerle karışık kelimelere dokunur; "2024", "5G", "3D" gibi şeyler kalır.
// Kelime başında 5 ve 0 genelde büyük S/O'dur (şekilleri ona benziyor), kelime içinde küçük harf.
const DIGIT_AS_LETTER = { 0: 'o', 1: 'l', 5: 's' };
const DIGIT_AS_LETTER_START = { 0: 'O', 1: 'l', 5: 'S' };
function fixOcrDigits(text) {
  return text.replace(/(?<!\d)[\p{L}015]+(?!\d)/gu, (word) => {
    const letters = word.replace(/[015]/g, '').length;
    if (letters < 2 || letters === word.length) return word;
    return word.replace(/[015]/g, (d, i) => (i === 0 ? DIGIT_AS_LETTER_START : DIGIT_AS_LETTER)[d]);
  });
}

async function translate(rawText, targetLang) {
  const text = joinLines(rawText);
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&dt=t'
    + `&tl=${encodeURIComponent(targetLang)}&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Çeviri hatası (${res.status})`);
  const data = await res.json();
  return { translation: data[0].map((part) => part[0]).join(''), src: data[2] };
}

function getSettings() {
  return chrome.storage.sync.get(DEFAULTS);
}

let creating;
async function ensureOffscreen() {
  const existing = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  if (existing.length) return;
  creating ??= chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['WORKERS'],
    justification: 'Tesseract OCR bir Web Worker içinde çalışıyor',
  });
  await creating;
  creating = null;
}
