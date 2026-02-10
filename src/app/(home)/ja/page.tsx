import { NewHero } from '@/components/sections/new-home';
import LanguageSwitcher from '@/components/sections/new-home/LanguageSwitcher';

export default function JaHome() {
  return (
    <div className="min-h-screen bg-gray-950">
      <NewHero locale="ja" />

      {/* SEO content — server-rendered for crawlers */}
      <section className="bg-gray-950 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-5xl space-y-12 text-gray-300">
          <h1 className="text-center text-3xl font-bold text-white md:text-4xl">
            無料AI音声ジェネレーター、音楽クリエイター＆画像ツール
          </h1>

          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="mb-2 text-xl font-semibold text-white">AIテキスト読み上げ</h2>
              <p className="text-sm leading-relaxed text-gray-400">
                190以上の言語に対応した3,200以上のAI音声で、あらゆるテキストを自然な音声に変換します。無料のオンラインテキスト読み上げジェネレーターで、動画、ポッドキャスト、eラーニングに最適なスタジオ品質のナレーションを数秒で作成できます。
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-xl font-semibold text-white">AI音楽ジェネレーター</h2>
              <p className="text-sm leading-relaxed text-gray-400">
                AIでオリジナルの音楽トラックを作成。ムード、ジャンル、スタイルを指定するだけで、ロイヤリティフリーの楽曲を即座に生成します。コンテンツクリエイター、映像制作者、ゲーム開発者に最適です。
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-xl font-semibold text-white">AI画像クリエイター</h2>
              <p className="text-sm leading-relaxed text-gray-400">
                テキストプロンプトから美しいAI画像を生成。コンセプトアートからSNS用グラフィックまで、AIイメージジェネレーターがあなたのアイデアを数秒で高品質なビジュアルに変えます。
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-xl font-semibold text-white">無料動画ダウンローダー</h2>
              <p className="text-sm leading-relaxed text-gray-400">
                TikTok、YouTubeなどから動画をダウンロード。お気に入りのコンテンツを高画質で保存できます。ウォーターマークなし、登録不要。高速、無料、簡単に使えます。
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-xl font-semibold text-white">HD画像アップスケーラー</h2>
              <p className="text-sm leading-relaxed text-gray-400">
                AIを使って画像をHD画質に高画質化・拡大。ぼやけた写真の復元、解像度の向上、ディテールの鮮明化をワンクリックで実現。完全無料でご利用いただけます。
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-xl font-semibold text-white">背景削除ツール</h2>
              <p className="text-sm leading-relaxed text-gray-400">
                AIで画像の背景を瞬時に削除。商品写真、ポートレート、デザインプロジェクトに使える透過切り抜きを取得できます。手動編集は不要です。
              </p>
            </div>
          </div>
        </div>
      </section>

      <LanguageSwitcher current="ja" />
    </div>
  );
}
