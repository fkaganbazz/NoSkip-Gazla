# Claude Code'a vereceğin ilk istekler (sırayla)

1. CLAUDE.md'yi ve design/ klasörünü oku. Expo + TypeScript + Expo Router ile projeyi kur (development build). src/theme altında renkler, yazı ölçeği, boşluk ve köşe değerlerini Tokens.dc.html'e göre oluştur. Baloo 2 ve Nunito fontlarını ekle.

2. design/Diken.dc.html'i react-native-svg ile src/components/Diken.tsx olarak çevir. Aynı prop'lar (mood, stage, gear, size). Tüm ifadeleri gösteren bir geliştirme ekranı ekle.

3. design/TabBar.dc.html'i Expo Router sekme düzeni olarak uygula (açık/koyu).

4. design/Today.dc.html'i app/(tabs)/index.tsx olarak mock veriyle uygula. Görev işaretleme, su damlaları ve Diken'in ifade değişimi çalışsın.

5. Supabase şemasını CLAUDE.md'deki veri modeline göre supabase/migrations altında yaz; RLS ve seri hesaplayan SQL fonksiyonu dahil.

Sonra kalan ekranlara tek tek geç: Onboarding → Detail → NumberEntry/PhotoProof → Friends/Poke → StreakLost + reklam → Settings/DeleteAccount.
