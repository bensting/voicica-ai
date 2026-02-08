import { NewHero } from '@/components/sections/new-home';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950">
      <NewHero />

      {/* SEO content — server-rendered for crawlers */}
      <section className="bg-gray-950 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-5xl space-y-12 text-gray-300">
          <h1 className="text-center text-3xl font-bold text-white md:text-4xl">
            Free AI Voice Generator, Music Creator &amp; Image Tools
          </h1>

          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="mb-2 text-xl font-semibold text-white">AI Text to Speech</h2>
              <p className="text-sm leading-relaxed text-gray-400">
                Convert any text to natural-sounding speech with over 3,200 AI voices in 190+ languages. Our free online text to speech generator produces studio-quality voiceovers in seconds — perfect for videos, podcasts, and e-learning.
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-xl font-semibold text-white">AI Music Generator</h2>
              <p className="text-sm leading-relaxed text-gray-400">
                Create original music tracks with AI. Describe the mood, genre, or style you want and get a royalty-free composition instantly. Ideal for content creators, filmmakers, and game developers.
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-xl font-semibold text-white">AI Image Creator</h2>
              <p className="text-sm leading-relaxed text-gray-400">
                Generate stunning AI images from text prompts. From concept art to social media graphics, our AI image generator turns your ideas into high-quality visuals in seconds.
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-xl font-semibold text-white">Free Video Downloader</h2>
              <p className="text-sm leading-relaxed text-gray-400">
                Download videos from TikTok, YouTube, and more. Save your favorite content in high quality — no watermark, no signup required. Fast, free, and easy to use.
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-xl font-semibold text-white">HD Image Upscaler</h2>
              <p className="text-sm leading-relaxed text-gray-400">
                Enhance and upscale images to HD quality using AI. Restore blurry photos, increase resolution, and sharpen details with a single click — completely free.
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-xl font-semibold text-white">Background Remover</h2>
              <p className="text-sm leading-relaxed text-gray-400">
                Remove image backgrounds instantly with AI. Get clean, transparent cutouts for product photos, portraits, and design projects — no manual editing needed.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
