import { usePageMeta } from "@/hooks/usePageMeta";

export default function PrivacyPolicyPage() {
  usePageMeta({
    title: "Privacy Policy | Electrical Installers",
    description: "Privacy policy for Electrical Installers — how we collect, use, and protect your personal information.",
    path: "/privacy-policy",
  });
  return (
    <div className="min-h-screen bg-[hsl(210,20%,98%)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-[hsl(214,60%,14%)] mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: May 2025</p>

        <div className="prose prose-slate max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-[hsl(214,60%,14%)] mb-3">1. Who we are</h2>
            <p>
              This website is operated by <strong>Design Quote Electrical Pty Ltd</strong> trading as
              <strong> Electrical Installers</strong> (ABN 35 608 171 802, REC 25510). We are an
              electrical contracting business serving Mornington Peninsula, St Kilda, Warragul, and
              surrounding areas in Victoria, Australia.
            </p>
            <p className="mt-2">
              We are bound by the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy
              Principles (APPs).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(214,60%,14%)] mb-3">2. What information we collect</h2>
            <p>We collect personal information when you:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Submit a booking request (name, email, phone number, suburb, and job details)</li>
              <li>Submit a virtual quote request (name, email, phone number, suburb, job description, and uploaded photos)</li>
              <li>Submit a review (name and review content)</li>
              <li>Contact us by phone or email directly</li>
            </ul>
            <p className="mt-3">
              We may also collect non-personal information such as browser type, pages visited, and
              referring URLs for analytical purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(214,60%,14%)] mb-3">3. Why we collect it</h2>
            <p>We collect your personal information to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Respond to your booking or quote enquiry</li>
              <li>Schedule and carry out electrical work</li>
              <li>Send you a confirmation or follow-up communication</li>
              <li>Publish approved reviews on our website (with your consent)</li>
              <li>Improve our services</li>
            </ul>
            <p className="mt-3">
              We will not use your personal information for any purpose that is not reasonably expected
              given the context in which it was collected.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(214,60%,14%)] mb-3">4. How we store and protect it</h2>
            <p>
              Your information is stored in a secure database hosted on servers within Australia or
              with cloud providers that meet Australian data-security standards. We use industry-
              standard measures (HTTPS, access controls, and encrypted sessions) to protect against
              unauthorised access, disclosure, alteration, or destruction.
            </p>
            <p className="mt-3">
              We retain your information only for as long as necessary to fulfil the purpose for which
              it was collected, or as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(214,60%,14%)] mb-3">5. Disclosure to third parties</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share
              it with:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                <strong>Service providers</strong> — such as email delivery services and SMS providers
                that help us communicate with you. These providers are bound by confidentiality
                obligations and may only use your information to provide services to us.
              </li>
              <li>
                <strong>Legal or regulatory authorities</strong> — where required by law or to protect
                our legal rights.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(214,60%,14%)] mb-3">6. Cookies and analytics</h2>
            <p>
              Our website may use session cookies solely to keep you logged in to the admin area.
              No tracking or advertising cookies are used. We do not use Google Analytics or any
              third-party analytics service at this time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(214,60%,14%)] mb-3">7. Your rights</h2>
            <p>Under the Australian Privacy Principles, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Access the personal information we hold about you</li>
              <li>Request corrections to inaccurate or incomplete information</li>
              <li>Request deletion of your information (subject to legal retention obligations)</li>
              <li>Complain about a breach of your privacy</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us using the details below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(214,60%,14%)] mb-3">8. Complaints</h2>
            <p>
              If you believe we have mishandled your personal information, please contact us in the
              first instance. If you are not satisfied with our response, you may lodge a complaint
              with the <strong>Office of the Australian Information Commissioner (OAIC)</strong> at{" "}
              <a
                href="https://www.oaic.gov.au"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[hsl(25,95%,53%)] hover:underline"
              >
                www.oaic.gov.au
              </a>{" "}
              or by calling 1300 363 992.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(214,60%,14%)] mb-3">9. Contact us</h2>
            <p>For any privacy-related enquiries, please contact:</p>
            <address className="not-italic mt-2 space-y-1">
              <p><strong>Design Quote Electrical Pty Ltd</strong> trading as Electrical Installers</p>
              <p>
                Email:{" "}
                <a
                  href="mailto:info@electricalinstallers.com.au"
                  className="text-[hsl(25,95%,53%)] hover:underline"
                >
                  info@electricalinstallers.com.au
                </a>
              </p>
              <p>
                Phone:{" "}
                <a href="tel:0419868703" className="text-[hsl(25,95%,53%)] hover:underline">
                  0419 868 703
                </a>
              </p>
              <p>Mornington Peninsula, Victoria, Australia</p>
            </address>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(214,60%,14%)] mb-3">10. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted on this
              page with an updated date. Continued use of our website constitutes acceptance of the
              updated policy.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
