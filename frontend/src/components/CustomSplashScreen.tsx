import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function CustomSplashScreen() {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoCircle}>
        <Ionicons name="medical" size={40} color="#0165FC" />
      </View>

      {/* Brand */}
      <Text style={styles.brandName}>flow</Text>
      <Text style={styles.brandTagline}>Clinics</Text>

      {/* Loading */}
      <ActivityIndicator
        size="small"
        color="#0165FC"
        style={styles.loader}
      />

      {/* Footer */}
      <Text style={styles.footer}>Healthcare at your fingertips</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFBFC",
    justifyContent: "center",
    alignItems: "center",
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  brandName: {
    fontSize: 36,
    fontWeight: "800",
    color: "#0165FC",
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 18,
    fontWeight: "300",
    color: "#64748B",
    letterSpacing: 4,
  },
  loader: {
    marginTop: 40,
  },
  footer: {
    position: "absolute",
    bottom: 50,
    color: "#94A3B8",
    fontSize: 13,
  },
});
