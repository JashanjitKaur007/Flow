import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../src/context/AuthContext";
import { useStaffHomeViewModel } from "../../../src/viewmodels/StaffHomeViewModel";

export default function StaffHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [imageError, setImageError] = useState(false);

  const {
    clinic,
    queue,
    queueStatus,
    isLoading,
    loadQueue,
    toggleQueueStatus,
  } = useStaffHomeViewModel();

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // ============================================
  // LOGIC
  // ============================================
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getInitials = () => {
    if (!user) return "?";
    return `${user.firstName?.[0] || ""}${
      user.lastName?.[0] || ""
    }`.toUpperCase();
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getQueueDuration = () => {
    if (!queue?.startTime) return "N/A";
    const start = new Date(queue.startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const waitingCount = queueStatus?.waitingCount || 0;
  const currentTokenNo = queueStatus?.currentTokenNo || 0;
  const lastServedTokenNumber = queueStatus?.lastServedTokenNumber || 0;
  const estimatedWaitTime = queueStatus?.estimatedWaitTime || 0;

  const formatClinicType = (type?: string) => {
    if (!type) return "Clinic";
    return type.replace(/_/g, " ");
  };

  const handleToggleQueue = () => {
    if (!queue) {
      // Initialize queue if it doesn't exist
      toggleQueueStatus(true);
    } else {
      // Toggle between start/pause
      toggleQueueStatus(!queue.isActive);
    }
  };

  const navigateToTokens = () => {
    router.push("/(staff)/(tabs)/tokens");
  };

  const openDirections = () => {
    if (!clinic || !clinic.latitude || !clinic.longitude) return;

    const { latitude, longitude } = clinic;
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&dirflg=d`,
      android: `google.navigation:q=${latitude},${longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    });

    Linking.openURL(url).catch((err) => {
      console.error("Failed to open maps:", err);
      // Fallback to web maps
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
      );
    });
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. GREETING HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push("/(staff)/(tabs)/profile")}
            activeOpacity={0.8}
          >
            <Ionicons name="person-circle" size={40} color="#0165FC" />
          </TouchableOpacity>
        </View>

        {/* 2. STATISTICS CARDS */}
        {queue && (
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="people" size={24} color="#0165FC" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{waitingCount}</Text>
                <Text style={styles.statLabel}>Waiting</Text>
              </View>
            </View>

            <View style={[styles.statCard, styles.statCardSuccess]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{lastServedTokenNumber}</Text>
                <Text style={styles.statLabel}>Served</Text>
              </View>
            </View>
          </View>
        )}

        {/* 3. WORKPLACE CARD */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Workplace</Text>

          <View style={styles.clinicCard}>
            {/* Clinic Info Header with Gradient Background */}
            <View style={styles.clinicHeaderContainer}>
              {clinic ? (
                <>
                  <View style={styles.clinicHeaderTop}>
                    <View style={styles.clinicIconBox}>
                      <Ionicons name="medkit" size={32} color="#0165FC" />
                    </View>
                    <View style={styles.clinicInfo}>
                      <Text style={styles.clinicName}>{clinic.name}</Text>
                      {clinic.type && (
                        <View style={styles.clinicBadge}>
                          <Ionicons
                            name="business-outline"
                            size={12}
                            color="#0165FC"
                            style={{ marginRight: 4 }}
                          />
                          <Text style={styles.clinicBadgeText}>
                            {formatClinicType(clinic.type)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Clinic Details Grid */}
                  <View style={styles.clinicDetailsGrid}>
                    {clinic.address && (
                      <View style={styles.clinicDetailItem}>
                        <View style={styles.clinicDetailIcon}>
                          <Ionicons
                            name="location-outline"
                            size={18}
                            color="#64748B"
                          />
                        </View>
                        <Text style={styles.clinicDetailText} numberOfLines={2}>
                          {clinic.address}
                        </Text>
                        {clinic.latitude && clinic.longitude && (
                          <TouchableOpacity
                            style={styles.directionsButton}
                            onPress={openDirections}
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name="navigate"
                              size={18}
                              color="#0165FC"
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                    {clinic.phone && (
                      <View style={styles.clinicDetailItem}>
                        <View style={styles.clinicDetailIcon}>
                          <Ionicons
                            name="call-outline"
                            size={18}
                            color="#64748B"
                          />
                        </View>
                        <Text style={styles.clinicDetailText}>
                          {clinic.phone}
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              ) : (
                <View style={styles.clinicHeaderTop}>
                  <View style={styles.clinicIconBox}>
                    <ActivityIndicator color="#0165FC" size="small" />
                  </View>
                  <View style={styles.clinicInfo}>
                    <Text style={styles.clinicName}>Loading clinic...</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Queue Status Section */}
            {queue && (
              <View style={styles.queueStatusSection}>
                <View
                  style={[
                    styles.statusIndicator,
                    queue.isActive
                      ? styles.statusIndicatorActive
                      : styles.statusIndicatorInactive,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      queue.isActive
                        ? styles.statusDotActive
                        : styles.statusDotInactive,
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      queue.isActive
                        ? styles.statusTextActive
                        : styles.statusTextInactive,
                    ]}
                  >
                    {queue.isActive ? "Queue Active" : "Queue Paused"}
                  </Text>
                </View>
              </View>
            )}

            {/* Action Button */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                queue?.isActive
                  ? styles.actionButtonPause
                  : styles.actionButtonStart,
                isLoading && styles.actionButtonDisabled,
              ]}
              onPress={handleToggleQueue}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons
                    name={queue?.isActive ? "pause-circle" : "play-circle"}
                    size={24}
                    color="white"
                  />
                  <Text style={styles.actionButtonText}>
                    {queue?.isActive
                      ? "Pause Queue"
                      : queue
                      ? "Start Queue"
                      : "Start Daily Queue"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. QUICK ACTIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={navigateToTokens}
              activeOpacity={0.95}
            >
              <View
                style={[styles.quickActionIcon, styles.quickActionIconBlue]}
              >
                <Ionicons name="list" size={24} color="#0165FC" />
              </View>
              <Text style={styles.quickActionText}>Manage Queue</Text>
              <Text style={styles.quickActionSubtext}>
                View & manage tokens
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push("/(staff)/(tabs)/profile")}
              activeOpacity={0.95}
            >
              <View
                style={[styles.quickActionIcon, styles.quickActionIconPurple]}
              >
                <Ionicons name="person" size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.quickActionText}>Profile</Text>
              <Text style={styles.quickActionSubtext}>View your profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. TODAY'S SUMMARY */}
        {queue && queue.isActive && queueStatus && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Summary</Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {waitingCount + lastServedTokenNumber}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Patients</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {waitingCount > 0
                      ? Math.round(estimatedWaitTime / waitingCount)
                      : 0}
                  </Text>
                  <Text style={styles.summaryLabel}>Avg Wait Time</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFBFC",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 0,
  },

  // HEADER STYLES
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 16,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 15,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "500",
  },
  userName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: -0.5,
  },
  profileBtn: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: "white",
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0165FC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },

  // STATISTICS
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
  },
  statCardPrimary: {
    borderColor: "#E0F2FE",
    backgroundColor: "#F0F9FF",
  },
  statCardSuccess: {
    borderColor: "#D1FAE5",
    backgroundColor: "#ECFDF5",
  },
  statCardWarning: {
    borderColor: "#FEF3C7",
    backgroundColor: "#FFFBEB",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // SECTION STYLES
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },

  // CLINIC CARD STYLES
  clinicCard: {
    backgroundColor: "white",
    borderRadius: 28,
    padding: 0,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    overflow: "hidden",
  },
  clinicHeaderContainer: {
    backgroundColor: "#F8FAFC",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  clinicHeaderTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  clinicIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0165FC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E0F2FE",
  },
  clinicInfo: {
    flex: 1,
    marginLeft: 14,
    paddingTop: 2,
  },
  clinicName: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 10,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  clinicBadge: {
    alignSelf: "flex-start",
    backgroundColor: "white",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
  clinicBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0165FC",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  clinicDetailsGrid: {
    gap: 14,
    paddingTop: 4,
  },
  clinicDetailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  clinicDetailIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    flexShrink: 0,
  },
  clinicDetailText: {
    flex: 1,
    fontSize: 14,
    color: "#475569",
    fontWeight: "500",
    lineHeight: 20,
  },
  directionsButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
  queueStatusSection: {
    padding: 20,
    backgroundColor: "white",
    paddingTop: 16,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusIndicatorActive: {
    backgroundColor: "#DEF7EC",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  statusIndicatorInactive: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: "#10B981",
  },
  statusDotInactive: {
    backgroundColor: "#F59E0B",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  statusTextActive: {
    color: "#047857",
  },
  statusTextInactive: {
    color: "#92400E",
  },

  // BUTTON STYLES
  actionButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: "#0165FC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  actionButtonStart: {
    backgroundColor: "#0165FC",
  },
  actionButtonPause: {
    backgroundColor: "#F59E0B",
    shadowColor: "#F59E0B",
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // QUICK ACTIONS
  actionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickActionIconBlue: {
    backgroundColor: "#F0F9FF",
  },
  quickActionIconPurple: {
    backgroundColor: "#F5F3FF",
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
    textAlign: "center",
  },
  quickActionSubtext: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },

  // SUMMARY
  summaryCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 20,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
});
