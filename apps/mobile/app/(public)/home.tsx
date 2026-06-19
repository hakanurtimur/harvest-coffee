import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Badge, Card, colors, FadeInView, fontFamilies, OutlineButton, PrimaryButton } from "../../components/ui";

type FeatherIconName = keyof typeof Feather.glyphMap;

const heroImage = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=85";
const beansImage = "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=85";
const cafeImage = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=85";
const featuredImage = "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80";

const values: Array<{ body: string; icon: FeatherIconName; title: string }> = [
  { body: "Fairtrade certified beans from ethical farms", icon: "sunrise", title: "Sustainably Sourced" },
  { body: "Hand-crafted roasting for peak flavour", icon: "zap", title: "Micro-Roasted" },
  { body: "Tailored wholesale programs for your business", icon: "briefcase", title: "B2B Excellence" },
];

export default function PublicHomeScreen() {
  return (
    <>
      <View style={homeStyles.hero}>
        <Image accessibilityLabel="Coffee cups" source={{ uri: heroImage }} style={homeStyles.heroImage} />
        <View style={homeStyles.heroOverlay} />
        <FadeInView style={homeStyles.heroCopy}>
          <Text style={homeStyles.heroKicker}>Our Philosophy - Exceptional Quality</Text>
          <Text style={homeStyles.heroTitle}>It all began with a modest concept: Create amazing coffee</Text>
          <Text style={homeStyles.heroText}>Coffee is our craft, our ritual, our passion and we want to share it with you.</Text>
          <View style={homeStyles.heroActions}>
            <PrimaryButton label="Login to order" onPress={() => router.push("/login")} />
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/about")}
              style={({ pressed }) => [homeStyles.heroOutlineButton, pressed && homeStyles.heroOutlineButtonPressed]}
            >
              <Text style={homeStyles.heroOutlineButtonText}>Learn more</Text>
            </Pressable>
          </View>
        </FadeInView>
      </View>

      <View style={homeStyles.section}>
        <FadeInView style={homeStyles.splitCopy}>
          <Text style={homeStyles.kicker}>Because We Love Coffee</Text>
          <Text style={homeStyles.sectionTitle}>Our Mission</Text>
          <Text style={homeStyles.body}>
            Everything we do is a matter of heart, body and soul. Our mission is to provide sustainably sourced,
            hand-picked, micro-roasted quality coffee. Great coffee is our passion and we want to share it with you.
          </Text>
        </FadeInView>
        <FadeInView delay={100} style={homeStyles.imageWrap}>
          <Image accessibilityLabel="Coffee beans" source={{ uri: beansImage }} style={homeStyles.sectionImage} />
          <View style={homeStyles.experienceBadge}>
            <Text style={homeStyles.experienceNumber}>15+</Text>
            <Text style={homeStyles.experienceText}>Years of Excellence</Text>
          </View>
        </FadeInView>
      </View>

      <View style={homeStyles.valueGrid}>
        {values.map((item, index) => (
          <FadeInView delay={index * 70} key={item.title} style={homeStyles.valueCard}>
            <View style={homeStyles.valueIcon}>
              <Feather color={colors.foreground} name={item.icon} size={24} />
            </View>
            <View style={homeStyles.valueCopy}>
              <Text style={homeStyles.valueTitle}>{item.title}</Text>
              <Text style={homeStyles.valueText}>{item.body}</Text>
            </View>
          </FadeInView>
        ))}
      </View>

      <View style={homeStyles.wholesale}>
        <Image accessibilityLabel="Cafe counter" source={{ uri: cafeImage }} style={homeStyles.wholesaleImage} />
        <Card>
          <Text style={homeStyles.kicker}>Become a Partner</Text>
          <Text style={homeStyles.sectionTitle}>Explore Wholesale</Text>
          <Text style={homeStyles.body}>Personalised to your specific needs. We help build coffee programs to grow your business.</Text>
          <PrimaryButton label="Get in touch" onPress={() => router.push("/contact")} />
        </Card>
      </View>

      <View style={homeStyles.featured}>
        <Image accessibilityLabel="Colombia Single Origin" source={{ uri: featuredImage }} style={homeStyles.featuredImage} />
        <View style={homeStyles.featuredCopy}>
          <Text style={homeStyles.kicker}>Staff Favourite - Featured Coffee</Text>
          <Text style={homeStyles.sectionTitle}>Colombia Single Origin</Text>
          <Badge label="Single Origin" />
          <Text style={homeStyles.body}>A bright filter and espresso option for cafes that want a rotating premium origin.</Text>
          <OutlineButton label="Login to discover products" onPress={() => router.push("/login")} />
        </View>
      </View>
    </>
  );
}

const homeStyles = StyleSheet.create({
  body: {
    color: colors.textSubtle,
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 23,
  },
  experienceBadge: {
    backgroundColor: colors.foreground,
    borderRadius: 14,
    bottom: -18,
    left: 18,
    padding: 16,
    position: "absolute",
    width: 132,
  },
  experienceNumber: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 28,
  },
  experienceText: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  featured: {
    backgroundColor: colors.background,
    gap: 16,
    padding: 12,
    paddingTop: 24,
  },
  featuredCopy: {
    gap: 12,
  },
  featuredImage: {
    backgroundColor: colors.border,
    borderRadius: 14,
    height: 220,
    width: "100%",
  },
  hero: {
    borderRadius: 24,
    marginHorizontal: 12,
    marginTop: 10,
    minHeight: 480,
    overflow: "hidden",
  },
  heroActions: {
    gap: 10,
    marginTop: 6,
  },
  heroCopy: {
    bottom: 0,
    gap: 16,
    left: 0,
    padding: 20,
    position: "absolute",
    right: 0,
  },
  heroImage: {
    height: 480,
    width: "100%",
  },
  heroKicker: {
    color: colors.overlay.heroTextMuted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay.heroScrim,
  },
  heroOutlineButton: {
    alignItems: "center",
    borderColor: colors.overlay.heroBorder,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  heroOutlineButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  heroOutlineButtonText: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.semiBold,
  },
  heroText: {
    color: colors.overlay.heroText,
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 23,
  },
  heroTitle: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.bold,
    fontSize: 33,
    lineHeight: 36,
  },
  imageWrap: {
    paddingBottom: 24,
  },
  kicker: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  section: {
    backgroundColor: colors.secondary,
    gap: 24,
    padding: 16,
    paddingVertical: 34,
  },
  sectionImage: {
    backgroundColor: colors.border,
    borderRadius: 14,
    height: 220,
    width: "100%",
  },
  sectionTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 26,
    lineHeight: 31,
  },
  splitCopy: {
    gap: 14,
  },
  valueCard: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    padding: 14,
  },
  valueCopy: {
    flex: 1,
    gap: 4,
  },
  valueGrid: {
    backgroundColor: colors.background,
    gap: 10,
    padding: 12,
  },
  valueIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  valueText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  valueTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
  },
  wholesale: {
    backgroundColor: colors.secondary,
    gap: 12,
    padding: 12,
    paddingVertical: 26,
  },
  wholesaleImage: {
    backgroundColor: colors.border,
    borderRadius: 14,
    height: 220,
    width: "100%",
  },
});
