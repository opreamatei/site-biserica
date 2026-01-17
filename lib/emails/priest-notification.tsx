import {
  Body,
  Container,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type BookingSummary = {
  name: string;
  email?: string;
  peopleCount: number;
  durationMinutes: number;
};

type PriestNotificationEmailProps = {
  priestName: string;
  eventDate: string;
  eventStartTime: string;
  eventLabel: string;
  type: "scheduled" | "full";
  bookings: BookingSummary[];
  totalPeople: number;
  totalMinutes: number;
};

const bodyStyle = {
  backgroundColor: "#f6f4ef",
  fontFamily: "Arial, sans-serif",
};

const containerStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  padding: "28px",
  border: "1px solid #eee4d2",
};

const headingStyle = {
  color: "#2b220a",
  fontSize: "20px",
  marginBottom: "8px",
};

const textStyle = {
  color: "#4b3a16",
  fontSize: "14px",
  lineHeight: "22px",
};

const metaStyle = {
  color: "#6f5a27",
  fontSize: "13px",
};

export function PriestNotificationEmail({
  priestName,
  eventDate,
  eventStartTime,
  eventLabel,
  type,
  bookings,
  totalPeople,
  totalMinutes,
}: PriestNotificationEmailProps) {
  const previewText =
    type === "full"
      ? `Interval complet: ${eventDate} ${eventStartTime}`
      : `Programari pentru ${eventDate} ${eventStartTime}`;

  return (
    <Html>
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>
            {type === "full" ? "Interval complet" : "Notificare programări"}
          </Heading>
          <Text style={textStyle}>
           În data de {eventDate}, ora {eventStartTime}.
          </Text>
          <Text style={metaStyle}>
            Total persoane: {totalPeople} • Total minute: {totalMinutes}
          </Text>
          <Hr style={{ borderColor: "#f0e5d1", margin: "18px 0" }} />
          <Section>
            {bookings.length === 0 && (
              <Text style={textStyle}>Nu există înscrieri în acest moment.</Text>
            )}
            {bookings.map((booking, index) => (
              <Text key={`${booking.name}-${index}`} style={textStyle}>
                {index + 1}. {booking.name}
                {booking.email ? ` (${booking.email})` : ""} • persoane:{" "}
                {booking.peopleCount} • {booking.durationMinutes} min
              </Text>
            ))}
          </Section>
          <Hr style={{ borderColor: "#f0e5d1", margin: "18px 0" }} />
          <Text style={metaStyle}>
            Acest mesaj este generat automat pentru programări.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
