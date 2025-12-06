import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy - Voicica AI",
  description: "Voicica AI Refund Policy",
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
            <p className="mb-4">
              At Voicica AI, we regard customer satisfaction to be most important. We strive to ensure that our customers are completely happy with both our products and our service.
            </p>
            <p className="mb-4">
              In the unlikely event that you are dissatisfied with, or even if you just have questions about, any aspect of our products or service, please contact our Customer Support Team without delay.
            </p>
            <p>
              You can reach out to Voicica AI&apos;s caring Customer Support Team at{" "}
              <a
                href="mailto:info@voicica.ai"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                info@voicica.ai
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              Requesting a Refund
            </h2>
            <p className="mb-3">
              Sometimes, despite our best intentions, a customer may want to cancel their order. If that is the case, we respectfully request that they complete a &apos;Request Refund&apos; form.
            </p>
            <p className="mb-3">To complete the form, you will need the:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>Product name.</li>
              <li>Order reference number.</li>
              <li>Email address used when making the purchase.</li>
              <li>Reason for requesting a refund.</li>
            </ul>
            <p>
              Voicica AI aims to process each request for a refund within one business day of receiving the request. Each request is assessed according to the criteria listed below.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              Money Back Guarantee
            </h2>
            <p className="mb-4">
              Voicica AI products generally feature &apos;free trial&apos; versions, which allow the customer to test the tools for flaws, and to ensure that it is working correctly on their device.
            </p>
            <p>
              If no problems were evident, and communicated to Voicica AI&apos;s Customer Support Team, during the 30-day trial period, then the order may not be cancelled.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              Eligibility for Refund
            </h2>
            <p className="mb-3">
              Under the 30-day Money Back Guarantee, refunds will only be granted in the following circumstances listed below, with the money credited to the account originally used to make the purchase.
            </p>
            <ul className="list-disc list-inside space-y-3 ml-4">
              <li>
                If the tool malfunctions due to a technical problem that is unable to be resolved within the trial period, and the customer is unwilling to wait for a software update, Voicica AI will refund the purchase price.
              </li>
              <li>
                If the online tool suffers a fatal malfunction, Voicica AI will either refund the purchase price, or offer an exchange for a different product, at the customer&apos;s discretion.
              </li>
              <li>
                If the customer mistakenly duplicates the purchase of the software, or purchases a similar type of software, then Voicica AI will either refund the purchase price of one of them or offer an exchange for a different product.
              </li>
              <li>
                If the order information for the tool has not been received by the customer within 24 hours of making payment, and the customer has not received a response from the Customer Support Team within 48 hours of notifying them of the issue, then Voicica AI may either cancel the order or offer a full refund.
              </li>
              <li>
                If the customer does not receive an auto-renewal notification by email prior to the subscription being auto-renewed against the customer&apos;s wishes, Voicica AI will offer a refund if contacted within 7 days of the renewal.
              </li>
              <li>
                If two or more payments were made for the same product due to a technical issue with the customer&apos;s payment platform, Voicica AI will refund the extra payments.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              Ineligibility for Refund
            </h2>
            <p className="mb-3">
              Unfortunately, there are circumstances where Voicica AI will not be able to offer a refund but may offer to exchange for a different type of tools.
            </p>
            <p className="mb-3">These circumstances are detailed below:</p>
            <ul className="list-disc list-inside space-y-3 ml-4">
              <li>
                Since purchasing, the customer has found the same product being sold elsewhere for a lower price.
              </li>
              <li>
                Since purchasing, the customer has bought a similar product from a different provider.
              </li>
              <li>
                The customer purchased the product on special terms during a sales promotion.
              </li>
              <li>
                The customer has repeatedly and intentionally purchased similar products.
              </li>
              <li>
                Since third-party payment processing services are used, it is not possible for Voicica AI to monitor the legitimacy of payments, so fraudulent use of credit cards and unauthorized transfers must be resolved between the customer and the issuer of their credit card(s). Voicica AI will assist where able.
              </li>
              <li>
                Failing to properly understand the functions and capabilities of the product(s) through not reading the product description thoroughly before purchasing the software.
              </li>
              <li>
                Refusal to supply a reason for requesting a refund.
              </li>
            </ul>
          </section>

          <section>
            <p>
              As stated in our Refund Policy above, Voicica AI is committed to customer satisfaction. To that end, Voicica AI&apos;s Customer Support Team is always willing to take feedback, and consider suggestions, from customers. Voicica AI will make every effort to resolve customers&apos; problems.
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