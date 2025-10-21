import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy - AI Voice Labs",
  description: "AI Voice Labs Refund Policy",
};

export default function RefundPolicy() {
  return (
    <div className="font-sans min-h-screen p-8 pb-20 sm:p-20">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
          Refund Policy
        </h1>

        <div className="space-y-6 text-sm sm:text-base leading-relaxed">
          <section>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Last Updated: {new Date().toLocaleDateString("en-US")}
            </p>
            <p>
              At AI Voice Labs, we strive to provide excellent service and customer satisfaction. This Refund Policy explains our policies regarding refunds, cancellations, and subscription management.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              1. Subscription Overview
            </h2>
            <p className="mb-3">
              AI Voice Labs offers various subscription plans with different features and pricing:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Free Plan:</strong> No payment required, limited features
              </li>
              <li>
                <strong>Monthly Subscriptions:</strong> Billed monthly, can be cancelled anytime
              </li>
              <li>
                <strong>Annual Subscriptions:</strong> Billed annually, offering discounted rates
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              2. 7-Day Money-Back Guarantee
            </h2>
            <p className="mb-3">
              We offer a <strong>7-day money-back guarantee</strong> for first-time subscribers:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Applies to first-time purchases only (not applicable to renewals)</li>
              <li>Request must be submitted within 7 days of the initial purchase date</li>
              <li>Full refund will be issued to the original payment method</li>
              <li>Account will be downgraded to the free plan upon refund processing</li>
              <li>Generated content and usage during the trial period will be retained according to free plan limits</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              3. How to Request a Refund
            </h2>
            <p className="mb-3">
              To request a refund within the 7-day guarantee period:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>
                Send an email to{" "}
                <a
                  href="mailto:support@ai-voice-labs.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  support@ai-voice-labs.com
                </a>
              </li>
              <li>Include your account email address and order/transaction ID</li>
              <li>Provide a brief reason for the refund request (optional but helpful)</li>
              <li>We will process your request within 3-5 business days</li>
              <li>Refunds typically appear in your account within 5-10 business days, depending on your payment provider</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              4. Subscription Cancellation
            </h2>
            <p className="mb-3">
              You can cancel your subscription at any time:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Go to your account settings and navigate to the subscription section</li>
              <li>Click &quot;Cancel Subscription&quot; and follow the prompts</li>
              <li>Your subscription will remain active until the end of the current billing period</li>
              <li>You will retain access to paid features until the subscription expires</li>
              <li>No charges will be made for subsequent billing periods</li>
              <li>Your account will automatically downgrade to the free plan after expiration</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              5. Non-Refundable Situations
            </h2>
            <p className="mb-3">
              Refunds will <strong>not</strong> be provided in the following situations:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>After 7-Day Period:</strong> Refund requests made more than 7 days after the purchase date
              </li>
              <li>
                <strong>Subscription Renewals:</strong> Automatic subscription renewals (monthly or annual)
              </li>
              <li>
                <strong>Partial Period Refunds:</strong> We do not offer prorated refunds for partial subscription periods
              </li>
              <li>
                <strong>Account Violations:</strong> Accounts suspended or terminated due to Terms of Service violations
              </li>
              <li>
                <strong>Usage-Based Charges:</strong> Charges incurred from actual service usage (if applicable)
              </li>
              <li>
                <strong>Third-Party Services:</strong> Any fees charged by third-party payment processors
              </li>
              <li>
                <strong>Changed Mind:</strong> Cancellations after the 7-day guarantee period simply due to change of preference
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              6. Subscription Auto-Renewal
            </h2>
            <p className="mb-3">
              All paid subscriptions automatically renew:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Monthly subscriptions renew every month on the anniversary of your purchase date</li>
              <li>Annual subscriptions renew every year on the anniversary of your purchase date</li>
              <li>You will be charged using your saved payment method</li>
              <li>We will send a reminder email 7 days before renewal</li>
              <li>Cancel anytime before the renewal date to avoid being charged</li>
              <li>Cancellation must be completed at least 24 hours before the renewal date</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              7. Downgrade and Upgrades
            </h2>
            <p className="mb-3">
              <strong>Upgrading Your Plan:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>You can upgrade to a higher-tier plan at any time</li>
              <li>You will be charged the prorated difference for the current billing period</li>
              <li>The new plan takes effect immediately</li>
            </ul>
            <p className="mb-3">
              <strong>Downgrading Your Plan:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You can request to downgrade to a lower-tier plan</li>
              <li>The downgrade will take effect at the end of your current billing period</li>
              <li>No refund will be issued for the price difference</li>
              <li>You will retain access to current plan features until the billing period ends</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              8. Payment Failures and Retry Policy
            </h2>
            <p className="mb-3">
              If a subscription renewal payment fails:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>We will attempt to charge your payment method up to 3 times over 7 days</li>
              <li>You will receive email notifications about the failed payment</li>
              <li>Update your payment information in account settings to resolve the issue</li>
              <li>If all retry attempts fail, your subscription will be cancelled</li>
              <li>Your account will be downgraded to the free plan</li>
              <li>You can resubscribe at any time by updating your payment information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              9. Exceptional Circumstances
            </h2>
            <p className="mb-3">
              In rare cases, we may consider refunds outside of our standard policy for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Technical issues that prevented you from using the service</li>
              <li>Billing errors or duplicate charges</li>
              <li>Service outages that significantly impacted your usage</li>
              <li>Other extraordinary circumstances at our sole discretion</li>
            </ul>
            <p className="mt-3">
              Please contact our support team at{" "}
              <a
                href="mailto:support@ai-voice-labs.com"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                support@ai-voice-labs.com
              </a>
              {" "}to discuss such situations.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              10. Disputes and Chargebacks
            </h2>
            <p className="mb-3">
              If you dispute a charge with your credit card company or payment provider:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your account may be immediately suspended pending investigation</li>
              <li>Please contact us first before initiating a chargeback so we can resolve the issue</li>
              <li>Fraudulent chargebacks may result in permanent account termination</li>
              <li>We reserve the right to pursue collection of disputed charges</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              11. Free Trial Policy
            </h2>
            <p>
              From time to time, we may offer free trials of our paid plans. Free trial terms will be clearly communicated at the time of offer. Unless cancelled before the trial period ends, you will automatically be charged for the subscription plan when the trial expires.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              12. Changes to This Policy
            </h2>
            <p>
              We reserve the right to modify this Refund Policy at any time. Changes will be posted on this page with an updated revision date. Material changes will be communicated via email or through a notice on our website. Your continued use of our services after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              13. Contact Information
            </h2>
            <p className="mb-3">
              For questions, concerns, or requests related to refunds and billing, please contact us:
            </p>
            <ul className="list-none space-y-2 ml-4">
              <li>
                Email:{" "}
                <a
                  href="mailto:support@ai-voice-labs.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  support@ai-voice-labs.com
                </a>
              </li>
              <li>Billing Email: billing@ai-voice-labs.com</li>
              <li>Address: 30 N Gould St, STE R, Sheridan, WY 82801, USA</li>
            </ul>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Our support team typically responds within 24-48 hours during business days (Monday-Friday, 9 AM - 5 PM EST).
            </p>
          </section>

          <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800">
            <p className="text-center text-gray-600 dark:text-gray-400">
              This Refund Policy was last updated on {new Date().toLocaleDateString("en-US")}
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