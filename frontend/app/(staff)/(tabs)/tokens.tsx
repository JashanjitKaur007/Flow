import { useQueue } from "@/src/context/QueueContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../src/context/AuthContext";

export default function ManageQueueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const {
    callNextTocken,
    completeCurrentToken,
    refreshActiveToken,
    refreshQueue,
    isConnected,
    // States
    isCallingNext,
    isCompleting,
    // Computed values
    currentServingNumber,
    totalPatientsInQueue,
    hasNoPatients,
    hasActiveToken,
    isTokenCompleted,
    showCompleteButton,
    showNoButtons,
    queueStatus,
    queue,
  } = useQueue();

  useFocusEffect(
    useCallback(() => {
      refreshActiveToken();
      refreshQueue();
    }, [refreshActiveToken, refreshQueue])
  );

  // If queue is inactive, show centered card
  if (queue && !queue.isActive) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centeredContainer}>
          <View style={styles.inactiveCard}>
            <View style={styles.inactiveCardHeader}>
              <View style={styles.inactiveIconWrapper}>
                <Ionicons name="pause-circle" size={48} color="#F59E0B" />
                <View style={styles.inactiveIconGlow} />
              </View>
              <Text style={styles.inactiveTitle}>
                Queue is Currently Paused
              </Text>
            </View>
            <View style={styles.inactiveContent}>
              <View style={styles.inactiveInfoRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#92400E"
                />
                <Text style={styles.inactiveText}>
                  The queue for this clinic is not active. Start the queue from
                  the home page to begin serving patients.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.inactiveActionButton}
                onPress={() => router.push("/")}
                activeOpacity={0.8}
              >
                <Ionicons name="home-outline" size={18} color="white" />
                <Text style={styles.inactiveActionText}>Go to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badge */}
        {queue && queue.isActive && (
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                isTokenCompleted && styles.statusBadgeCompleted,
                !isConnected && styles.statusBadgeDisconnected,
              ]}
            >
              <View style={styles.statusBadgeContent}>
                <View
                  style={[
                    styles.statusDotContainer,
                    isConnected && !isTokenCompleted
                      ? styles.statusDotContainerActive
                      : styles.statusDotContainerInactive,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      isConnected && !isTokenCompleted
                        ? styles.statusDotActive
                        : styles.statusDotInactive,
                    ]}
                  />
                  {isConnected && !isTokenCompleted && (
                    <View style={styles.statusDotPulse} />
                  )}
                </View>
                <Text
                  style={[
                    styles.statusText,
                    isTokenCompleted && styles.statusTextCompleted,
                    !isConnected && styles.statusTextDisconnected,
                  ]}
                >
                  {isConnected
                    ? isTokenCompleted
                      ? "Queue Completed"
                      : "Live Updates"
                    : "Connecting..."}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Main Token Display Card */}
        {queue && queue.isActive && (
          <View style={styles.tokenCard}>
            {/* Status Badge inside card */}
            <View
              style={[
                styles.cardStatusBadge,
                hasActiveToken
                  ? styles.cardStatusBadgeActive
                  : styles.cardStatusBadgeInactive,
              ]}
            >
              <Ionicons
                name={hasActiveToken ? "time" : "checkmark-circle"}
                size={14}
                color="white"
              />
              <Text style={styles.cardStatusText}>
                {hasActiveToken ? "Now Serving" : "No Patients Waiting"}
              </Text>
            </View>

            {/* Token Number Display */}
            <View style={styles.tokenNumberContainer}>
              <Text style={styles.tokenLabel}>Token Number</Text>
              <View
                style={[
                  styles.tokenCircle,
                  hasActiveToken
                    ? styles.tokenCircleActive
                    : styles.tokenCircleInactive,
                ]}
              >
                <Text style={styles.tokenNumber}>{currentServingNumber}</Text>
              </View>
            </View>

            {/* Queue Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, styles.statIconBlue]}>
                  <Ionicons name="people-outline" size={18} color="#0165FC" />
                </View>
                <Text style={styles.statValue}>{totalPatientsInQueue}</Text>
                <Text style={styles.statLabel}>Waiting</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, styles.statIconGreen]}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#10B981"
                  />
                </View>
                <Text style={styles.statValue}>
                  {queueStatus?.currentTokenNo || 0}
                </Text>
                <Text style={styles.statLabel}>Served</Text>
              </View>
            </View>
          </View>
        )}

        {/* Info Card: Show when no patients waiting and token is being served */}
        {showCompleteButton && (
          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="information-circle" size={24} color="#0165FC" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>No More Patients Waiting</Text>
              <Text style={styles.infoText}>
                This is the last patient in the queue. Complete the current
                token when finished.
              </Text>
            </View>
          </View>
        )}

        {/* Buttons: Only show when there are patients OR when completing last token AND queue is active */}
        {queue && queue.isActive && !showNoButtons && (
          <View style={styles.actionsContainer}>
            {/* Call Next Button: Only show when there are patients waiting */}
            {!hasNoPatients && (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (isCallingNext || !isConnected) && styles.buttonDisabled,
                ]}
                onPress={callNextTocken}
                disabled={isCallingNext || !isConnected}
                activeOpacity={0.8}
              >
                {isCallingNext ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="megaphone-outline"
                      size={22}
                      color="white"
                      style={{ marginRight: 10 }}
                    />
                    <Text style={styles.primaryButtonText}>
                      Call Next Token
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Complete Button: Show when no patients waiting and token is being served */}
            {showCompleteButton && (
              <TouchableOpacity
                style={[
                  styles.completeButton,
                  (isCompleting || !isConnected) && styles.buttonDisabled,
                ]}
                onPress={completeCurrentToken}
                disabled={isCompleting || !isConnected}
                activeOpacity={0.8}
              >
                {isCompleting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={22}
                      color="white"
                      style={{ marginRight: 10 }}
                    />
                    <Text style={styles.completeButtonText}>
                      Complete Current Token
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFBFC",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusContainer: {
    marginBottom: 24,
    alignItems: "center",
  },
  statusBadge: {
    backgroundColor: "#DEF7EC",
    borderRadius: 16,
    padding: 0,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: "hidden",
  },
  statusBadgeCompleted: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
    shadowColor: "#EF4444",
  },
  statusBadgeDisconnected: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
    shadowColor: "#EF4444",
  },
  statusBadgeContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 10,
  },
  statusDotContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  statusDotContainerActive: {
    backgroundColor: "#ECFDF5",
  },
  statusDotContainerInactive: {
    backgroundColor: "#FEE2E2",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 2,
  },
  statusDotActive: {
    backgroundColor: "#10B981",
  },
  statusDotInactive: {
    backgroundColor: "#EF4444",
  },
  statusDotPulse: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    opacity: 0.3,
    zIndex: 1,
  },
  statusText: {
    color: "#047857",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  statusTextCompleted: {
    color: "#EF4444",
  },
  statusTextDisconnected: {
    color: "#EF4444",
  },
  tokenCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 24,
  },
  cardStatusBadgeActive: {
    backgroundColor: "#0165FC",
  },
  cardStatusBadgeInactive: {
    backgroundColor: "#10B981",
  },
  cardStatusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  tokenNumberContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  tokenLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  tokenCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0165FC",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  tokenCircleActive: {
    backgroundColor: "#0165FC",
  },
  tokenCircleInactive: {
    backgroundColor: "#10B981",
  },
  tokenNumber: {
    fontSize: 72,
    fontWeight: "800",
    color: "white",
    letterSpacing: -2,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statIconBlue: {
    backgroundColor: "#F0F7FF",
  },
  statIconGreen: {
    backgroundColor: "#DEF7EC",
  },
  statValue: {
    fontSize: 28,
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
    backgroundColor: "#F1F5F9",
    marginHorizontal: 16,
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
  actionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#0165FC",
    paddingVertical: 18,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0165FC",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  completeButton: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#10B981",
    paddingVertical: 18,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  secondaryButton: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "white",
    paddingVertical: 18,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#EF4444",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  completeButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  secondaryButtonText: {
    color: "#EF4444",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  inactiveCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 0,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FEF3C7",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    overflow: "hidden",
  },
  inactiveCardHeader: {
    backgroundColor: "#FFFBEB",
    padding: 28,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#FEF3C7",
  },
  inactiveIconWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  inactiveIconGlow: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F59E0B",
    opacity: 0.15,
    top: -8,
    left: -8,
  },
  inactiveContent: {
    padding: 24,
    gap: 20,
  },
  inactiveInfoRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  inactiveTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#92400E",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  inactiveText: {
    flex: 1,
    fontSize: 14,
    color: "#78350F",
    lineHeight: 22,
    fontWeight: "500",
  },
  inactiveActionButton: {
    flexDirection: "row",
    backgroundColor: "#F59E0B",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  inactiveActionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
