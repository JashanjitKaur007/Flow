import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner-native";
import { Clinic, ClinicType, updateDoctorClinicSchema } from "../models/types";
import { ClinicService } from "../services/clinicService";

// ============================================
// EDIT CLINIC VIEW MODEL
// ============================================
export const useEditClinicViewModel = (clinicId: string) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClinic, setIsLoadingClinic] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<Clinic["type"]>(ClinicType.GENERAL_PRACTICE);
  const [openingHoursStart, setOpeningHoursStart] = useState("");
  const [openingHoursEnd, setOpeningHoursEnd] = useState("");

  // Load clinic data
  useEffect(() => {
    const loadClinic = async () => {
      if (!clinicId) return;
      try {
        setIsLoadingClinic(true);
        const clinic = await ClinicService.getClinicById(clinicId);
        if (clinic) {
          setName(clinic.name || "");
          setAddress(clinic.address || "");
          setLatitude(clinic.latitude?.toString() || "");
          setLongitude(clinic.longitude?.toString() || "");
          setPhone(clinic.phone || "");
          setEmail(clinic.email || "");
          setWebsite(clinic.website || "");
          setDescription(clinic.description || "");
          setType(clinic.type);
          setOpeningHoursStart(clinic.openingHours?.start || "");
          setOpeningHoursEnd(clinic.openingHours?.end || "");
        }
      } catch (error) {
        console.error("Failed to load clinic:", error);
        toast.error("Failed to load clinic data");
      } finally {
        setIsLoadingClinic(false);
      }
    };
    loadClinic();
  }, [clinicId]);

  // Update field handlers
  const updateName = useCallback(
    (value: string) => {
      setName(value);
      if (errors.name) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.name;
          return newErrors;
        });
      }
    },
    [errors.name]
  );

  const updateAddress = useCallback(
    (value: string) => {
      setAddress(value);
      if (errors.address) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.address;
          return newErrors;
        });
      }
    },
    [errors.address]
  );

  const updateLatitude = useCallback(
    (value: string) => {
      setLatitude(value);
      if (errors.latitude) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.latitude;
          return newErrors;
        });
      }
    },
    [errors.latitude]
  );

  const updateLongitude = useCallback(
    (value: string) => {
      setLongitude(value);
      if (errors.longitude) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.longitude;
          return newErrors;
        });
      }
    },
    [errors.longitude]
  );

  const updatePhone = useCallback(
    (value: string) => {
      // Only allow digits
      const digitsOnly = value.replace(/[^\d]/g, "").slice(0, 10);
      setPhone(digitsOnly);
      if (errors.phone) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.phone;
          return newErrors;
        });
      }
    },
    [errors.phone]
  );

  const updateEmail = useCallback(
    (value: string) => {
      setEmail(value);
      if (errors.email) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      }
    },
    [errors.email]
  );

  const updateWebsite = useCallback(
    (value: string) => {
      setWebsite(value);
      if (errors.website) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.website;
          return newErrors;
        });
      }
    },
    [errors.website]
  );

  const updateDescription = useCallback(
    (value: string) => {
      setDescription(value);
      if (errors.description) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.description;
          return newErrors;
        });
      }
    },
    [errors.description]
  );

  const updateType = useCallback(
    (value: Clinic["type"]) => {
      setType(value);
      if (errors.type) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.type;
          return newErrors;
        });
      }
    },
    [errors.type]
  );

  const updateOpeningHoursStart = useCallback(
    (value: string) => {
      setOpeningHoursStart(value);
      if (errors.openingHours) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.openingHours;
          return newErrors;
        });
      }
    },
    [errors.openingHours]
  );

  const updateOpeningHoursEnd = useCallback(
    (value: string) => {
      setOpeningHoursEnd(value);
      if (errors.openingHours) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.openingHours;
          return newErrors;
        });
      }
    },
    [errors.openingHours]
  );

  // Validate form
  const validate = useCallback((): boolean => {
    const formData: any = {};

    if (name.trim()) formData.name = name.trim();
    if (address.trim()) formData.address = address.trim();
    if (latitude.trim()) formData.latitude = latitude.trim();
    if (longitude.trim()) formData.longitude = longitude.trim();
    if (phone.trim()) formData.phone = phone.trim();
    if (email.trim()) formData.email = email.trim();
    if (website.trim()) formData.website = website.trim();
    if (description.trim()) formData.description = description.trim();
    if (type) formData.type = type;
    if (openingHoursStart.trim() && openingHoursEnd.trim()) {
      formData.openingHours = JSON.stringify({
        start: openingHoursStart.trim(),
        end: openingHoursEnd.trim(),
      });
    }

    const result = updateDoctorClinicSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);

      // Show first error
      const firstError = result.error.issues[0];
      toast.error(firstError.message);
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

  // Handle save
  const handleSave = useCallback(async (): Promise<{
    success: boolean;
    message?: string;
  }> => {
    if (!validate()) {
      return { success: false, message: "Please fix the errors below" };
    }

    setIsLoading(true);
    try {
      const formData: any = {};

      if (name.trim()) formData.name = name.trim();
      if (address.trim()) formData.address = address.trim();
      if (latitude.trim()) formData.latitude = Number(latitude);
      if (longitude.trim()) formData.longitude = Number(longitude);
      if (phone.trim()) formData.phone = phone.trim();
      if (email.trim()) formData.email = email.trim();
      if (website.trim()) formData.website = website.trim();
      if (description.trim()) formData.description = description.trim();
      if (type) formData.type = type;
      if (openingHoursStart.trim() && openingHoursEnd.trim()) {
        formData.openingHours = {
          start: openingHoursStart.trim(),
          end: openingHoursEnd.trim(),
        };
      }

      const result = await ClinicService.updateClinic(clinicId, formData);

      if (result.success) {
        toast.success(result.message || "Clinic updated successfully");
        router.back();
        return { success: true, message: result.message };
      } else {
        toast.error(result.message || "Failed to update clinic");
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Error updating clinic:", error);
      toast.error("Failed to update clinic");
      return { success: false, message: "Failed to update clinic" };
    } finally {
      setIsLoading(false);
    }
  }, [
    clinicId,
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
    validate,
    router,
  ]);

  return {
    // Form fields
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

    // State
    isLoading,
    isLoadingClinic,
    errors,

    // Update handlers
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

    // Actions
    handleSave,
  };
};

export default useEditClinicViewModel;
