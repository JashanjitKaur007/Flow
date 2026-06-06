import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { toast } from "sonner-native";
import { useAuth } from "../context/AuthContext";
import {
  LoginInput,
  loginSchema,
  RegisterInput,
  registerSchema,
  UpdatePasswordInput,
  updatePasswordSchema,
} from "../models/types";
import { AuthService } from "../services/authService";

// ============================================
// LOGIN VIEW MODEL
// ============================================
export const useLoginViewModel = () => {
  const { login, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState<LoginInput>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback(
    (field: keyof RegisterInput, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const validate = useCallback((): boolean => {
    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [formData]);

  const handleLogin = useCallback(async (): Promise<{
    success: boolean;
    message?: string;
  }> => {
    if (!validate()) {
      return { success: false, message: "Please fix the errors below" };
    }

    setIsLoading(true);
    try {
      const result = await login(formData);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [formData, login, validate]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    formData,
    setFormData,
    isLoading: isLoading || authLoading,
    errors,
    handleLogin,
    clearErrors,
    updateField,
  };
};

// ============================================
// SIGNUP VIEW MODEL
// ============================================
export const useSignupViewModel = () => {
  const { register, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState<RegisterInput>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback(
    (field: keyof RegisterInput, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const validate = useCallback((): boolean => {
    const result = registerSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [formData]);

  const handleSignup = useCallback(async (): Promise<{
    success: boolean;
    message?: string;
  }> => {
    if (!validate()) {
      return { success: false, message: "Please fix the errors below" };
    }

    setIsLoading(true);
    try {
      const result = await register(formData);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [formData, register, validate]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    formData,
    updateField,
    isLoading: isLoading || authLoading,
    errors,
    handleSignup,
    clearErrors,
  };
};

// ============================================
// EDIT PROFILE VIEW MODEL
// ============================================
export const useEditProfileViewModel = () => {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
    }
  }, [user]);

  const updateFirstName = useCallback((value: string) => {
    setFirstName(value);
  }, []);

  const updateLastName = useCallback((value: string) => {
    setLastName(value);
  }, []);

  const pickImage = useCallback(async () => {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need access to your photo library to select a profile picture."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1, // Get full quality first, we'll compress later
        base64: false, // Don't get base64 yet, we'll manipulate first
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        try {
          // Start with aggressive compression - resize to 500x500 and compress to 40% quality
          let manipulatedImage = await ImageManipulator.manipulateAsync(
            asset.uri,
            [
              { resize: { width: 500, height: 500 } }, // Smaller initial size
            ],
            {
              compress: 0.4, // Aggressive compression (40% quality)
              format: ImageManipulator.SaveFormat.JPEG,
              base64: true,
            }
          );

          // Check base64 size - be more strict (250KB base64 max)
          const maxSize = 250000; // ~250KB base64 (roughly ~188KB original)
          let base64Size = manipulatedImage.base64?.length || 0;

          // If still too large, try even more aggressive compression
          if (base64Size > maxSize) {
            manipulatedImage = await ImageManipulator.manipulateAsync(
              asset.uri,
              [
                { resize: { width: 400, height: 400 } }, // Even smaller
              ],
              {
                compress: 0.3, // Very aggressive compression (30% quality)
                format: ImageManipulator.SaveFormat.JPEG,
                base64: true,
              }
            );
            base64Size = manipulatedImage.base64?.length || 0;
          }

          // Final check - if still too large, try maximum compression
          if (base64Size > maxSize) {
            manipulatedImage = await ImageManipulator.manipulateAsync(
              asset.uri,
              [
                { resize: { width: 300, height: 300 } }, // Smallest size
              ],
              {
                compress: 0.2, // Maximum compression (20% quality)
                format: ImageManipulator.SaveFormat.JPEG,
                base64: true,
              }
            );
            base64Size = manipulatedImage.base64?.length || 0;
          }

          // Final validation
          if (manipulatedImage.base64 && base64Size <= maxSize * 1.2) {
            // Allow 20% buffer for safety
            setSelectedImage(manipulatedImage.uri);
            setBase64Image(`data:image/jpeg;base64,${manipulatedImage.base64}`);
          } else {
            toast.error("Image is too large. Please choose a smaller image.");
          }
        } catch (error) {
          console.error("Error manipulating image:", error);
          toast.error("Failed to process image");
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      toast.error("Failed to pick image");
    }
  }, []);

  const getInitials = useCallback(() => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  }, [firstName, lastName]);

  const getDisplayImage = useCallback(() => {
    if (selectedImage) return selectedImage;
    if (user?.profilePicture) return user.profilePicture;
    return null;
  }, [selectedImage, user?.profilePicture]);

  const validate = useCallback((): boolean => {
    if (!firstName.trim()) {
      toast.error("First name is required");
      return false;
    }
    if (!lastName.trim()) {
      toast.error("Last name is required");
      return false;
    }
    return true;
  }, [firstName, lastName]);

  const handleSave = useCallback(async (): Promise<{
    success: boolean;
    message?: string;
  }> => {
    if (!validate()) {
      return { success: false, message: "Please fix the errors below" };
    }

    setIsLoading(true);
    try {
      const result = await AuthService.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        profilePicture: base64Image || undefined,
      });

      if (result.success) {
        await refreshUser();
        toast.success(result.message || "Profile updated successfully");
        return { success: true, message: result.message };
      } else {
        toast.error(result.message || "Failed to update profile");
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
      return { success: false, message: "Failed to update profile" };
    } finally {
      setIsLoading(false);
    }
  }, [firstName, lastName, base64Image, validate, refreshUser, router]);

  return {
    firstName,
    lastName,
    selectedImage,
    base64Image,
    isLoading,
    updateFirstName,
    updateLastName,
    pickImage,
    getInitials,
    getDisplayImage,
    handleSave,
  };
};

// ============================================
// CHANGE PASSWORD VIEW MODEL
// ============================================
export const useChangePasswordViewModel = () => {
  const router = useRouter();

  const [formData, setFormData] = useState<UpdatePasswordInput>({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback(
    (field: keyof UpdatePasswordInput, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const validate = useCallback((): boolean => {
    const result = updatePasswordSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [formData]);

  const handleChangePassword = useCallback(async (): Promise<{
    success: boolean;
    message?: string;
  }> => {
    if (!validate()) {
      return { success: false, message: "Please fix the errors below" };
    }

    setIsLoading(true);
    try {
      const result = await AuthService.updatePassword(formData);
      if (result.success) {
        // Clear form on success
        setFormData({
          oldPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
        toast.success(result.message || "Password updated successfully");
        router.back();
        return { success: true, message: result.message };
      } else {
        toast.error(result.message || "Failed to update password");
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to update password");
      return { success: false, message: "Failed to update password" };
    } finally {
      setIsLoading(false);
    }
  }, [formData, validate, router]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    formData,
    updateField,
    isLoading,
    errors,
    handleChangePassword,
    clearErrors,
  };
};

// Keep the old hook for backward compatibility
export const useAuthViewModel = useLoginViewModel;
