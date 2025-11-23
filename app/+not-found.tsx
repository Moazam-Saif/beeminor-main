import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Page introuvable" }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🐝</Text>
        <Text style={styles.title}>Cette page n&apos;existe pas</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Retour à la ruche</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: '#FFF8DC',
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: '#8B4513',
    marginBottom: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
    paddingHorizontal: 30,
    backgroundColor: '#FF8C00',
    borderRadius: 20,
  },
  linkText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold" as const,
  },
});
