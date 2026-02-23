'use client';

/**
 * Privacy Policy 内容组件
 * 可复用于页面和 BottomSheet
 */
export default function PrivacyContent() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-gray-700 p-4">
      <section>
        <p className="text-gray-500 mb-4">
          Last Updated: {new Date().toLocaleDateString('en-US')}
        </p>
        <p>
          Welcome to Voicica AI. We take your privacy seriously. This Privacy Policy explains how we collect, use, store, and protect your personal information.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-2">1. Information We Collect</h3>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>Account Information:</strong> Username and email address when you register</li>
          <li><strong>Usage Data:</strong> How you use our services, access times, feature usage</li>
          <li><strong>Device Information:</strong> Device model, OS, browser type, IP address</li>
          <li><strong>Audio Data:</strong> Audio files you upload or generate</li>
        </ul>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-2">2. How We Use Your Information</h3>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Provide, maintain, and improve our services</li>
          <li>Process your requests and provide customer support</li>
          <li>Send service-related notifications</li>
          <li>Analyze usage trends to optimize experience</li>
          <li>Detect, prevent, and address technical issues</li>
        </ul>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-2">3. Information Sharing</h3>
        <p className="mb-2">We do not sell your personal information. We may share information:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>Service Providers:</strong> Third parties who help operate our services</li>
          <li><strong>Legal Requirements:</strong> In response to legal processes</li>
          <li><strong>Business Transfers:</strong> In event of merger or acquisition</li>
          <li><strong>With Consent:</strong> With your explicit consent</li>
        </ul>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-2">4. Third-Party Advertising Partners</h3>
        <p className="mb-2">We work with advertising partners who may collect device information and usage data to serve personalized ads:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>AppLovin (MAX):</strong> Ad mediation and performance tracking</li>
          <li><strong>Unity Ads:</strong> Rewarded video advertisements</li>
          <li><strong>Google AdMob:</strong> Display and video advertisements</li>
        </ul>
        <p className="mt-2">You can opt-out of personalized advertising through your mobile device settings.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-2">5. Data Security</h3>
        <p>
          We implement reasonable technical and organizational measures to protect your information, including encryption, access controls, and secure storage. However, no method of transmission is 100% secure.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-2">6. Your Rights</h3>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Access and obtain a copy of your information</li>
          <li>Correct inaccurate information</li>
          <li>Delete your information (in certain circumstances)</li>
          <li>Object to or restrict processing</li>
          <li>Data portability</li>
          <li>Withdraw consent</li>
        </ul>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-2">7. Account Deletion</h3>
        <p>
          To delete your account and data, email <span className="text-purple-600">info@voicica.ai</span>. We will process your request within 7 business days.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-2">8. Contact Us</h3>
        <p>
          Questions? Contact us at: <span className="text-purple-600">info@voicica.ai</span>
        </p>
        <p className="mt-1">
          Address: 30 N Gould St, STE R, Sheridan, WY 82801, USA
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