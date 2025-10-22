import Hero from '@/components/sections/Hero';
import Pricing from '@/components/sections/Pricing';
import FAQ from '@/components/sections/FAQ';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero
        title="Welcome to"
        highlight="AI Voice Labs"
        description="Create stunning AI-powered voices with cutting-edge technology. Transform your content with natural-sounding voice generation."
        primaryButtonText="Get Started"
        secondaryButtonText="Learn More"
      />

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <Pricing />
      </section>

      {/* FAQ Section */}
      <FAQ />

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-purple-800">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of creators using AI Voice Labs today.
          </p>
          <button className="px-8 py-3 bg-white text-purple-600 rounded-full font-medium hover:bg-gray-100 transition-colors shadow-lg">
            Start Free Trial
          </button>
        </div>
      </section>
    </div>
  );
}