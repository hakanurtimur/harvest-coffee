import { createMockHarvestApi } from "@harvest/api";
import { Product } from "@harvest/domain";
import { useEffect, useState } from "react";
import { FlatList, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

const api = createMockHarvestApi();

export default function MobileHome() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    api.getProducts().then(setProducts);
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Dealer app</Text>
        <Text style={styles.title}>Quick order</Text>
      </View>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.product}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
            <View style={styles.copy}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.footer}>
                <Text style={styles.price}>GBP {item.price.toFixed(2)}</Text>
                <Pressable style={styles.button}>
                  <Text style={styles.buttonText}>Add</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f7f3",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  kicker: {
    color: "#65706a",
    fontSize: 13,
    textTransform: "uppercase",
  },
  title: {
    color: "#17201b",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 4,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  product: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#dfe4dc",
  },
  image: {
    width: "100%",
    height: 150,
  },
  copy: {
    padding: 14,
  },
  category: {
    color: "#315f83",
    fontSize: 12,
    fontWeight: "700",
  },
  name: {
    color: "#17201b",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 3,
  },
  description: {
    color: "#65706a",
    marginTop: 6,
    lineHeight: 19,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  price: {
    color: "#17201b",
    fontWeight: "800",
  },
  button: {
    backgroundColor: "#704118",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
  },
});
