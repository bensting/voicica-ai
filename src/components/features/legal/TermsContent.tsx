'use client';

/**
 * Terms and Conditions 内容组件
 * 可复用于页面和 BottomSheet
 */
export default function TermsContent() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-gray-700 p-4">
      <section>
        <p className="text-gray-500 mb-4">
          Last Updated: {new Date().toLocaleDateString('en-US')}
        </p>
        <p>
          Welcome to Voicica AI. By accessing or using our services, you agree to be bound by these Terms and Conditions.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h3>
        <p>
          By creating an account, accessing, or using Voicica AI services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions and our Privacy Policy.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-2">2. Service Description</h3>
        <p className="mb-2">Voicica AI provides AI-powered voice generation services including:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Text-to-speech conversion using AI technology</li>
          <li>Voice customization and selection</li>
          <li>Audio file generation and download</li>
          <li>Voice generation history and management</li>
        </ul>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-2">3. Account Security</h3>
        <p className="mb-2">You agree to:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Provide accurate information during registration</li>
          <li>Keep your password secure and confidential</li>
          <li>Notify us immediately of unauthorized use</li>
          <li>Be responsible for all activities under your account</li>
        </ul>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-2">4. Acceptable Use</h3>
        <p className="mb-2">You agree not to:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Violate any applicable laws</li>
          <li>Infringe upon intellectual property rights</li>
          <li>Create harmful, offensive, or illegal content</li>
          <li>Impersonate any person without authorization</li>
          <li>Generate voices for fraudulent purposes</li>
        </ul>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-2">5. Intellectual Property</h3>
        <p className="mb-2">
          <strong>Our Rights:</strong> All content and functionality of Voicica AI are owned by us and protected by intellectual property laws.
        </p>
        <p>
          <strong>Your Rights:</strong> You own the audio files generated using our services, subject to compliance with these Terms.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-2">6. Limitation of Liability</h3>
        <p>
          To the maximum extent permitted by law, Voicica AI shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-2">7. Contact Us</h3>
        <p>
          If you have any questions, please contact us at: <span className="text-purple-600">info@voicica.ai</span>
        </p>
      </section>

      <div className="pt-4 border-t border-gray-200">
        <p className="text-center text-gray-500 text-xs">
          © {new Date().getFullYear()} Voicica AI. All rights reserved.
        </p>
      </div>
    </div>
  );
}