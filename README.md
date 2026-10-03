# 21 Translate

Ekranda bir bölge seç, içindeki yazıyı oku (OCR) ve çevir. Görsellerdeki, videolardaki ya da seçilemeyen metinleri çevirmek için bir Chrome eklentisi.

## Chrome'a ekleme

Eklenti Chrome Web Mağazası'nda yok. Kaynak koddan şu şekilde yüklenir:

1. Repoyu indir:
   ```bash
   git clone https://github.com/21collective/21-translate.git
   ```
   ya da GitHub'da **Code → Download ZIP** ile indirip zip'i bir klasöre çıkar.
2. Chrome'da adres çubuğuna `chrome://extensions` yaz.
3. Sağ üstteki **Geliştirici modu** (Developer mode) anahtarını aç.
4. **Paketlenmemiş öğe yükle** (Load unpacked) düğmesine tıkla.
5. İndirdiğin `21-translate` klasörünü seç (içinde `manifest.json` olan klasör).
6. Eklenti listede görünür. Kolay erişim için araç çubuğundaki yapboz simgesinden **21 Translate**'i sabitleyebilirsin.

> Klasörü yükledikten sonra silme ya da taşıma; Chrome eklentiyi o klasörden çalıştırır.

### Güncelleme

```bash
git pull
```

Ardından `chrome://extensions` sayfasında 21 Translate kartındaki yenile (⟳) simgesine tıkla.

## Kullanım

1. Herhangi bir sayfada **Alt+T**'ye bas ya da araç çubuğundaki eklenti simgesine tıkla.
2. Çevirmek istediğin alanı fareyle seç.
3. Okunan metin ve çevirisi açılan pencerede görünür. Kapatmak için **Esc**.

Kısayolu `chrome://extensions/shortcuts` sayfasından değiştirebilirsin.

## Ayarlar

Eklenti simgesine sağ tıklayıp **Seçenekler**'e gir:

- **Görseldeki yazının dili (OCR):** Doğru dili seçmek okuma kalitesini çok artırır. Varsayılan: Otomatik (Latin alfabesi).
- **Çevrilecek dil:** Varsayılan: Türkçe.

## Notlar

- OCR tarayıcı içinde [Tesseract.js](https://github.com/naptha/tesseract.js) ile yapılır. Her OCR dilinin verisi ilk kullanımda bir kez indirilir, bu yüzden ilk okuma biraz uzun sürebilir.
- Çeviri için okunan metin Google Translate'e gönderilir.
- `chrome://` sayfalarında ve Chrome Web Mağazası'nda Chrome eklentilerin çalışmasına izin vermez.
