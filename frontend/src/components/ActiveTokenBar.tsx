import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueue } from "../context/QueueContext";

export const ActiveTokenBar = () => {
  const { activeToken, queueStatus, isConnected } = useQueue();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!activeToken) return null;

  const isYourTurn = activeToken.status === "CALLED";
  const peopleAhead = queueStatus
    ? Math.max(0, activeToken.tokenNumber - queueStatus.currentTokenNo - 1)
    : 0;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isYourTurn && styles.containerActive,
        { bottom: Math.max(insets.bottom, 8) + 75, right: 16 },
      ]}
      onPress={() => router.push("/(patient)/(tabs)/tokens")}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={isYourTurn ? "checkmark-circle" : "ticket"}
          size={24}
          color="white"
        />
      </View>
      {isYourTurn && (
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
        </View>
      )}
      {peopleAhead > 0 && !isYourTurn && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{peopleAhead}</Text>
        </View>
      )}
      {!isConnected && (
        <View style={styles.disconnectedBadge}>
          <View style={styles.disconnectedDot} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#0165FC",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0165FC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  containerActive: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "white",
  },
  countBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F59E0B",
    borderWidth: 2,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  countText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  disconnectedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  disconnectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "white",
  },
});

export default ActiveTokenBar;
