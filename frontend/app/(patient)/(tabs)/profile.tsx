import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../src/context/AuthContext";

// ============================================
// MENU ITEM COMPONENT
// ============================================
const MenuItem = ({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
  danger?: boolean;
}) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.menuIcon, danger && { backgroundColor: "#FEE2E2" }]}>
      <Ionicons
        name={icon as any}
        size={18}
        color={danger ? "#EF4444" : "#0165FC"}
      />
    </View>
    <Text style={[styles.menuLabel, danger && { color: "#EF4444" }]}>
      {label}
    </Text>
    <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
  </TouchableOpacity>
);

// ============================================
// MAIN COMPONENT
// ============================================
export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [imageError, setImageError] = useState(false);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  const getInitials = () => {
    if (!user) return "?";
    return `${user.firstName?.[0] || ""}${
      user.lastName?.[0] || ""
    }`.toUpperCase();
  };

  const shouldShowImage = user?.profilePicture && !imageError;

  useEffect(() => {
    if (user?.profilePicture) {
      setImageError(false);
    }
  }, [user?.profilePicture]);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.safeAreaTop, { height: insets.top }]} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          {shouldShowImage ? (
            <Image
              source={{ uri: user.profilePicture }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
          )}
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role || "Patient"}</Text>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="person-outline"
              label="Edit Profile"
              onPress={() => router.navigate("/patient-edit-profile")}
            />
            <MenuItem
              icon="lock-closed"
              label="Change Password"
              onPress={() => router.navigate("/change-password")}
            />
            <MenuItem icon="shield-outline" label="Privacy" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="language-outline" label="Language" />
            <MenuItem icon="location-outline" label="Location" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="help-circle-outline" label="Help Center" />
            <MenuItem icon="document-text-outline" label="Terms & Privacy" />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <View style={styles.menuCard}>
            <MenuItem
              icon="log-out-outline"
              label="Logout"
              onPress={handleLogout}
              danger
            />
          </View>
        </View>

        <Text style={styles.version}>Version 1.0.0</Text>
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "white",
  },
  safeAreaTop: {
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFBFC",
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginHorizontal: 16,
    borderRadius: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F1F5F9",
    marginBottom: 12,
    overflow: "hidden",
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#0165FC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "600",
    color: "white",
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: "#F0F7FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0165FC",
    textTransform: "uppercase",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1E293B",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
  },
  version: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 11,
    marginTop: 24,
  },
});
