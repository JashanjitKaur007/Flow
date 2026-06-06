import useHomeViewModel from "@/src/viewmodels/useHomeViewModel";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Clinic } from "../../../src/models/types";
import { ClinicService } from "../../../src/services/clinicService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_WIDTH = SCREEN_WIDTH;
const IMAGE_HEIGHT = 280;

// ============================================
// IMAGE CAROUSEL (Reused)
// ============================================
const ImageCarousel = ({
  images,
  logo,
  accentColor,
}: {
  images?: string[];
  logo?: string;
  accentColor: string;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const allImages = [
    ...(images || []),
    ...(logo && !images?.includes(logo) ? [logo] : []),
  ];

  if (allImages.length === 0) {
    return (
      <View
        style={[
          carouselStyles.imagePlaceholder,
          { backgroundColor: accentColor },
        ]}
      >
        <Ionicons name="medical" size={60} color="white" />
        <Text style={carouselStyles.placeholderText}>Clinic</Text>
      </View>
    );
  }

  const handleScroll = (event: any) => {
    const slideWidth = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    setCurrentIndex(index);
  };

  return (
    <View style={carouselStyles.carouselContainer}>
      <FlatList
        ref={flatListRef}
        data={allImages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item, index) => `image-${index}`}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={carouselStyles.carouselImage} />
        )}
      />

      {allImages.length > 1 && (
        <View style={carouselStyles.pagination}>
          {allImages.map((_, index) => (
            <View
              key={index}
              style={[
                carouselStyles.paginationDot,
                currentIndex === index && carouselStyles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}

      {allImages.length > 1 && (
        <View style={carouselStyles.imageCounter}>
          <Text style={carouselStyles.imageCounterText}>
            {currentIndex + 1}/{allImages.length}
          </Text>
        </View>
      )}
    </View>
  );
};

// ============================================
// MAIN SCREEN (ADMIN)
// ============================================
export default function AdminClinicDetailsScreen() {
  const { id, distance } = useLocalSearchParams<{
    id: string;
    distance?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const distanceKm = distance ? parseFloat(distance) : null;

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);

  const [staffModalVisible, setStaffModalVisible] = useState(false);
  const [staffEmail, setStaffEmail] = useState("");

  const { addStaff, loadingAddStaff } = useHomeViewModel();

  // FETCH CLINIC DATA
  useEffect(() => {
    const fetchClinic = async () => {
      if (!id) return;
      try {
        const data = await ClinicService.getClinicById(id);
        setClinic(data);
      } catch (error) {
        console.error("Failed to fetch clinic:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClinic();
  }, [id]);

  // HANDLERS
  const handleEditDetails = () => {
    router.push(`/(admin)/edit-clinic/${id}`);
  };

  const handleAddStaff = () => {
    setStaffModalVisible(true);
  };

  const handleCancelAddStaff = () => {
    setStaffEmail("");
    setStaffModalVisible(false);
  };

  const handleConfirmAddStaff = async () => {
    if (!id) return;
    await addStaff(staffEmail, id);
    setStaffEmail("");
    setStaffModalVisible(false);
  };

  const handleCall = () => {
    if (clinic?.phone) Linking.openURL(`tel:${clinic.phone}`);
  };

  const handleEmail = () => {
    if (clinic?.email) Linking.openURL(`mailto:${clinic.email}`);
  };

  const handleWebsite = () => {
    if (clinic?.website) Linking.openURL(clinic.website);
  };

  const handleDirections = () => {
    if (!clinic?.latitude || !clinic?.longitude) return;
    const lat = clinic.latitude;
    const lng = clinic.longitude;
    const label = encodeURIComponent(clinic.name);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
    });
    if (url) Linking.openURL(url);
  };

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

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#0165FC" />
        <Text style={styles.loadingText}>Loading clinic...</Text>
      </View>
    );
  }

  if (!clinic) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#CBD5E1" />
        <Text style={styles.errorTitle}>Clinic Not Found</Text>
        <TouchableOpacity
          style={styles.errorBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.errorBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const color = getTypeColor(clinic.type);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      >
        <Modal
          visible={staffModalVisible}
          transparent
          animationType="none"
          statusBarTranslucent
        >
          <View style={modalStyles.overlay}>
            <View style={modalStyles.modalCard}>
              <Text style={modalStyles.title}>Add Staff Member</Text>
              <Text style={modalStyles.subtitle}>
                Enter the email address of the staff member you want to invite.
              </Text>

              <View style={modalStyles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color="#64748B" />
                <TextInput
                  placeholder="staff@email.com"
                  value={staffEmail}
                  onChangeText={setStaffEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={modalStyles.input}
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={modalStyles.actions}>
                <TouchableOpacity
                  style={modalStyles.cancelBtn}
                  onPress={handleCancelAddStaff}
                  activeOpacity={0.8}
                >
                  <Text style={modalStyles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={loadingAddStaff}
                  style={[
                    modalStyles.addBtn,
                    loadingAddStaff && modalStyles.addBtnDisabled,
                  ]}
                  onPress={handleConfirmAddStaff}
                  activeOpacity={0.8}
                >
                  <Ionicons name="person-add" size={18} color="white" />
                  {loadingAddStaff ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={modalStyles.addText}>Add</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Image Carousel */}
        <ImageCarousel
          images={clinic.images}
          logo={clinic.logo}
          accentColor={color}
        />

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 10 }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          {/* Type Badge */}
          <View style={[styles.typeBadge, { backgroundColor: `${color}15` }]}>
            <View style={[styles.typeDot, { backgroundColor: color }]} />
            <Text style={[styles.typeText, { color }]}>
              {clinic.type.replace("_", " ")}
            </Text>
          </View>

          {/* Name */}
          <Text style={styles.clinicName}>{clinic.name}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= 4 ? "star" : "star-outline"}
                size={16}
                color="#F59E0B"
              />
            ))}
            <Text style={styles.ratingText}>4.8</Text>
            <Text style={styles.reviewCount}>(124 reviews)</Text>
          </View>

          {/* Quick Info Cards */}
          <View style={styles.quickInfoRow}>
            {clinic.openingHours && (
              <View style={styles.infoCard}>
                <View
                  style={[styles.infoCardIcon, { backgroundColor: "#EFF6FF" }]}
                >
                  <Ionicons name="time-outline" size={20} color="#0165FC" />
                </View>
                <View style={styles.infoCardContent}>
                  <Text style={styles.infoCardLabel}>Hours</Text>
                  <Text style={styles.infoCardValue}>
                    {clinic.openingHours.start} - {clinic.openingHours.end}
                  </Text>
                </View>
              </View>
            )}

            {distanceKm !== null && (
              <View style={styles.infoCard}>
                <View
                  style={[styles.infoCardIcon, { backgroundColor: "#F0FDF4" }]}
                >
                  <Ionicons name="location-outline" size={20} color="#10B981" />
                </View>
                <View style={styles.infoCardContent}>
                  <Text style={styles.infoCardLabel}>Distance</Text>
                  <Text style={styles.infoCardValue}>
                    {distanceKm.toFixed(1)} km
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Address Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.addressCard}>
              <View style={styles.addressContent}>
                <Ionicons name="location" size={20} color={color} />
                <Text style={styles.addressText}>
                  {clinic.address || "Address not available"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.directionsBtn}
                onPress={handleDirections}
                activeOpacity={0.8}
              >
                <Ionicons name="navigate-outline" size={18} color="#0165FC" />
                <Text style={styles.directionsBtnText}>Get Directions</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Contact Section */}
          {(clinic.phone || clinic.email || clinic.website) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact</Text>
              <View style={styles.contactRow}>
                {clinic.phone && (
                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={handleCall}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="call" size={20} color="#0165FC" />
                    <Text style={styles.contactBtnText}>Call</Text>
                  </TouchableOpacity>
                )}
                {clinic.email && (
                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={handleEmail}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="mail" size={20} color="#0165FC" />
                    <Text style={styles.contactBtnText}>Email</Text>
                  </TouchableOpacity>
                )}
                {clinic.website && (
                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={handleWebsite}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="globe" size={20} color="#0165FC" />
                    <Text style={styles.contactBtnText}>Website</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* About Section */}
          {clinic.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.descriptionText}>{clinic.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ADMIN BOTTOM ACTION */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={handleEditDetails}
          activeOpacity={0.8}
        >
          <Ionicons name="pencil" size={20} color="white" />
          <Text style={styles.editBtnText}>Edit Clinic Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addStaffBtn}
          onPress={handleAddStaff}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={20} color="white" />
          <Text style={styles.editBtnText}>Add Staff Member</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const carouselStyles = StyleSheet.create({
  carouselContainer: {
    position: "relative",
  },
  carouselImage: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginTop: 8,
  },
  pagination: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  paginationDotActive: {
    backgroundColor: "white",
    width: 20,
  },
  imageCounter: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  // MOVED OUTSIDE of imageCounter
  imageCounterText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFBFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFBFC",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#FAFBFC",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 16,
  },
  errorBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#0165FC",
    borderRadius: 10,
  },
  errorBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
  scrollView: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  content: {
    padding: 20,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    marginBottom: 10,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  clinicName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 4,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 6,
  },
  reviewCount: {
    fontSize: 13,
    color: "#64748B",
  },
  quickInfoRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  infoCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 2,
  },
  infoCardValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },
  addressCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
  },
  addressContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#0165FC",
  },
  directionsBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  contactRow: {
    flexDirection: "row",
    gap: 12,
  },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  contactBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0165FC",
  },
  descriptionText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 24,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  editBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E293B", // Dark color for admin action
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  editBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  addStaffBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0165FC",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)", // slate overlay
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 16,
    lineHeight: 22,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
  },
  addBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#0165FC",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  addText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
  addBtnDisabled: {
    opacity: 0.6,
  },
});
