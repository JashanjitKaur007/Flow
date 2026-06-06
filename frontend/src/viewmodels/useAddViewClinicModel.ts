import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { toast } from "sonner-native";
import { useFilters } from "../context/FilterContext";
import {
  ClinicType,
  ClinicTypeValue,
  updateDoctorClinicSchema,
} from "../models/types";
import { ClinicService } from "../services/clinicService";

// ============================================
// ADD CLINIC VIEW MODEL
// ============================================
export const useAddClinicViewModel = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { refreshClinics } = useFilters();

  // Form fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ClinicTypeValue>(
    ClinicType.GENERAL_PRACTICE
  );
  const [openingHoursStart, setOpeningHoursStart] = useState("");
  const [openingHoursEnd, setOpeningHoursEnd] = useState("");

  // Images
  const [logo, setLogo] = useState<string | null>(null);
  const [base64Logo, setBase64Logo] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [base64Images, setBase64Images] = useState<string[]>([]);

  // ============================================
  // IMAGE PICKERS
  // ============================================
  const pickLogo = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need access to your photo library to select a profile picture."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      try {
        let manipulatedImage = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 500, height: 500 } }],
          {
            compress: 0.4,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );

        const maxSize = 25_0000;
        let base64Size = manipulatedImage.base64?.length || 0;

        if (base64Size > maxSize) {
          manipulatedImage = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 400, height: 400 } }],
            {
              compress: 0.3,
              format: ImageManipulator.SaveFormat.JPEG,
              base64: true,
            }
          );
          base64Size = manipulatedImage.base64?.length || 0;
        }

        if (base64Size > maxSize) {
          manipulatedImage = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 300, height: 300 } }],
            {
              compress: 0.2,
              format: ImageManipulator.SaveFormat.JPEG,
              base64: true,
            }
          );
          base64Size = manipulatedImage.base64?.length || 0;
        }

        if (manipulatedImage.base64 && base64Size <= maxSize * 1.2) {
          setLogo(manipulatedImage.uri);
          setBase64Logo(`data:image/jpeg;base64,${manipulatedImage.base64}`);
        } else {
          toast.error("Image is too large. Please choose a smaller image.");
        }
      } catch (error) {
        console.error("Error manipulating image:", error);
        toast.error("Failed to process image");
      }
    }
  }, []);

  const pickImages = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need access to your photo library to select a profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets) {
      const assets = result.assets;
      for (const asset of assets) {
        try {
          let manipulatedImage = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 500, height: 500 } }],
            {
              compress: 0.4,
              format: ImageManipulator.SaveFormat.JPEG,
              base64: true,
            }
          );

          const maxSize = 10_0000;
          let base64Size = manipulatedImage.base64?.length || 0;

          if (base64Size > maxSize) {
            manipulatedImage = await ImageManipulator.manipulateAsync(
              asset.uri,
              [{ resize: { width: 400, height: 400 } }],
              {
                compress: 0.2,
                format: ImageManipulator.SaveFormat.JPEG,
                base64: true,
              }
            );
            base64Size = manipulatedImage.base64?.length || 0;
          }

          if (base64Size > maxSize) {
            manipulatedImage = await ImageManipulator.manipulateAsync(
              asset.uri,
              [{ resize: { width: 300, height: 300 } }],
              {
                compress: 0.1,
                format: ImageManipulator.SaveFormat.JPEG,
                base64: true,
              }
            );
            base64Size = manipulatedImage.base64?.length || 0;
          }

          if (manipulatedImage.base64 && base64Size <= maxSize * 1.2) {
            setImages((prev) => [...prev, manipulatedImage.uri]);
            setBase64Images((prev) => [
              ...prev,
              `data:image/jpeg;base64,${manipulatedImage.base64}`,
            ]);
          } else {
            toast.error("Image is too large. Please choose a smaller image.");
          }
        } catch (error) {
          console.error("Error manipulating image:", error);
          toast.error("Failed to process image");
        }
      }
    }
  }, []);

  // ============================================
  // VALIDATION
  // ============================================
  const validate = useCallback((): boolean => {
    const payload: any = {};

    if (name.trim()) payload.name = name.trim();
    if (address.trim()) payload.address = address.trim();
    if (latitude.trim()) payload.latitude = latitude.trim();
    if (longitude.trim()) payload.longitude = longitude.trim();
    if (phone.trim()) payload.phone = phone.trim();
    if (email.trim()) payload.email = email.trim();
    if (website.trim()) payload.website = website.trim();
    if (description.trim()) payload.description = description.trim();
    if (type) payload.type = type;

    if (openingHoursStart.trim() && openingHoursEnd.trim()) {
      payload.openingHours = JSON.stringify({
        start: openingHoursStart.trim(),
        end: openingHoursEnd.trim(),
      });
    }

    const result = updateDoctorClinicSchema.safeParse(payload);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      toast.error(result.error.issues[0].message);
      return false;
    }

    setErrors({});
    return true;
  }, [
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
  ]);

  // ============================================
  // HANDLE SAVE
  // ============================================
  const handleSave = useCallback(async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const formData = new FormData();

      if (name.trim()) formData.append("name", name.trim());
      if (address.trim()) formData.append("address", address.trim());
      if (latitude.trim()) formData.append("latitude", latitude.trim());
      if (longitude.trim()) formData.append("longitude", longitude.trim());
      if (phone.trim()) formData.append("phone", phone.trim());
      if (email.trim()) formData.append("email", email.trim());
      if (website.trim()) formData.append("website", website.trim());
      if (description.trim())
        formData.append("description", description.trim());
      if (type) formData.append("type", type);

      if (openingHoursStart.trim() && openingHoursEnd.trim()) {
        formData.append(
          "openingHours",
          JSON.stringify({
            start: openingHoursStart.trim(),
            end: openingHoursEnd.trim(),
          })
        );
      }

      if (!base64Logo || !base64Images) {
        toast.error("Please select a logo and images");
        return;
      }

      formData.append("logo", {
        uri: logo,
        type: "image/jpeg",
        name: "logo.jpg",
      } as any);

      base64Images.forEach((img) => {
        formData.append("images", {
          uri: img,
          type: "image/jpeg",
          name: "logo.jpg",
        } as any);
      });

      const result = await ClinicService.createDoctorClinic(formData);

      if (result.success) {
        toast.success("Clinic created successfully");
        refreshClinics();
        router.back();
      } else {
        toast.error(result.message || "Failed to create clinic");
      }
    } catch (err) {
      console.error("Create clinic error:", err);
      toast.error("Failed to create clinic");
    } finally {
      setIsLoading(false);
    }
  }, [
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
    validate,
    router,
  ]);

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setBase64Images((prev) => prev.filter((_, i) => i !== index));
  };

  return {
    // Fields
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

    // State
    isLoading,
    errors,

    // Setters
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

    // Image actions
    pickLogo,
    pickImages,
    removeImage,

    // Action
    handleSave,
  };
};
