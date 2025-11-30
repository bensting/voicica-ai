import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/common/PageHero";

export const metadata: Metadata = {
  title: "About Us - Voicica AI",
  description:
    "Learn about Voicica AI - Your trusted platform for AI-powered voice generation and text-to-speech solutions.",
};

export default function AboutPage() {
  return (
    <div className="font-sans min-h-screen">
      <PageHero
        title="About Voicica AI"
        imageSrc="/images/about-hero.jpg"
        imageAlt="About Voicica AI"
      />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
        {/* Mission Section */}
        <section className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            Who we are and what is our mission?
          </h2>

          <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
            <p>
              We share the same values and philosophy and want to harness the
              power of AI to provide content creators with effective tools to
              redefine how people express themselves through audio.
            </p>

            <p>
              The mission of us providing online AI voice editing tools
              typically revolves around making voice editing accessible,
              efficient, and creative for users. We aim to empower content
              creators, like yourself, with user-friendly tools that leverage
              artificial intelligence to enhance the editing process, including
              text to speech, voice changer, voice cloning, vocal remover and
              more.
            </p>

            <p>
              Our goal is to streamline the workflow, save time, and enable
              users to produce high-quality audio without the need for extensive
              technical skills. Ultimately, it&apos;s about democratizing voice
              editing and offering practical solutions for creators like you to
              elevate the quality of your content.
            </p>
          </div>
        </section>

        {/* Values Section - Creativity + Efficiency + Imagination */}
        <section className="py-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {/* Creativity */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mb-2">
                <svg
                  viewBox="0 0 80 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                >
                  <defs>
                    <linearGradient
                      id="creativityGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#FCD34D" />
                      <stop offset="100%" stopColor="#F59E0B" />
                    </linearGradient>
                  </defs>
                  <rect
                    x="8"
                    y="8"
                    width="64"
                    height="64"
                    rx="16"
                    fill="url(#creativityGradient)"
                  />
                  <path
                    d="M40 24C35.58 24 32 27.58 32 32C32 34.4 33.04 36.56 34.72 38.04L34 46H46L45.28 38.04C46.96 36.56 48 34.4 48 32C48 27.58 44.42 24 40 24Z"
                    fill="white"
                  />
                  <rect x="36" y="48" width="8" height="4" rx="1" fill="white" />
                  <rect x="37" y="54" width="6" height="2" rx="1" fill="white" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Creativity
              </span>
            </div>

            {/* Plus Sign */}
            <span className="text-2xl sm:text-3xl font-light text-gray-400">
              +
            </span>

            {/* Efficiency */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mb-2">
                <svg
                  viewBox="0 0 80 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                >
                  <defs>
                    <linearGradient
                      id="efficiencyGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#F472B6" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                  <rect
                    x="8"
                    y="8"
                    width="64"
                    height="64"
                    rx="16"
                    fill="url(#efficiencyGradient)"
                  />
                  <path
                    d="M40 20L44 32H56L46 40L50 52L40 44L30 52L34 40L24 32H36L40 20Z"
                    fill="white"
                  />
                  <circle cx="40" cy="40" r="6" fill="#EC4899" />
                  <path
                    d="M40 34V40L44 42"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Efficiency
              </span>
            </div>

            {/* Plus Sign */}
            <span className="text-2xl sm:text-3xl font-light text-gray-400">
              +
            </span>

            {/* Imagination */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mb-2">
                <svg
                  viewBox="0 0 80 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                >
                  <defs>
                    <linearGradient
                      id="imaginationGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#60A5FA" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                  <rect
                    x="8"
                    y="8"
                    width="64"
                    height="64"
                    rx="16"
                    fill="url(#imaginationGradient)"
                  />
                  <ellipse cx="40" cy="44" rx="12" ry="8" fill="white" />
                  <circle cx="40" cy="32" r="8" fill="white" />
                  <path
                    d="M36 28L38 32L42 32L44 28"
                    stroke="#3B82F6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle cx="37" cy="31" r="1.5" fill="#3B82F6" />
                  <circle cx="43" cy="31" r="1.5" fill="#3B82F6" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Imagination
              </span>
            </div>

            {/* Equals Sign */}
            <span className="text-2xl sm:text-3xl font-light text-gray-400">
              =
            </span>

            {/* Voicica AI Logo */}
            <div className="flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32">
              <Image
                src="/logo/voice-labs-logo-light.svg"
                alt="Voicica AI"
                width={120}
                height={120}
                className="w-full h-full dark:hidden"
              />
              <Image
                src="/logo/voice-labs-logo-dark.svg"
                alt="Voicica AI"
                width={120}
                height={120}
                className="w-full h-full hidden dark:block"
              />
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-center">
            Get in Touch
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4 text-center">
            Have questions or feedback? We&apos;d love to hear from you.
          </p>
          <div className="flex justify-center">
            <a
              href="mailto:support@voicica.ai"
              className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
            >
              support@voicica.ai
            </a>
          </div>
        </section>

        {/* Back to Home */}
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