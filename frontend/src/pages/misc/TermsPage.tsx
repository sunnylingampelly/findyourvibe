import AppShell from '../../components/layout/AppShell'
import PageHeader from '../../components/layout/PageHeader'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="font-manrope font-bold text-[#24332F] text-base mb-2">{title}</h2>
      <div className="text-sm text-[#77817C] leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

export default function TermsPage() {
  return (
    <AppShell>
      <div className="screen-scroll h-dvh overflow-y-auto bg-[#FAF9F6]">
        <PageHeader title="Terms & Privacy" back />

        <div className="px-4 pb-10">
          <div className="bg-white rounded-2xl border border-[#E8EAE6] p-5">
            <p className="text-xs text-[#A1AAA5] mb-5">Last updated: January 2026</p>

            <Section title="1. Acceptance of Terms">
              <p>By using FindYourVibe, you agree to these Terms of Service. If you do not agree, please do not use our platform.</p>
            </Section>

            <Section title="2. Eligibility">
              <p>You must be at least 18 years old to use FindYourVibe. By registering, you confirm that you meet this age requirement.</p>
            </Section>

            <Section title="3. User Conduct">
              <p>You agree to use FindYourVibe respectfully and legally. Harassment, fraud, impersonation, or any harmful behaviour will result in immediate account suspension.</p>
            </Section>

            <Section title="4. Privacy Policy">
              <p>We collect and process your personal data as described in our Privacy Policy. We use your information to provide, improve, and personalise our services.</p>
              <p>We do not sell your personal data to third parties.</p>
            </Section>

            <Section title="5. Profile & Content">
              <p>You are responsible for all content you post on FindYourVibe. You grant us a licence to display your content on our platform.</p>
            </Section>

            <Section title="6. Safety">
              <p>Always meet companions in public places. Trust your instincts. Report any suspicious behaviour using the in-app report feature.</p>
            </Section>

            <Section title="7. Contact">
              <p>For any questions about these terms, contact us at legal@findyourvibe.com</p>
            </Section>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
