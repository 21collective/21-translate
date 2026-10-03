const fields = ['ocrLang', 'targetLang'];

chrome.storage.sync.get({ ocrLang: 'auto', targetLang: 'tr' }).then((s) => {
  for (const id of fields) document.getElementById(id).value = s[id];
});

for (const id of fields) {
  document.getElementById(id).addEventListener('change', async (e) => {
    await chrome.storage.sync.set({ [id]: e.target.value });
    document.getElementById('saved').textContent = 'Kaydedildi ✓';
  });
}
