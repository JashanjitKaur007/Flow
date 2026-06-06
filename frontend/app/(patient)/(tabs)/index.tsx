import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FilterBottomSheet } from "../../../src/components/FilterBottomSheet";
import { useAuth } from "../../../src/context/AuthContext";
import { Clinic, ClinicType, ClinicTypeValue } from "../../../src/models/types";
import { useHomeViewModel } from "../../../src/viewmodels/useHomeViewModel";

// ============================================
// CLINIC TYPE FILTERS
// ============================================
const CLINIC_TYPES: { label: string; value: ClinicTypeValue | null }[] = [
  { label: "All", value: null },
  { label: "General Practice", value: ClinicType.GENERAL_PRACTICE },
  { label: "Pediatrics", value: ClinicType.PEDIATRICS },
  { label: "Dermatology", value: ClinicType.DERMATOLOGY },
  { label: "Psychiatry", value: ClinicType.PSYCHIATRY },
  { label: "Gynecology", value: ClinicType.GYNECOLOGY },
  { label: "Orthopedics", value: ClinicType.ORTHOPEDICS },
  { label: "ENT", value: ClinicType.ENT },
  { label: "Dentist", value: ClinicType.DENTIST },
];

// ============================================
// CLINIC CARD COMPONENT
// ============================================
const ClinicCard = ({
  clinic,
  onPress,
}: {
  clinic: Clinic;
  onPress: () => void;
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "GENERAL_PRACTICE":
        return "#0165FC";
      case "PEDIATRICS":
        return "#F59E0B";
      case "DERMATOLOGY":
        return "#EC4899";
      case "PSYCHIATRY":
        return "#6366F1";
      case "GYNECOLOGY":
        return "#F43F5E";
      case "ORTHOPEDICS":
        return "#14B8A6";
      case "ENT":
        return "#8B5CF6";
      case "DENTIST":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  const color = getTypeColor(clinic.type);

  return (
    <TouchableOpacity
      style={styles.clinicCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Avatar */}
      <View style={[styles.clinicAvatar, { backgroundColor: `${color}15` }]}>
        {clinic.logo ? (
          <Image source={{ uri: clinic.logo }} style={styles.clinicLogo} />
        ) : (
          <Ionicons name="medical" size={22} color={color} />
        )}
      </View>

      {/* Info */}
      <View style={styles.clinicInfo}>
        <Text style={styles.clinicName} numberOfLines={1}>
          {clinic.name}
        </Text>
        <View style={[styles.typeBadge, { backgroundColor: `${color}15` }]}>
          <Text style={[styles.typeBadgeText, { color }]}>
            {clinic.type.replace("_", " ")}
          </Text>
        </View>
        {clinic.openingHours && (
          <View style={styles.clinicMeta}>
            <Ionicons name="time-outline" size={12} color="#94A3B8" />
            <Text style={styles.metaText}>
              {clinic.openingHours.start} - {clinic.openingHours.end}
            </Text>
          </View>
        )}
      </View>

      {/* Distance */}
      <View style={styles.distanceContainer}>
        {clinic.distance_km != null && (
          <Text style={styles.distanceText}>
            {clinic.distance_km.toFixed(1)} km
          </Text>
        )}
        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// TYPE FILTER CHIP
// ============================================
const TypeChip = ({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.filterChip, isActive && styles.filterChipActive]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ============================================
// MAIN COMPONENT
// ============================================
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    clinics,
    loading,
    refreshing,
    loadingMore,
    onRefresh,
    loadMore,
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    // Filters
    radius,
    setRadius,
    showAllClinics,
    setShowAllClinics,
    showFilters,
    setShowFilters,
    applyFilters,
  } = useHomeViewModel();

  const renderClinic = useCallback(
    ({ item }: { item: Clinic }) => (
      <ClinicCard
        clinic={item}
        onPress={() =>
          router.push({
            pathname: `/clinic-details/${item.id}`,
            params: { distance: item.distance_km?.toString() },
          } as any)
        }
      />
    ),
    [router]
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const renderListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="medical-outline" size={48} color="#CBD5E1" />
      <Text style={styles.emptyTitle}>No Clinics Found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your search or filters
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => setShowFilters(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.emptyButtonText}>Open Filters</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.userName}>{user?.firstName || "Guest"}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push("/(patient)/(tabs)/profile")}
            activeOpacity={0.8}
          >
            <Ionicons name="person-circle" size={40} color="#0165FC" />
          </TouchableOpacity>
        </View>

        {/* Search Row */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search clinics..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilters(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={20} color="#0165FC" />
          </TouchableOpacity>
        </View>

        {/* Filter Status */}
        <View style={styles.filterStatus}>
          <Text style={styles.filterStatusText}>
            {showAllClinics
              ? `Showing all clinics (${clinics.length})`
              : `Within ${radius} km (${clinics.length} clinics)`}
          </Text>
        </View>

        {/* Type Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        >
          {CLINIC_TYPES.map((item) => (
            <TypeChip
              key={item.label}
              label={item.label}
              isActive={selectedType === item.value}
              onPress={() => setSelectedType(item.value)}
            />
          ))}
        </ScrollView>

        {/* Section Title */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            {showAllClinics ? "All Clinics" : "Nearby Clinics"}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(patient)/(tabs)/map")}
            activeOpacity={0.8}
          >
            <Text style={styles.mapLink}>View Map</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Clinic List */}
      {loading && !refreshing ? (
        <View style={styles.listLoadingContainer}>
          <ActivityIndicator size="large" color="#0165FC" />
          <Text style={styles.listLoadingText}>Finding clinics...</Text>
        </View>
      ) : (
        <FlatList
          data={clinics}
          renderItem={renderClinic}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderListEmpty}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#0165FC" />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0165FC"
              colors={["#0165FC"]}
            />
          }
        />
      )}

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        radius={radius}
        setRadius={setRadius}
        showAllClinics={showAllClinics}
        setShowAllClinics={setShowAllClinics}
        onApply={applyFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    backgroundColor: "#FAFBFC",
  },
  listLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  listLoadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
    paddingTop: 8,
  },
  loadingMoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 13,
    color: "#64748B",
  },
  fixedHeader: {
    paddingHorizontal: 16,
    backgroundColor: "#FAFBFC",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 12,
  },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  greeting: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
  },
  profileBtn: {
    padding: 4,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#1E293B",
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  filterStatus: {
    marginBottom: 12,
  },
  filterStatusText: {
    fontSize: 12,
    color: "#64748B",
  },
  filterList: {
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: {
    backgroundColor: "#0165FC",
    borderColor: "#0165FC",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
  },
  filterTextActive: {
    color: "white",
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  mapLink: {
    fontSize: 13,
    fontWeight: "500",
    color: "#0165FC",
  },
  clinicCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  clinicAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  clinicLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  clinicInfo: {
    flex: 1,
    marginLeft: 12,
  },
  clinicName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  clinicMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 11,
    color: "#94A3B8",
    marginLeft: 4,
  },
  distanceContainer: {
    alignItems: "flex-end",
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0165FC",
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 4,
  },
  emptyButton: {
    marginTop: 16,
    backgroundColor: "#0165FC",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});
