import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { ClinicType, ClinicTypeValue } from "../../../src/models/types";
import { useEditClinicViewModel } from "../../../src/viewmodels/useEditClinicViewModel";

// ============================================
// CLINIC TYPE OPTIONS
// ============================================
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

const getTypeLabel = (value: ClinicTypeValue) => {
  return CLINIC_TYPE_OPTIONS.find((opt) => opt.value === value)?.label || value;
};

// ============================================
// TYPE DROPDOWN COMPONENT
// ============================================
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
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[
          styles.dropdown,
          error && styles.dropdownError,
          disabled && styles.dropdownDisabled,
        ]}
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.dropdownText, disabled && styles.dropdownTextDisabled]}
        >
          {getTypeLabel(value)}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={disabled ? "#CBD5E1" : "#64748B"}
        />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Clinic Type</Text>
              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {CLINIC_TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalOption,
                    value === option.value && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    onSelect(option.value);
                    setVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      value === option.value && styles.modalOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {value === option.value && (
                    <Ionicons name="checkmark" size={20} color="#0165FC" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function EditClinicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
    isLoading,
    isLoadingClinic,
    errors,
    updateName,
    updateAddress,
    updateLatitude,
    updateLongitude,
    updatePhone,
    updateEmail,
    updateWebsite,
    updateDescription,
    updateType,
    updateOpeningHoursStart,
    updateOpeningHoursEnd,
    handleSave,
  } = useEditClinicViewModel(id);

  if (isLoadingClinic) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0165FC" />
        <Text style={styles.loadingText}>Loading clinic data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.safeAreaTop, { height: insets.top }]} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Clinic</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Clinic Name</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.name && styles.inputContainerError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Enter clinic name"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={updateName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Clinic Type</Text>
              <TypeDropdown
                value={type}
                onSelect={updateType}
                error={errors.type}
                disabled={isLoading}
              />
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.address && styles.inputContainerError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Enter address"
                  placeholderTextColor="#94A3B8"
                  value={address}
                  onChangeText={updateAddress}
                  autoCapitalize="words"
                  editable={!isLoading}
                  multiline
                  numberOfLines={2}
                />
              </View>
              {errors.address && (
                <Text style={styles.errorText}>{errors.address}</Text>
              )}
            </View>

            {/* Latitude & Longitude */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Latitude</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.latitude && styles.inputContainerError,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="0.0000"
                    placeholderTextColor="#94A3B8"
                    value={latitude}
                    onChangeText={updateLatitude}
                    keyboardType="numeric"
                    editable={!isLoading}
                  />
                </View>
                {errors.latitude && (
                  <Text style={styles.errorText}>{errors.latitude}</Text>
                )}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Longitude</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.longitude && styles.inputContainerError,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="0.0000"
                    placeholderTextColor="#94A3B8"
                    value={longitude}
                    onChangeText={updateLongitude}
                    keyboardType="numeric"
                    editable={!isLoading}
                  />
                </View>
                {errors.longitude && (
                  <Text style={styles.errorText}>{errors.longitude}</Text>
                )}
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.phone && styles.inputContainerError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="1234567890"
                  placeholderTextColor="#94A3B8"
                  value={phone}
                  onChangeText={updatePhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!isLoading}
                />
              </View>
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.email && styles.inputContainerError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="clinic@example.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={updateEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Website */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Website</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.website && styles.inputContainerError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="https://example.com"
                  placeholderTextColor="#94A3B8"
                  value={website}
                  onChangeText={updateWebsite}
                  keyboardType="url"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
              {errors.website && (
                <Text style={styles.errorText}>{errors.website}</Text>
              )}
            </View>

            {/* Opening Hours */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Opening Hours</Text>
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.sublabel}>Start Time</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.openingHours && styles.inputContainerError,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="09:00"
                      placeholderTextColor="#94A3B8"
                      value={openingHoursStart}
                      onChangeText={updateOpeningHoursStart}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.sublabel}>End Time</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.openingHours && styles.inputContainerError,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="17:00"
                      placeholderTextColor="#94A3B8"
                      value={openingHoursEnd}
                      onChangeText={updateOpeningHoursEnd}
                      editable={!isLoading}
                    />
                  </View>
                </View>
              </View>
              {errors.openingHours && (
                <Text style={styles.errorText}>{errors.openingHours}</Text>
              )}
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.description && styles.inputContainerError,
                ]}
              >
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter clinic description"
                  placeholderTextColor="#94A3B8"
                  value={description}
                  onChangeText={updateDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!isLoading}
                />
              </View>
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  sublabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    marginBottom: 6,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    backgroundColor: "#FAFBFC",
  },
  inputContainerError: {
    borderColor: "#EF4444",
  },
  input: {
    fontSize: 15,
    color: "#1E293B",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    backgroundColor: "#FAFBFC",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownError: {
    borderColor: "#EF4444",
  },
  dropdownDisabled: {
    opacity: 0.6,
  },
  dropdownText: {
    fontSize: 15,
    color: "#1E293B",
    flex: 1,
  },
  dropdownTextDisabled: {
    color: "#94A3B8",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
    marginBottom: 0,
  },
  saveButton: {
    backgroundColor: "#0165FC",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalList: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalOptionSelected: {
    backgroundColor: "#F0F9FF",
  },
  modalOptionText: {
    fontSize: 15,
    color: "#1E293B",
  },
  modalOptionTextSelected: {
    color: "#0165FC",
    fontWeight: "600",
  },
});
