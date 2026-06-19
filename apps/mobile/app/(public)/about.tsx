import { Feather } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";
import { Card, colors, FadeInView, fontFamilies } from "../../components/ui";

type FeatherIconName = keyof typeof Feather.glyphMap;

const storyImage = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85";

const values: Array<{ body: string; icon: FeatherIconName; title: string }> = [
  { body: "Every bean is carefully selected and roasted to perfection.", icon: "coffee", title: "Quality First" },
  { body: "We partner with farms committed to ethical and sustainable practices.", icon: "sunrise", title: "Sustainability" },
  { body: "Award-winning blends and single origins from the world's best regions.", icon: "award", title: "Excellence" },
  { body: "We build long-term relationships with our wholesale clients.", icon: "users", title: "Partnership" },
];

export default function AboutScreen() {
  return (
    <>
      <View style={aboutStyles.hero}>
        <Text style={aboutStyles.kicker}>Premium B2B Coffee Supply</Text>
        <Text style={aboutStyles.title}>About Harvest Coffee</Text>
        <Text style={aboutStyles.lead}>
          We are a premium B2B coffee supplier based in Waltham Abbey, Essex, dedicated to bringing the finest coffees from around
          the world to businesses across the UK.
        </Text>
      </View>

      <View style={aboutStyles.story}>
        <FadeInView style={aboutStyles.storyCopy}>
          <Text style={aboutStyles.kicker}>Our Story</Text>
          <Text style={aboutStyles.sectionTitle}>Our Story</Text>
          <Text style={aboutStyles.body}>
            Harvest Coffee was founded with a simple mission: to connect businesses with exceptional coffee. We source our beans
            directly from trusted farms and cooperatives, ensuring quality at every step of the supply chain.
          </Text>
          <Text style={aboutStyles.body}>
            From our base at The Breeches, Galleyhill Road, Waltham Abbey, we supply cafes, restaurants, offices, and hospitality
            businesses throughout the United Kingdom with carefully curated coffee selections and professional machine maintenance
            services.
          </Text>
        </FadeInView>
        <Image accessibilityLabel="Coffee cups" source={{ uri: storyImage }} style={aboutStyles.image} />
      </View>

      <View style={aboutStyles.values}>
        <Text style={[aboutStyles.kicker, aboutStyles.centerText]}>Our Values</Text>
        <Text style={[aboutStyles.sectionTitle, aboutStyles.centerText]}>What Drives Us</Text>
        <View style={aboutStyles.valueGrid}>
          {values.map((item, index) => (
            <FadeInView delay={index * 70} key={item.title}>
              <Card>
                <View style={aboutStyles.valueIcon}>
                  <Feather color={colors.foreground} name={item.icon} size={26} />
                </View>
                <Text style={aboutStyles.valueTitle}>{item.title}</Text>
                <Text style={aboutStyles.valueBody}>{item.body}</Text>
                <View style={aboutStyles.rule} />
              </Card>
            </FadeInView>
          ))}
        </View>
      </View>
    </>
  );
}

const aboutStyles = StyleSheet.create({
  body: {
    color: colors.textSubtle,
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 23,
  },
  centerText: {
    textAlign: "center",
  },
  hero: {
    alignItems: "center",
    backgroundColor: colors.background,
    gap: 14,
    padding: 20,
    paddingVertical: 42,
  },
  image: {
    backgroundColor: colors.border,
    borderRadius: 14,
    height: 260,
    width: "100%",
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
  rule: {
    alignSelf: "center",
    backgroundColor: colors.border,
    height: 1,
    marginTop: 8,
    width: 52,
  },
  sectionTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 26,
    lineHeight: 31,
  },
  story: {
    backgroundColor: colors.secondary,
    gap: 22,
    padding: 16,
    paddingVertical: 34,
  },
  storyCopy: {
    gap: 14,
  },
  title: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 34,
    lineHeight: 39,
    textAlign: "center",
  },
  valueBody: {
    color: colors.muted,
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  valueGrid: {
    gap: 10,
    marginTop: 16,
  },
  valueIcon: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  valueTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
    textAlign: "center",
  },
  values: {
    backgroundColor: colors.background,
    padding: 12,
    paddingVertical: 32,
  },
});
