import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { DealerShell } from "../components/dealer-shell";
import { Card, Field, Metric, OutlineButton, PrimaryButton, ScrollContent, SectionTitle, styles } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

export default function ProfileScreen() {
  const { addAddress, currentUser, deleteAddress, deliveryAddress, logout, orders, setDeliveryAddress } = useMobileState();
  const [addressTitle, setAddressTitle] = useState("");
  const [addressText, setAddressText] = useState("");
  const [saving, setSaving] = useState(false);

  if (!currentUser) return null;

  const submitAddress = async () => {
    if (!addressTitle.trim() || addressText.trim().length < 3) {
      Alert.alert("Address required", "Add an address title and a valid address.");
      return;
    }

    setSaving(true);
    try {
      await addAddress(addressTitle.trim(), addressText.trim());
      setAddressTitle("");
      setAddressText("");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <DealerShell title="Profile">
      <ScrollContent>
        <SectionTitle eyebrow="Account" title="Profile" />
        <Card>
          <Text style={styles.cardTitle}>{currentUser.fullName}</Text>
          <Text style={styles.muted}>{currentUser.email}</Text>
          <Text style={styles.muted}>{currentUser.companyName}</Text>
          <View style={profileStyles.metrics}>
            <Metric label="Orders" value={orders.length.toString()} />
            <Metric label="Segment" value={currentUser.customerSegment} />
          </View>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Delivery addresses</Text>
          {currentUser.addresses.map((address, index) => {
            const active = deliveryAddress === address.address;
            return (
              <View key={`${address.title}-${index}`} style={profileStyles.addressRow}>
                <Pressable style={profileStyles.addressCopy} onPress={() => setDeliveryAddress(address.address)}>
                  <Text style={styles.name}>{address.title}{active ? " (selected)" : ""}</Text>
                  <Text style={styles.description}>{address.address}</Text>
                </Pressable>
                <OutlineButton label="Delete" onPress={() => deleteAddress(index)} />
              </View>
            );
          })}
          <Field onChangeText={setAddressTitle} placeholder="Address title" value={addressTitle} />
          <Field multiline onChangeText={setAddressText} placeholder="Delivery address" value={addressText} />
          <PrimaryButton disabled={saving} label={saving ? "Adding address..." : "Add address"} onPress={submitAddress} />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Session</Text>
          <Text style={styles.description}>Mock dealer session is active. Logout returns to the mock login screen.</Text>
          <OutlineButton label="Logout" onPress={handleLogout} />
        </Card>
      </ScrollContent>
    </DealerShell>
  );
}

const profileStyles = StyleSheet.create({
  addressCopy: {
    flex: 1,
    gap: 4,
  },
  addressRow: {
    alignItems: "flex-start",
    borderBottomColor: "#eadccb",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingBottom: 10,
  },
  metrics: {
    flexDirection: "row",
    gap: 28,
    marginTop: 6,
  },
});
