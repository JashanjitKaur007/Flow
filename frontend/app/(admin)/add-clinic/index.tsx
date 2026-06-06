import { useAddClinicViewModel } from "@/src/viewmodels/useAddViewClinicModel";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClinicType, ClinicTypeValue } from "../../../src/models/types";

/* -------------------------------
   CLINIC TYPE OPTIONS
-------------------------------- */
const CLINIC_TYPE_OPTIONS: { label: string; value: ClinicTypeValue }[] = [
  { label: "General Practice", value: ClinicType.GENERAL_PRACTICE },
  { label: "Pediatrics", value: ClinicType.PEDIATRICS },
  { label: "Dermatology", value: ClinicType.DERMATOLOGY },
  { label: "Psychiatry", value: ClinicType.PSYCHIATRY },
  { label: "Gynecology", value: ClinicType.GYNECOLOGY },
  { label: "Orthopedics", value: ClinicType.ORTHOPEDICS },
  { label: "ENT", value: ClinicType.ENT },
  { label: "Dentist", value: ClinicType.DENTIST },
];

const getTypeLabel = (value: ClinicTypeValue) =>
  CLINIC_TYPE_OPTIONS.find((o) => o.value === value)?.label || value;

/* -------------------------------
   TYPE DROPDOWN
-------------------------------- */
const TypeDropdown = ({
  value,
  onSelect,
  error,
  disabled,
}: {
  value: ClinicTypeValue;
  onSelect: (value: ClinicTypeValue) => void;
  error?: string;
  disabled?: boolean;
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <TouchableOpacity
        style={[
          styles.dropdown,
          error && styles.inputContainerError,
          disabled && { opacity: 0.6 },
        ]}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.dropdownText}>{getTypeLabel(value)}</Text>
        <Ionicons name="chevron-down" size={20} color="#64748B" />
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdownMenu}>
          {CLINIC_TYPE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={styles.dropdownOption}
              onPress={() => {
                onSelect(opt.value);
                setOpen(false);
              }}
            >
              <Text>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );
};

/* -------------------------------
   IMAGE GALLERY
-------------------------------- */
const ImageGallery = ({
  images,
  onRemove,
  onAdd,
}: {
  images: string[];
  onRemove: (index: number) => void;
  onAdd: () => void;
}) => {
  return (
    <View style={styles.galleryContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.galleryScroll}
      >
        {images.map((uri, index) => (
          <View key={index} style={styles.imageItem}>
            <Image source={{ uri }} style={styles.galleryImage} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemove(index)}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addImageButton}
          onPress={onAdd}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={32} color="#0165FC" />
          <Text style={styles.addImageText}>Add Image</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

/* -------------------------------
   MAIN COMPONENT
-------------------------------- */
export default function AddClinicScreen() {
  const insets = useSafeAreaInsets();

  const {
    name,
    address,
    latitude,
    longitude,
    phone,
    email,
    website,
    description,
    type,
    openingHoursStart,
    openingHoursEnd,
    logo,
    images,
    errors,
    isLoading,
    setName,
    setAddress,
    setLatitude,
    setLongitude,
    setPhone,
    setEmail,
    setWebsite,
    setDescription,
    setType,
    setOpeningHoursStart,
    setOpeningHoursEnd,
    pickLogo,
    pickImages,
    removeImage,
    handleSave,
  } = useAddClinicViewModel();

  return (
    <View style={styles.wrapper}>
      <View style={{ height: insets.top }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Clinic</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Name */}
          <Input
            label="Clinic Name"
            value={name}
            onChangeText={setName}
            error={errors.name}
          />

          {/* Type */}
          <Text style={styles.label}>Clinic Type</Text>
          <TypeDropdown
            value={type}
            onSelect={setType}
            error={errors.type}
            disabled={isLoading}
          />

          {/* Address */}
          <Input
            label="Address"
            value={address}
            onChangeText={setAddress}
            error={errors.address}
            multiline
          />

          {/* Lat / Long */}
          <Row>
            <Input
              label="Latitude"
              value={latitude}
              onChangeText={setLatitude}
              keyboardType="numeric"
              error={errors.latitude}
            />
            <Input
              label="Longitude"
              value={longitude}
              onChangeText={setLongitude}
              keyboardType="numeric"
              error={errors.longitude}
            />
          </Row>

          {/* Phone */}
          <Input
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            error={errors.phone}
          />

          {/* Email */}
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            error={errors.email}
          />

          {/* Website */}
          <Input
            label="Website"
            value={website}
            onChangeText={setWebsite}
            error={errors.website}
          />

          {/* Opening Hours */}
          <Row>
            <Input
              label="Opening Start"
              value={openingHoursStart}
              onChangeText={setOpeningHoursStart}
              error={errors.openingHours}
            />
            <Input
              label="Opening End"
              value={openingHoursEnd}
              onChangeText={setOpeningHoursEnd}
              error={errors.openingHours}
            />
          </Row>

          {/* Description */}
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            error={errors.description}
            multiline
          />

          {/* Logo */}
          <Text style={styles.label}>Logo</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickLogo}>
            {logo ? (
              <Image source={{ uri: logo }} style={styles.logo} />
            ) : (
              <View style={styles.emptyImageContainer}>
                <Ionicons name="camera" size={32} color="#94A3B8" />
                <Text style={styles.emptyImageText}>Select Logo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Images Gallery */}
          <Text style={styles.label}>
            Clinic Images {images.length > 0 && `(${images.length})`}
          </Text>
          <ImageGallery
            images={images}
            onRemove={removeImage}
            onAdd={pickImages}
          />

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveButton, isLoading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveText}>Create Clinic</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* -------------------------------
   SMALL REUSABLE UI
-------------------------------- */
const Input = ({ label, error, ...props }: any) => (
  <View style={{ marginBottom: 16, flex: 1 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} {...props} />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const Row = ({ children }: { children: React.ReactNode }) => (
  <View style={{ flexDirection: "row", gap: 12 }}>{children}</View>
);

/* -------------------------------
   STYLES
-------------------------------- */
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "white" },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  scrollContent: { padding: 16 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#FAFBFC",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dropdownText: { fontSize: 15 },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  dropdownOption: { padding: 12 },
  imagePicker: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    minHeight: 120,
  },
  emptyImageContainer: {
    alignItems: "center",
    gap: 8,
  },
  emptyImageText: {
    fontSize: 14,
    color: "#94A3B8",
  },
  logo: { width: 100, height: 100, borderRadius: 8 },
  galleryContainer: {
    marginBottom: 16,
  },
  galleryScroll: {
    gap: 12,
    paddingVertical: 8,
  },
  imageItem: {
    position: "relative",
  },
  galleryImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: "#0165FC",
    borderStyle: "dashed",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F9FF",
    gap: 4,
  },
  addImageText: {
    fontSize: 12,
    color: "#0165FC",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#0165FC",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveText: { color: "white", fontWeight: "600" },
  errorText: { color: "#EF4444", fontSize: 12, marginTop: 4 },
  inputContainerError: { borderColor: "#EF4444" },
});
