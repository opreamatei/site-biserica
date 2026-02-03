import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type DonationThankYouEmailProps = {
  amountLabel: string;
  donationType: "one-time" | "recurring";
  donorName?: string;
  logoDarkUrl?: string;
  logoLightUrl?: string;
  donationDateLabel?: string;
};

const bodyStyle = {
  backgroundColor: "#0f0f0f",
  fontFamily: "Arial, sans-serif",
};

const containerStyle = {
  backgroundColor: "#1a1a1a",
  borderRadius: "14px",
  padding: "28px",
  border: "1px solid #2a2a2a",
};

const headingStyle = {
  color: "#ffffff",
  fontSize: "20px",
  marginBottom: "8px",
};

const textStyle = {
  color: "#e5e5e5",
  fontSize: "14px",
  lineHeight: "22px",
};

const metaStyle = {
  color: "#b0b0b0",
  fontSize: "13px",
};

export function DonationThankYouEmail({
  amountLabel,
  donationType,
  donorName,
  logoDarkUrl,
  logoLightUrl,
  donationDateLabel,
}: DonationThankYouEmailProps) {
  const typeLabel = donationType === "recurring" ? "donatie recurenta" : "donatie";
  const introName = donorName ? `, ${donorName}` : "";
  const previewText = `Multumim pentru ${typeLabel} (${amountLabel}).`;

  return (
    <Html>
      <Head>
        <style>
          {`
            @media (prefers-color-scheme: light) {
              .logo-light { display: none !important; }
              .logo-dark { display: block !important; }
            }
            @media (prefers-color-scheme: dark) {
              .logo-light { display: block !important; }
              .logo-dark { display: none !important; }
            }
          `}
        </style>
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section>
          </Section>
          <Heading style={headingStyle}>Vă mulțumim{introName}!</Heading>
          <Text style={textStyle}>
            Donația dvs. de {amountLabel} a fost confirmată.
          </Text>
          <Text style={textStyle}>
            Sprijinul dvs. ajută Biserica Foișor să continue lucrările și
            proiectele comunității.
          </Text>
          <Hr style={{ borderColor: "#333333", margin: "18px 0" }} />
          {donationDateLabel ? (
            <Text style={metaStyle}>Data platii: {donationDateLabel}</Text>
          ) : null}
          <Text style={metaStyle}>
            Dacă aveți întrebări, ne puteți contacta pe emailul bisericii.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
