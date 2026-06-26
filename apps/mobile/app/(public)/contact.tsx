import { Feather } from "@expo/vector-icons";
import { ReactNode, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card, colors, Field, fontFamilies, PrimaryButton, StatusBanner } from "../../components/ui";

type FeatherIconName = keyof typeof Feather.glyphMap;

export default function ContactScreen() {
  const [form, setForm] = useState({ email: "", message: "", name: "", subject: "" });
  const [message, setMessage] = useState<{ body?: string; title: string; tone: "error" | "success" } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setMessage({ body: "Please fill in every field before sending.", title: "Missing details", tone: "error" });
      return;
    }

    setMessage(null);
    setSubmitting(true);
    await Promise.resolve();
    setSubmitting(false);
    setMessage({ body: "Thank you for reaching out. The team will follow up from info@harvestcoffee.co.uk.", title: "Message sent", tone: "success" });
    setForm({ email: "", message: "", name: "", subject: "" });
  };

  return (
    <>
      <View style={contactStyles.hero}>
        <Text style={contactStyles.kicker}>Premium B2B Coffee Supply</Text>
        <Text style={contactStyles.title}>Contact Us</Text>
        <Text style={contactStyles.lead}>Get in touch with our team</Text>
      </View>

      <View style={contactStyles.content}>
        <View style={contactStyles.info}>
          <Text style={contactStyles.sectionTitle}>Get In Touch</Text>
          <Text style={contactStyles.body}>
            Whether you're interested in wholesale coffee supply, machine maintenance, or just want to learn more about what we
            offer - we'd love to hear from you.
          </Text>

          <InfoBlock icon="map-pin" title="Address">
            The Breeches{"\n"}Galleyhill Road{"\n"}Waltham Abbey{"\n"}EN9 2AQ
          </InfoBlock>
          <InfoBlock icon="mail" title="Email">info@harvestcoffee.co.uk</InfoBlock>
          <InfoBlock icon="clock" title="Business Hours">Monday - Friday: 8:00 - 17:00{"\n"}Saturday: 9:00 - 13:00</InfoBlock>
        </View>

        <Card>
          <Text style={contactStyles.formTitle}>Send a Message</Text>
          {message ? <StatusBanner title={message.title} body={message.body} tone={message.tone} /> : null}
          <Field placeholder="Your name" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
          <Field keyboardType="email-address" placeholder="your@email.com" value={form.email} onChangeText={(email) => setForm({ ...form, email })} />
          <Field placeholder="How can we help?" value={form.subject} onChangeText={(subject) => setForm({ ...form, subject })} />
          <Field multiline placeholder="Tell us more..." value={form.message} onChangeText={(message) => setForm({ ...form, message })} />
          <PrimaryButton disabled={submitting} label={submitting ? "Sending..." : "Send Message"} onPress={handleSubmit} />
        </Card>
      </View>
    </>
  );
}

function InfoBlock({ children, icon, title }: { children: ReactNode; icon: FeatherIconName; title: string }) {
  return (
    <View style={contactStyles.infoBlock}>
      <View style={contactStyles.infoIcon}>
        <Feather color={colors.foreground} name={icon} size={22} />
      </View>
      <View style={contactStyles.infoCopy}>
        <Text style={contactStyles.infoTitle}>{title}</Text>
        <Text style={contactStyles.infoText}>{children}</Text>
      </View>
    </View>
  );
}

const contactStyles = StyleSheet.create({
  body: {
    color: colors.textSubtle,
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 23,
  },
  content: {
    backgroundColor: colors.secondary,
    gap: 22,
    padding: 16,
    paddingVertical: 34,
  },
  formTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 22,
  },
  hero: {
    alignItems: "center",
    backgroundColor: colors.background,
    gap: 14,
    padding: 20,
    paddingVertical: 42,
  },
  info: {
    gap: 14,
  },
  infoBlock: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 14,
    paddingTop: 16,
  },
  infoCopy: {
    flex: 1,
    gap: 4,
  },
  infoIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  infoText: {
    color: colors.textSubtle,
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 23,
  },
  infoTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
  },
  kicker: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  lead: {
    color: colors.muted,
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 520,
    textAlign: "center",
  },
  sectionTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 26,
    lineHeight: 31,
  },
  title: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 34,
    lineHeight: 39,
    textAlign: "center",
  },
});
