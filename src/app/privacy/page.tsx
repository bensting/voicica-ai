import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - AI Voices Labs",
  description: "AI Voices Labs Privacy Policy",
};

export default function PrivacyPolicy() {
  return (
    <div className="font-sans min-h-screen p-8 pb-20 sm:p-20">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
          Privacy Policy
        </h1>

        <div className="space-y-6 text-sm sm:text-base leading-relaxed">
          <section>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Last Updated: {new Date().toLocaleDateString("en-US")}
            </p>
            <p>
              Welcome to AI Voices Labs. We take your privacy seriously. This Privacy Policy explains how we collect, use, store, and protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              1. Information We Collect
            </h2>
            <p className="mb-3">We may collect the following types of information:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Account Information:</strong> When you register for an account, we collect basic information such as your username and email address.
              </li>
              <li>
                <strong>Usage Data:</strong> We collect information about how you use our services, including access times and feature usage.
              </li>
              <li>
                <strong>Device Information:</strong> Technical information including device model, operating system, browser type, and IP address.
              </li>
              <li>
                <strong>Audio Data:</strong> Audio files you upload or generate when using voice-related features.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              2. How We Use Your Information
            </h2>
            <p className="mb-3">We use the collected information for the following purposes:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your requests and provide customer support</li>
              <li>Send service-related notifications and updates</li>
              <li>Analyze usage trends to optimize user experience</li>
              <li>Detect, prevent, and address technical issues</li>
              <li>Protect service security and prevent fraud and abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              3. Information Sharing
            </h2>
            <p className="mb-3">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Service Providers:</strong> We share necessary information with third-party service providers who help us operate our services (such as cloud storage and data analytics services).
              </li>
              <li>
                <strong>Legal Requirements:</strong> We may disclose information in response to legal requirements, legal processes, or government requests.
              </li>
              <li>
                <strong>Business Transfers:</strong> Your information may be transferred in the event of a merger, acquisition, or asset sale.
              </li>
              <li>
                <strong>With Consent:</strong> In other circumstances with your explicit consent.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              4. Data Security
            </h2>
            <p>
              We implement reasonable technical and organizational measures to protect your personal information from unauthorized access, use, disclosure, modification, or destruction. This includes encryption, access controls, and secure storage facilities. However, please note that no method of Internet transmission or electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              5. Data Retention
            </h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes for which it was collected, or as required by law. When you delete your account, we will delete or anonymize your personal information unless we are required by law to retain certain information.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              6. Your Rights
            </h2>
            <p className="mb-3">Depending on applicable data protection laws, you may have the following rights:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access and obtain a copy of your personal information</li>
              <li>Correct inaccurate personal information</li>
              <li>Delete your personal information (in certain circumstances)</li>
              <li>Object to or restrict the processing of your personal information</li>
              <li>Data portability</li>
              <li>Withdraw consent (without affecting the lawfulness of processing before withdrawal)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              7. Account Deletion
            </h2>
            <p className="mb-3">
              If you wish to delete your account and associated data, please send an email to{" "}
              <a
                href="mailto:support@ai-voice-labs.com"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                support@ai-voice-labs.com
              </a>
              {" "}with your account deletion request. We will process your request within 7 business days.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Note: Once your account is deleted, all associated data will be permanently removed and cannot be recovered.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              8. Cookies and Tracking Technologies
            </h2>
            <p>
              We use cookies and similar tracking technologies to collect and use information about your use of our services. You can manage cookie preferences through your browser settings, but disabling cookies may affect the functionality of certain features.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              9. Children&apos;s Privacy
            </h2>
            <p>
              Our services are not directed to children under 18 years of age. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us and we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              10. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. When we make significant changes, we will notify you by posting a notice on our service or by sending you a direct notification. We recommend that you review this Privacy Policy periodically for the latest information.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              11. Contact Us
            </h2>
            <p className="mb-3">
              If you have any questions, comments, or requests regarding this Privacy Policy, please contact us:
            </p>
            <ul className="list-none space-y-2 ml-4">
              <li>Email: privacy@ai-voice-labs.com</li>
              <li>Address: 30 N Gould St, STE R, Sheridan, WY 82801, USA</li>
            </ul>
          </section>

          <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800">
            <p className="text-center text-gray-600 dark:text-gray-400">
              This Privacy Policy was last updated on {new Date().toLocaleDateString("en-US")}
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