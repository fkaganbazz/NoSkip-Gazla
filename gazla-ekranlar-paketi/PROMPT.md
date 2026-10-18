# Claude Code istekleri

Paketi projenin köküne çıkar (design/png ve docs/ klasörleri gelir). Aşağıdaki istekleri **sırayla ve ayrı ayrı** ver. Bir istek bitmeden sonrakine geçme.

---

## İstek 0 — Durum tespiti (önce bunu ver)

```
docs/EKRANLAR.md ve docs/ILERLEME.md dosyalarını oku. design/png içindeki görselleri incele.
Projede şu an hangi ekran ve bileşenlerin olduğunu çıkar, her birini tasarım görseliyle karşılaştır
ve docs/ILERLEME.md tablosunu gerçek duruma göre doldur (⬜/🟨/✅ ve kısa not).
Kod yazma, sadece tabloyu güncelle ve bana eksiklerin özetini ver.
```

## İstek 1 — Ortak bileşenler

```
docs/EKRANLAR.md "0. Ortak bileşenler" bölümündeki her bileşeni src/components altında yaz
ya da mevcutsa tasarıma göre düzelt. Ölçüleri design/*.dc.html dosyalarındaki inline style'lardan al,
görünüşü design/png ile karşılaştır. İkonları dc.html'deki SVG path'lerinden birebir kopyala.
Diken için 9 ifade × 4 aşama × aksesuar kombinasyonlarını gösteren bir geliştirme ekranı ekle
(app/dev/diken.tsx). Bitince docs/ILERLEME.md'yi güncelle.
```

## İstek 2'den sonrası — her ekran için aynı kalıp

Aşağıdaki kalıbı her ekran için ekran numarasını değiştirerek ver. Önerilen sıra:
2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 1.1–1.6 → 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6 → 4.1 → 4.2 → 4.3 → 5.1 → 5.2 → 5.3 → 6.1 → 6.2 → 2.6 → 2.7 → 7

```
docs/EKRANLAR.md'deki {NUMARA} {EKRAN ADI} ekranını uygula.
1. Önce design/png/{Dosya}.png görselini ve design/{Dosya}.dc.html dosyasını oku.
2. Sadece src/components altındaki ortak bileşenleri ve src/theme token'larını kullan;
   yeni renk veya ölçü uydurma, eksik bileşen varsa önce onu ortak bileşen olarak ekle.
3. Veriyi src/data altındaki hook üzerinden al (yoksa mock döndüren hook'u tipleriyle oluştur).
   Yükleniyor, boş ve hata durumlarını da yaz.
4. Spesifikasyondaki bütün etkileşimleri ve yönlendirmeleri bağla.
5. Bitince ekranı simülatörde aç, ekran görüntüsü al, design/png ile yan yana karşılaştır.
   Fark varsa düzelt. Spesifikasyondaki "Kabul" maddelerini tek tek kontrol et.
6. docs/ILERLEME.md'yi güncelle ve bana hangi maddelerin tamam, hangilerinin eksik olduğunu yaz.
Başka ekrana dokunma.
```

## Son kontrol

```
docs/ILERLEME.md'de ✅ olmayan her satır için eksikleri listele.
Tüm route'ların açıldığını, her ekrandaki butonların doğru yere gittiğini kontrol et
ve kırık bağlantıları düzelt. Koyu modu tüm ekranlarda aç ve okunmayan metin kalmadığını doğrula.
```

---

## Neden bu şekilde

- Claude Code'un ilk denemede ekranları atlamasının en olası nedeni, 40 HTML dosyasını tek istekte okuyup hepsini birden yazmaya çalışması. Bağlam doluyor ve iş yarıda kesiliyor. Tek ekran + görsel + kabul listesi bu sorunu çözer.
- PNG görseller HTML'den çok daha kolay okunur. HTML sadece kesin ölçüler için kullanılır.
- İlerleme tablosu yeni oturumlarda da nerede kalındığını gösterir.
