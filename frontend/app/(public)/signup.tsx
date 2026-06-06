import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { useSignupViewModel } from "../../src/viewmodels/AuthViewModel";

export default function SignupScreen() {
  const router = useRouter();
  const { formData, updateField, isLoading, errors, handleSignup } =
    useSignupViewModel();
  const insets = useSafeAreaInsets();

  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async () => {
    const result = await handleSignup();
    if (result.success) {
      toast.success(result.message || "Registration successful");
      123456;
      return;
    }
    if (!result.success && result.message) {
      toast.error(result.message);
      return;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={[
            styles.backBtn,
            {
              top: insets.top + 10,
              left: insets.left + 15,
            },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join flow Clinics today</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name Row */}
          <View style={styles.nameRow}>
            <View style={styles.halfField}>
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="First Name"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={(val) => updateField("firstName", val)}
                  autoCapitalize="words"
                />
              </View>
              {errors.firstName && (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              )}
            </View>
            <View style={styles.halfField}>
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Last Name"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={(val) => updateField("lastName", val)}
                  autoCapitalize="words"
                />
              </View>
              {errors.lastName && (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              )}
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color="#64748B" />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#94A3B8"
              style={[styles.input, { marginLeft: 10 }]}
              value={formData.email}
              onChangeText={(val) => updateField("email", val)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* Password */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color="#64748B" />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#94A3B8"
              style={[styles.input, { flex: 1, marginLeft: 10 }]}
              value={formData.password}
              onChangeText={(val) => updateField("password", val)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color="#64748B"
              />
            </Pressable>
          </View>
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color="#64748B"
            />
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#94A3B8"
              style={[styles.input, { flex: 1, marginLeft: 10 }]}
              value={formData.confirmPassword}
              onChangeText={(val) => updateField("confirmPassword", val)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFBFC",
    position: "relative",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    justifyContent: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "absolute",
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
  },
  form: {},
  nameRow: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },
  button: {
    backgroundColor: "#0165FC",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#64748B",
    fontSize: 14,
  },
  footerLink: {
    color: "#0165FC",
    fontSize: 14,
    fontWeight: "600",
  },
});
