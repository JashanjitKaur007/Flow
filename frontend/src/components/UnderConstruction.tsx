import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface UnderConstructionProps {
  title?: string;
  showBackButton?: boolean;
}

export const UnderConstruction = ({
  title = "Under Construction",
  showBackButton = true,
}: UnderConstructionProps) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="construct" size={80} color="#0165FC" />
      </View>

      <Text style={styles.title}>{title}</Text>

      <Text style={styles.subtitle}>
        We're currently working on this feature.{"\n"}
        Stay tuned for updates! 🚧
      </Text>

      {showBackButton && (
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFBFC",
    padding: 24,
  },
  iconContainer: {
    width: 160,
    height: 160,
    backgroundColor: "#EFF6FF",
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 6,
    borderColor: "white",
    shadowColor: "#0165FC",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#1E293B", // Dark color for secondary actions
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
