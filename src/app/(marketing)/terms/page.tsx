import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms and Conditions - Voicica AI",
  description: "Voicica AI Terms and Conditions",
};

export default function TermsAndConditions() {
  return (
    <div className="font-sans min-h-screen p-8 pb-20 sm:p-20">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
          Terms and Conditions
        </h1>

        <div className="space-y-6 text-sm sm:text-base leading-relaxed">
          <section>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Last Updated: {new Date().toLocaleDateString("en-US")}
            </p>
            <p>
              Welcome to Voicica AI. By accessing or using our services, you agree to be bound by these Terms and Conditions. Please read them carefully before using our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By creating an account, accessing, or using Voicica AI services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree to these terms, you may not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              2. Service Description
            </h2>
            <p className="mb-3">
              Voicica AI provides AI-powered voice generation services. Our services include but are not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Text-to-speech conversion using AI technology</li>
              <li>Voice customization and selection</li>
              <li>Audio file generation and download</li>
              <li>Voice generation history and management</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              3. Account Registration and Security
            </h2>
            <p className="mb-3">
              To use certain features of our services, you must register for an account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Be responsible for all activities that occur under your account</li>
              <li>Not share your account credentials with others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              4. Acceptable Use Policy
            </h2>
            <p className="mb-3">You agree not to use our services to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon intellectual property rights of others</li>
              <li>Create, distribute, or promote harmful, offensive, or illegal content</li>
              <li>Impersonate any person or entity without authorization</li>
              <li>Generate voices for fraudulent, deceptive, or malicious purposes</li>
              <li>Harass, abuse, or harm others</li>
              <li>Interfere with or disrupt the services or servers</li>
              <li>Attempt to gain unauthorized access to any part of our services</li>
              <li>Use automated systems to access the services without permission</li>
              <li>Resell or redistribute our services without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              5. Subscription and Payments
            </h2>
            <p className="mb-3">
              Our services offer various subscription plans with different features and usage limits:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Free Plan:</strong> Limited features with basic usage quota
              </li>
              <li>
                <strong>Paid Plans:</strong> Enhanced features and higher usage limits based on selected tier
              </li>
              <li>
                <strong>Billing:</strong> Subscription fees are billed in advance on a recurring basis (monthly or annually)
              </li>
              <li>
                <strong>Payment Methods:</strong> We accept major credit cards and other payment methods as indicated
              </li>
              <li>
                <strong>Auto-Renewal:</strong> Subscriptions automatically renew unless cancelled before the renewal date
              </li>
              <li>
                <strong>Price Changes:</strong> We reserve the right to change pricing with 30 days notice to existing subscribers
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              6. Cancellation and Refunds
            </h2>
            <p className="mb-3">
              You may cancel your subscription at any time through your account settings. Please refer to our{" "}
              <Link href="/refund" className="text-blue-600 dark:text-blue-400 hover:underline">
                Refund Policy
              </Link>
              {" "}for detailed information about refunds and cancellations.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              7. Intellectual Property Rights
            </h2>
            <p className="mb-3">
              <strong>Our Rights:</strong> All content, features, and functionality of Voicica AI, including but not limited to software, text, graphics, logos, and audio, are owned by Voicica AI or our licensors and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mb-3">
              <strong>Your Rights:</strong> You retain ownership of the content you input into our services. By using our services, you grant us a limited license to process your content solely for the purpose of providing our services.
            </p>
            <p>
              <strong>Generated Content:</strong> You own the audio files generated using our services, subject to your compliance with these Terms. You are responsible for ensuring that your use of generated content complies with all applicable laws and does not infringe on third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              8. Content and Data
            </h2>
            <p className="mb-3">
              You are solely responsible for any content you submit to or generate through our services. You represent and warrant that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You own or have the necessary rights to use and authorize us to use the content</li>
              <li>Your content does not violate any third-party rights</li>
              <li>Your content complies with these Terms and applicable laws</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              9. Service Availability and Modifications
            </h2>
            <p>
              We strive to provide reliable services but do not guarantee that our services will be uninterrupted, timely, secure, or error-free. We reserve the right to modify, suspend, or discontinue any part of our services at any time with or without notice. We are not liable for any modification, suspension, or discontinuance of the services.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              10. Limitation of Liability
            </h2>
            <p className="mb-3">
              To the maximum extent permitted by law, Voicica AI and its affiliates, officers, employees, agents, and licensors shall not be liable for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, or use</li>
              <li>Any damages resulting from your use or inability to use our services</li>
              <li>Any damages arising from unauthorized access to or alteration of your content</li>
              <li>Any damages related to third-party content or conduct on our services</li>
            </ul>
            <p className="mt-3">
              Our total liability shall not exceed the amount you paid to us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              11. Disclaimer of Warranties
            </h2>
            <p>
              Our services are provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the services will meet your requirements or that they will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              12. Indemnification
            </h2>
            <p>
              You agree to indemnify, defend, and hold harmless Voicica AI and its affiliates, officers, employees, agents, and licensors from any claims, liabilities, damages, losses, and expenses, including reasonable attorneys&apos; fees, arising out of or in any way connected with your access to or use of our services, your violation of these Terms, or your infringement of any rights of another party.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              13. Termination
            </h2>
            <p className="mb-3">
              We reserve the right to suspend or terminate your account and access to our services at any time, with or without notice, for any reason, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Violation of these Terms</li>
              <li>Fraudulent or illegal activity</li>
              <li>Abuse of our services or other users</li>
              <li>Non-payment of fees</li>
              <li>Request by law enforcement or government agencies</li>
            </ul>
            <p className="mt-3">
              Upon termination, your right to use the services will immediately cease, and we may delete your account and data without liability.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              14. Governing Law and Dispute Resolution
            </h2>
            <p className="mb-3">
              These Terms shall be governed by and construed in accordance with the laws of the State of Wyoming, United States, without regard to its conflict of law provisions.
            </p>
            <p>
              Any disputes arising out of or relating to these Terms or our services shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, except that either party may seek injunctive relief in court for violations of intellectual property rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              15. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. When we make material changes, we will notify you by posting the updated Terms on our website and updating the &quot;Last Updated&quot; date. Your continued use of our services after such changes constitutes your acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              16. Severability
            </h2>
            <p>
              If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              17. Entire Agreement
            </h2>
            <p>
              These Terms, together with our Privacy Policy and any other legal notices published by us on our services, constitute the entire agreement between you and Voicica AI concerning our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              18. Contact Us
            </h2>
            <p className="mb-3">
              If you have any questions, comments, or concerns regarding these Terms, please contact us:
            </p>
            <ul className="list-none space-y-2 ml-4">
              <li>Email: support@voicica.ai</li>
              <li>Address: 30 N Gould St, STE R, Sheridan, WY 82801, USA</li>
            </ul>
          </section>

          <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800">
            <p className="text-center text-gray-600 dark:text-gray-400">
              These Terms and Conditions were last updated on {new Date().toLocaleDateString("en-US")}
            </p>
          </div>
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