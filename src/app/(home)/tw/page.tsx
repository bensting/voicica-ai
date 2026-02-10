import { NewHero } from '@/components/sections/new-home';
import LanguageSwitcher from '@/components/sections/new-home/LanguageSwitcher';

export default function TwHome() {
  return (
    <div className="min-h-screen bg-gray-950">
      <NewHero locale="zh-Hant" />

      {/* SEO content — server-rendered for crawlers */}
      <section className="bg-gray-950 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-5xl space-y-12 text-gray-300">
          <h1 className="text-center text-3xl font-bold text-white md:text-4xl">
            免費AI語音生成器、音樂創作與圖片工具
          </h1>

          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="mb-2 text-xl font-semibold text-white">AI文字轉語音</h2>
              <p className="text-sm leading-relaxed text-gray-400">
                使用超過3,200種AI語音，支援190多種語言，將任何文字轉換為自然流暢的語音。我們的免費線上文字轉語音生成器，能在數秒內產出錄音室品質的旁白——完美適用於影片、Podcast及線上課程。
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-xl font-semibold text-white">AI音樂生成器</h2>
              <p className="text-sm leading-relaxed text-gray-400">
                用AI創作原創音樂。描述你想要的氛圍、曲風或風格，即可即時獲得免版稅的樂曲。非常適合內容創作者、影片製作人和遊戲開發者。
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-xl font-semibold text-white">AI圖片創作器</h2>
              <p className="text-sm leading-relaxed text-gray-400">
                透過文字提示生成令人驚豔的AI圖片。從概念藝術到社群媒體圖片，我們的AI圖片生成器能在數秒內將你的想法化為高品質視覺作品。
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-xl font-semibold text-white">免費影片下載器</h2>
              <p className="text-sm leading-relaxed text-gray-400">
                從TikTok、YouTube等平台下載影片。以高畫質保存你喜愛的內容——無浮水印、無需註冊。快速、免費、簡單易用。
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-xl font-semibold text-white">HD圖片高畫質化</h2>
              <p className="text-sm leading-relaxed text-gray-400">
                使用AI將圖片提升至HD畫質。一鍵修復模糊照片、提高解析度、銳化細節——完全免費使用。
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-xl font-semibold text-white">背景移除工具</h2>
              <p className="text-sm leading-relaxed text-gray-400">
                用AI即時移除圖片背景。為商品照片、人像和設計專案取得乾淨的透明去背——無需手動編輯。
              </p>
            </div>
          </div>
        </div>
      </section>

      <LanguageSwitcher current="zh-Hant" />
    </div>
  );
}
