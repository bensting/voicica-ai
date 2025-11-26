import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us - Voicica AI",
  description: "Learn about Voicica AI - Your trusted platform for AI-powered voice generation and text-to-speech solutions.",
};

export default function AboutPage() {
  return (
    <div className="font-sans min-h-screen p-8 pb-20 sm:p-20">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
          About Voicica AI
        </h1>

        <div className="space-y-8 text-sm sm:text-base leading-relaxed">
          {/* Introduction */}
          <section>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
              Welcome to <strong>voicica.ai</strong> — your premier destination for cutting-edge AI voice generation technology.
            </p>
          </section>

          {/* Our Mission */}
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">
              Our Mission
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              At Voicica AI, we believe everyone deserves access to professional-quality voice synthesis. Our mission is to democratize AI voice technology, making it accessible, affordable, and easy to use for creators, businesses, and individuals worldwide.
            </p>
          </section>

          {/* What We Offer */}
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">
              What We Offer
            </h2>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6">
                <h3 className="font-semibold text-lg mb-2 text-purple-700 dark:text-purple-300">
                  Text-to-Speech (TTS)
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Transform any text into natural, human-like speech with our advanced TTS engine. Choose from hundreds of voices across multiple languages and accents.
                </p>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6">
                <h3 className="font-semibold text-lg mb-2 text-blue-700 dark:text-blue-300">
                  Voice Cloning
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Create custom voice models that capture unique vocal characteristics. Perfect for content creators, podcasters, and businesses seeking a consistent brand voice.
                </p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6">
                <h3 className="font-semibold text-lg mb-2 text-green-700 dark:text-green-300">
                  AI Voice Models
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Access our library of pre-trained AI voice models or train your own. Our models deliver exceptional quality with natural intonation and emotion.
                </p>
              </div>
            </div>
          </section>

          {/* Why Choose Us */}
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">
              Why Choose Voicica AI?
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-purple-600 font-bold">✓</span>
                <span><strong>High Quality:</strong> State-of-the-art AI models producing natural, expressive speech</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 font-bold">✓</span>
                <span><strong>Easy to Use:</strong> Intuitive interface designed for both beginners and professionals</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 font-bold">✓</span>
                <span><strong>Affordable:</strong> Flexible pricing plans to fit every budget and use case</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 font-bold">✓</span>
                <span><strong>Fast Processing:</strong> Generate high-quality audio in seconds, not minutes</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 font-bold">✓</span>
                <span><strong>Multi-Language:</strong> Support for multiple languages and regional accents</span>
              </li>
            </ul>
          </section>

          {/* Our Commitment */}
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">
              Our Commitment
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We are committed to responsible AI development. Our platform includes safeguards to prevent misuse and ensures that voice cloning technology is used ethically and with proper consent.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Your privacy and data security are our top priorities. We employ industry-standard encryption and security measures to protect your information and audio content.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">
              Get in Touch
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Have questions or feedback? We&apos;d love to hear from you.
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:support@voicica.ai"
                  className="text-purple-600 dark:text-purple-400 hover:underline"
                >
                  support@voicica.ai
                </a>
              </li>
              <li>
                <strong>Website:</strong>{" "}
                <a
                  href="https://voicica.ai"
                  className="text-purple-600 dark:text-purple-400 hover:underline"
                >
                  voicica.ai
                </a>
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-6"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
