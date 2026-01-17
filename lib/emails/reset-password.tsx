import * as React from "react";
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

type ResetPasswordEmailProps = {
  token: string;
  expiresLabel: string;
  logoDarkUrl: string;
  logoLightUrl: string;
};

export function ResetPasswordEmail({
  token,
  expiresLabel,
}: ResetPasswordEmailProps) {
  const displayToken = formatToken(token);

  return (
    <Html lang="ro">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>
          {`
@import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap");
@media only screen and (max-width: 600px) {
  .email-container { padding: 26px 18px !important; }
  .email-title { font-size: 21px !important; }
  .email-lead { font-size: 15px !important; }
  .email-code { font-size: 26px !important; letter-spacing: 2px !important; }
  .email-meta { font-size: 13px !important; }
  .email-signature { font-size: 14px !important; }
  .logo-image { width: 120px !important; }
}
@media (prefers-color-scheme: dark) {
  body, .email-body { background-color: #0f0f0f !important; }
  .email-container { background-color: #1a1a1a !important; color: #f1f1f1 !important; }
  .email-lead { color: #d1d1d1 !important; }
  .email-meta { color: #b0b0b0 !important; }
  .email-signature { color: #dcdcdc !important; }
  .email-divider { border-color: #333333 !important; }
  .email-code { color: #ffffff !important; }
  .logo-dark { display: none !important; }
  .logo-light { display: block !important; }
}
          `}
        </style>
      </Head>
      <Preview>Cod de resetare: {displayToken}</Preview>
      <Body style={bodyStyle} className="email-body">
        <Container style={containerStyle} className="email-container">
          <Heading style={titleStyle} className="email-title">
            Codul de resetare pentru contul dvs.
          </Heading>
          <Text style={leadStyle} className="email-lead">
            {"Utiliza\u021bi urm\u0103torul cod pentru a reseta parola."}
          </Text>
          <Section>
            <Text style={codeStyle} className="email-code">
              {displayToken}
            </Text>
          </Section>
          <Text style={metaStyle} className="email-meta">
            {"Codul expir\u0103 \u00een 30 de minute, la: "}
            {expiresLabel}
          </Text>
          <Hr style={dividerStyle} className="email-divider" />
          <Section style={signatureSectionStyle}>
            <Text style={signatureStyle} className="email-signature">
              {"Dac\u0103 nu a\u021bi f\u0103cut aceast\u0103 cerere, ignora\u021bi acest email."}
            </Text>
            <Text style={signatureLastStyle} className="email-signature">
              <br />
              {"Biserica Foișorul Mavrocordaților"}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function formatToken(value: string) {
  const clean = value.replace(/[\s-]/g, "").toUpperCase();
  return clean.slice(0, 4);
}


const bodyStyle: React.CSSProperties = {
  margin: "0",
  padding: "24px 12px",
  width: "100%",
  backgroundColor: "#f4f1ec",
  fontFamily: '"Manrope", "Segoe UI", Arial, sans-serif',
  WebkitTextSizeAdjust: "100%",
};

const containerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "520px",
  margin: "0 auto",
  padding: "34px 28px",
  borderRadius: "16px",
  backgroundColor: "#ffffff",
  textAlign: "center",
  color: "#1a1a1a",
  boxSizing: "border-box",
};

const titleStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  margin: "0 0 12px",
};

const leadStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px",
  color: "#444444",
};

const codeStyle: React.CSSProperties = {
  fontSize: "30px",
  letterSpacing: "2px",
  fontWeight: 700,
  margin: "8px 0 18px",
  lineHeight: "1.2",
  color: "#1a1a1a",
};

const metaStyle: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 18px",
  color: "#5a5a5a",
};

const dividerStyle: React.CSSProperties = {
  borderColor: "#e6e0d8",
  margin: "18px 0",
};

const signatureSectionStyle: React.CSSProperties = {
  marginTop: "6px",
};

const signatureStyle: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#3b3b3b",
  margin: "0 0 6px",
};

const signatureLastStyle: React.CSSProperties = {
  ...signatureStyle,
  margin: "0",
};

const logoSectionStyle: React.CSSProperties = {
  marginTop: "18px",
  textAlign: "center",
};

const logoStyle: React.CSSProperties = {
  width: "150px",
  height: "auto",
  margin: "0 auto",
  display: "block",
};

const logoLightStyle: React.CSSProperties = {
  ...logoStyle,
  display: "none",
};
