/** Web: reklam yok, hiçbir şey çizilmez. AdBanner.tsx ile aynı imza. */
export type AdBannerProps = {
  nonPersonalized: boolean;
  onLoaded: () => void;
  onFailed: () => void;
};

export default function AdBanner(_props: AdBannerProps) {
  return null;
}
