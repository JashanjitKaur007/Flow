import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FilterBottomSheet } from "../../../src/components/FilterBottomSheet";
import { Clinic } from "../../../src/models/types";
import { useMapViewModel } from "../../../src/viewmodels/useMapViewModel";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_MARGIN = 10;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN;

// ============================================
// SIMPLE CLINIC CARD
// ============================================
const ClinicCard = ({
  clinic,
  isSelected,
  onViewDetails,
  onPress,
}: {
  clinic: Clinic;
  isSelected: boolean;
  onViewDetails: () => void;
  onPress: () => void;
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "DENTIST":
        return "#10B981";
      case "PEDIATRICS":
        return "#F59E0B";
      case "DERMATOLOGY":
        return "#EC4899";
      case "ENT":
        return "#8B5CF6";
      default:
        return "#0165FC";
    }
  };

  const handleDirections = () => {
    const lat = clinic.latitude;
    const lng = clinic.longitude;
    const label = encodeURIComponent(clinic.name);

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
    });

    if (url) {
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            Linking.openURL(
              `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
            );
          }
        })
        .catch(() => {
          Linking.openURL(
            `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
          );
        });
    }
  };

  const color = getTypeColor(clinic.type);

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Top accent bar */}
      <View style={[styles.cardAccent, { backgroundColor: color }]} />

      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
            <Ionicons name="medical" size={20} color={color} />
          </View>
          <View style={styles.cardTitleSection}>
            <Text style={styles.cardName} numberOfLines={1}>
              {clinic.name}
            </Text>
            <Text style={[styles.cardType, { color }]}>
              {clinic.type.replace("_", " ")}
            </Text>
          </View>
        </View>

        {/* Info Row */}
        <View style={styles.cardInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="location" size={14} color="#64748B" />
            <Text style={styles.infoText}>
              {clinic.distance_km
                ? `${clinic.distance_km.toFixed(1)} km`
                : "Nearby"}
            </Text>
          </View>
          {clinic.openingHours && (
            <View style={styles.infoItem}>
              <Ionicons name="time" size={14} color="#64748B" />
              <Text style={styles.infoText}>
                {clinic.openingHours.start} - {clinic.openingHours.end}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.cardButtonRow}>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={onViewDetails}
            activeOpacity={0.8}
          >
            <Text style={styles.cardButtonText}>View Clinic</Text>
            <Ionicons name="chevron-forward" size={16} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.directionsIconBtn}
            onPress={handleDirections}
            activeOpacity={0.8}
          >
            <Ionicons name="navigate-outline" size={18} color="#0165FC" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// MAIN MAP SCREEN
// ============================================
export default function MapScreen() {
  const router = useRouter();
  const {
    clinics,
    selectedClinicId,
    initialRegion,
    loading,
    permissionGranted,
    mapRef,
    focusOnClinic,
    focusOnUser,
    onCardScrollEnd,
    // Filters
    radius,
    setRadius,
    showAllClinics,
    setShowAllClinics,
    showFilters,
    setShowFilters,
    applyFilters,
  } = useMapViewModel();

  const insets = useSafeAreaInsets();

  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].item?.id) {
        onCardScrollEnd(viewableItems[0].index || 0);
      }
    },
    [onCardScrollEnd]
  );

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 60,
  });

  const handleMarkerPress = useCallback(
    (clinicId: string) => {
      const index = clinics.findIndex((c) => c.id === clinicId);
      if (index !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
      }
      focusOnClinic(clinicId);
    },
    [clinics, focusOnClinic]
  );

  const handleViewDetails = useCallback(
    (clinic: Clinic) => {
      // Navigate to clinic details screen with distance
      router.push({
        pathname: `/clinic-details/${clinic.id}`,
        params: { distance: clinic.distance_km?.toString() },
      } as any);
    },
    [router]
  );

  const handleCardPress = useCallback(
    (clinic: Clinic) => {
      focusOnClinic(clinic.id);
      // Scroll to the card in the FlatList
      const index = clinics.findIndex((c) => c.id === clinic.id);
      if (index !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
      }
    },
    [focusOnClinic, clinics]
  );

  const renderCard = useCallback(
    ({ item }: { item: Clinic }) => (
      <ClinicCard
        clinic={item}
        isSelected={selectedClinicId === item.id}
        onViewDetails={() => handleViewDetails(item)}
        onPress={() => handleCardPress(item)}
      />
    ),
    [selectedClinicId, handleViewDetails, handleCardPress]
  );

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={permissionGranted}
        showsMyLocationButton={false}
        mapPadding={{ top: 0, right: 0, bottom: 180, left: 0 }}
      >
        {clinics.map((clinic) => (
          <Marker
            key={clinic.id}
            coordinate={{
              latitude: clinic.latitude,
              longitude: clinic.longitude,
            }}
            onPress={() => handleMarkerPress(clinic.id)}
          >
            <View style={styles.markerWrapper}>
              <View
                style={[
                  styles.marker,
                  selectedClinicId === clinic.id && styles.markerSelected,
                ]}
              >
                <Ionicons
                  name="medical"
                  size={selectedClinicId === clinic.id ? 16 : 14}
                  color="white"
                />
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Header Bar */}
      <View style={[styles.header, { marginTop: insets.top }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {showAllClinics ? "All Clinics" : "Nearby Clinics"}
        </Text>
        <TouchableOpacity
          style={[styles.headerBtn, showFilters && styles.headerBtnActive]}
          onPress={() => setShowFilters(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="options-outline"
            size={22}
            color={showFilters ? "#0165FC" : "#1E293B"}
          />
        </TouchableOpacity>
      </View>

      {/* Loading Indicator Card */}
      {loading && (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="small" color="#0165FC" />
          <Text style={styles.loadingCardText}>Finding clinics...</Text>
        </View>
      )}

      {/* Filter Status Badge */}
      {!loading && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>
            {showAllClinics
              ? `${clinics.length} clinics`
              : `${clinics.length} within ${radius} km`}
          </Text>
        </View>
      )}

      {/* My Location Button */}
      <TouchableOpacity
        style={[
          styles.locationBtn,
          {
            right: clinics.length > 0 ? 16 : 0,
            bottom: clinics.length > 0 ? 200 : 250,
          },
        ]}
        activeOpacity={0.8}
        onPress={focusOnUser}
      >
        <Ionicons name="locate" size={22} color="#0165FC" />
      </TouchableOpacity>

      {/* Cards Carousel */}
      {clinics.length > 0 ? (
        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={clinics}
            renderItem={renderCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={SNAP_INTERVAL}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig.current}
            getItemLayout={(_, index) => ({
              length: SNAP_INTERVAL,
              offset: SNAP_INTERVAL * index,
              index,
            })}
          />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="medical-outline" size={40} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No clinics found</Text>
          <Text style={styles.emptyText}>
            Try increasing the radius or showing all clinics
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowFilters(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyButtonText}>Open Filters</Text>
          </TouchableOpacity>
        </View>
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
  },
  loadingCard: {
    position: "absolute",
    top: 115,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    gap: 10,
  },
  loadingCardText: {
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "500",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerBtnActive: {
    backgroundColor: "#E0EDFF",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 12,
  },
  filterBadge: {
    position: "absolute",
    top: 140,
    alignSelf: "center",
    backgroundColor: "rgba(30,41,59,0.9)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  locationBtn: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  carouselContainer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
  },
  carouselContent: {
    paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2 - CARD_MARGIN / 2,
  },
  card: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN / 2,
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: "#0165FC",
  },
  cardAccent: {
    height: 4,
  },
  cardContent: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitleSection: {
    flex: 1,
    marginLeft: 10,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  cardType: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    marginTop: 2,
  },
  cardInfo: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#64748B",
  },
  cardButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  cardButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0165FC",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  cardButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  directionsIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#0165FC",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 12,
  },
  emptyText: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
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
  markerWrapper: {
    alignItems: "center",
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0165FC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  markerSelected: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0147B3",
    borderWidth: 3,
  },
});
