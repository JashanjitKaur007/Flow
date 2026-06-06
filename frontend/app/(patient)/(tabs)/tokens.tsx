import { TokenStatus } from "@/src/models/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect } from "react";
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { useQueue } from "../../../src/context/QueueContext";

export default function TokensScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    activeToken,
    queueStatus,
    leaveQueue,
    isConnected,
    refreshActiveToken,
  } = useQueue();

  // Refresh active token when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!activeToken) {
        refreshActiveToken();
      }
    }, [activeToken, refreshActiveToken])
  );

  useEffect(() => {
    if (!queueStatus || !activeToken) return;
    if (queueStatus.currentTokenNo > activeToken.tokenNumber) {
      refreshActiveToken();
      toast.success("Congratulations 🎉! Your token has been completed. ");
    }
  }, [queueStatus, activeToken]);

  // Also refresh when component mounts
  useEffect(() => {
    refreshActiveToken();
  }, [refreshActiveToken]);

  const handleLeaveQueue = () => {
    Alert.alert(
      "Leave Queue",
      "Are you sure you want to leave? You'll lose your position.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: leaveQueue },
      ]
    );
  };

  // Empty State
  if (!activeToken) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top + 20 }]}>
        <View style={styles.emptyIconContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="ticket-outline" size={64} color="#0165FC" />
          </View>
        </View>
        <Text style={styles.emptyTitle}>No Active Token</Text>
        <Text style={styles.emptySubtitle}>
          You're not in any queue right now.{"\n"}Find a clinic to join the
          queue.
        </Text>
        <TouchableOpacity
          style={styles.findBtn}
          onPress={() => router.push("/(patient)/(tabs)/map")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="search"
            size={20}
            color="white"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.findBtnText}>Find Clinics</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const peopleAhead = queueStatus
    ? Math.max(0, activeToken.tokenNumber - queueStatus.currentTokenNo - 1)
    : 0;

  const isYourTurn = activeToken.status === "CALLED";
  const progressPercentage = queueStatus?.currentTokenNo
    ? Math.min(
        100,
        (queueStatus.currentTokenNo / activeToken.tokenNumber) * 100 || 0
      )
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + 20 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Connection Status Badge */}
      <View style={styles.connectionContainer}>
        <View
          style={[
            styles.connectionBadge,
            { backgroundColor: isConnected ? "#10B98115" : "#EF444415" },
          ]}
        >
          <View
            style={[
              styles.connectionDot,
              { backgroundColor: isConnected ? "#10B981" : "#EF4444" },
            ]}
          />
          <Text
            style={[
              styles.connectionText,
              { color: isConnected ? "#10B981" : "#EF4444" },
            ]}
          >
            {isConnected ? "Live Updates" : "Connecting..."}
          </Text>
        </View>
      </View>

      {/* Main Token Card */}
      <View style={styles.tokenCard}>
        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isYourTurn ? "#10B981" : "#0165FC",
            },
          ]}
        >
          <Ionicons
            name={isYourTurn ? "checkmark-circle" : "time"}
            size={16}
            color="white"
          />
          <Text style={styles.statusText}>
            {isYourTurn ? "Your Turn!" : "Waiting in Queue"}
          </Text>
        </View>

        {/* Token Number Display */}
        <View style={styles.tokenNumberContainer}>
          <Text style={styles.tokenLabel}>Token Number</Text>
          <View
            style={[
              styles.tokenCircle,
              {
                backgroundColor: isYourTurn ? "#10B981" : "#0165FC",
                shadowColor: isYourTurn ? "#10B981" : "#0165FC",
              },
            ]}
          >
            <Text style={styles.tokenNumber}>{activeToken.tokenNumber}</Text>
          </View>
        </View>

        {/* Queue Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="person" size={20} color="#0165FC" />
            </View>
            <Text style={styles.statValue}>
              {queueStatus?.currentTokenNo || "-"}
            </Text>
            <Text style={styles.statLabel}>Now Serving</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="people" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{peopleAhead}</Text>
            <Text style={styles.statLabel}>Ahead of You</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Queue Progress</Text>
            <Text style={styles.progressPercentage}>
              {Math.round(progressPercentage)}%
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                  backgroundColor: isYourTurn ? "#10B981" : "#0165FC",
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Info Card */}
      {activeToken.status === TokenStatus.WAITING && (
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="information-circle" size={24} color="#0165FC" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Stay Nearby</Text>
            <Text style={styles.infoText}>
              We'll notify you when it's your turn. Make sure your notifications
              are enabled.
            </Text>
          </View>
        </View>
      )}

      {activeToken.status === TokenStatus.CALLED && (
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="information-circle" size={24} color="#0165FC" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>You're Called!</Text>
            <Text style={styles.infoText}>
              Please proceed to the clinic. To meet your doctor.
            </Text>
          </View>
        </View>
      )}

      {/* Leave Button */}
      {activeToken.status === TokenStatus.WAITING && (
        <TouchableOpacity
          style={styles.leaveBtn}
          onPress={handleLeaveQueue}
          activeOpacity={0.8}
        >
          <Ionicons name="exit-outline" size={20} color="#EF4444" />
          <Text style={styles.leaveBtnText}>Leave Queue</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFBFC",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#FAFBFC",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#0165FC20",
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 24,
  },
  findBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0165FC",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#0165FC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  findBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  connectionContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  connectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tokenCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 24,
  },
  statusText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  tokenNumberContainer: {
    alignItems: "center",
    marginBottom: 32,
    width: "100%",
  },
  tokenLabel: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 12,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  tokenCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  tokenNumber: {
    fontSize: 56,
    fontWeight: "800",
    color: "white",
    letterSpacing: 2,
  },
  statsContainer: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 28,
    justifyContent: "space-around",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 8,
  },
  progressSection: {
    width: "100%",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0165FC",
  },
  progressTrack: {
    width: "100%",
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#F0F7FF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#0165FC15",
  },
  infoIconContainer: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 20,
  },
  leaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EF4444",
    gap: 8,
  },
  leaveBtnText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
  },
});
