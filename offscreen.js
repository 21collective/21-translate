let worker = null;
let workerLang = null;

async function getWorker(lang) {
  if (worker && workerLang === lang) return worker;
  if (worker) await worker.terminate();
  worker = await Tesseract.createWorker(lang, 1, {
    workerPath: chrome.runtime.getURL('vendor/worker.min.js'),
    corePath: chrome.runtime.getURL('vendor/core'),
    workerBlobURL: false,
    // Dil verisi (traineddata) ilk kullanımda CDN'den inip tarayıcıda cache'lenir
  });
  // DPI'yı baştan vermezsek Tesseract her okumada tahmin edip "Estimating resolution as …" uyarısı basıyor
  await worker.setParameters({ preserve_interword_spaces: '1', user_defined_dpi: '300' });
  workerLang = lang;
  return worker;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.target !== 'offscreen' || msg.type !== 'ocr') return false;
  runOcr(msg).then(
    (text) => sendResponse({ text }),
    (e) => sendResponse({ error: String(e?.message || e) }),
  );
  return true;
});

async function runOcr({ dataUrl, rect, viewportWidth, lang }) {
  const img = await loadImage(dataUrl);
  const canvas = preprocess(img, rect, viewportWidth);
  const w = await getWorker(lang);

  // Kırpılmış parçalarda "tek metin bloğu" modu (6) genelde en iyisi;
  // sonuç zayıfsa otomatik düzen modunu (3) da deneyip iyisini seçiyoruz
  const first = await recognize(w, canvas, '6');
  if (first.confidence >= 75) return first.text;
  const second = await recognize(w, canvas, '3');
  return (second.confidence > first.confidence ? second : first).text;
}

async function recognize(w, canvas, psm) {
  await w.setParameters({ tessedit_pageseg_mode: psm });
  const { data } = await w.recognize(canvas);
  return { text: data.text, confidence: data.confidence };
}

function preprocess(img, rect, viewportWidth) {
  // Ekran görüntüsünün gerçek piksel / CSS piksel oranı (zoom + Windows ölçeklendirme dahil)
  const ratio = img.naturalWidth / viewportWidth;
  const sx = Math.round(rect.x * ratio);
  const sy = Math.round(rect.y * ratio);
  const sw = Math.max(1, Math.round(rect.w * ratio));
  const sh = Math.max(1, Math.round(rect.h * ratio));

  // Ekran yazıları küçük (~12-16px); Tesseract ~30px+ harf yüksekliğinde çok daha iyi okuyor
  const scale = Math.max(1, Math.min(3, 4000 / sw, 4000 / sh));
  const W = Math.round(sw * scale);
  const H = Math.round(sh * scale);
  const PAD = 24; // kenara yapışık yazıları Tesseract kaçırabiliyor

  const canvas = document.createElement('canvas');
  canvas.width = W + PAD * 2;
  canvas.height = H + PAD * 2;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, PAD, PAD, W, H);

  const imgData = ctx.getImageData(PAD, PAD, W, H);
  const px = imgData.data;

  // Gri ton + histogram
  const gray = new Uint8ClampedArray(W * H);
  const hist = new Uint32Array(256);
  let sum = 0;
  for (let i = 0, j = 0; i < px.length; i += 4, j++) {
    const g = (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) / 1000;
    gray[j] = g;
    hist[gray[j]]++;
    sum += g;
  }

  // Koyu zemin üstünde açık yazı varsa ters çevir (Tesseract beyaz zemin + siyah yazı istiyor)
  const invert = sum / gray.length < 128;

  // Kontrastı aç: %1 ve %99 persentil arasını 0-255'e yay
  const lo = percentile(hist, gray.length, 0.01);
  const hi = percentile(hist, gray.length, 0.99);
  const range = Math.max(1, hi - lo);

  for (let i = 0, j = 0; i < px.length; i += 4, j++) {
    let v = ((gray[j] - lo) * 255) / range;
    if (invert) v = 255 - v;
    px[i] = px[i + 1] = px[i + 2] = v;
    px[i + 3] = 255;
  }

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.putImageData(imgData, PAD, PAD);
  return canvas;
}

function percentile(hist, total, p) {
  const target = total * p;
  let acc = 0;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc >= target) return v;
  }
  return 255;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
