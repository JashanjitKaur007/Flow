import * as Location from "expo-location";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner-native";
import { Clinic, ClinicTypeValue } from "../models/types";
import { ClinicService } from "../services/clinicService";
import { useAuth } from "./AuthContext";

interface FilterContextType {
  userLocation: { latitude: number; longitude: number } | null;
  fetchLocation: () => Promise<{ latitude: number; longitude: number } | null>;

  radius: number;
  setRadius: (radius: number) => void;
  showAllClinics: boolean;
  setShowAllClinics: (show: boolean) => void;
  selectedType: ClinicTypeValue | null;
  setSelectedType: (type: ClinicTypeValue | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  showFilters: boolean;
  setShowFilters: (show: boolean) => void;

  clinics: Clinic[];
  loading: boolean;
  error: string | null;
  refreshClinics: () => Promise<void>;

  radiusRef: React.RefObject<number>;
  showAllClinicsRef: React.RefObject<boolean>;
  userLocationRef: React.RefObject<{
    latitude: number;
    longitude: number;
  } | null>;

  clearFilters: () => void;
}

const FilterContext = createContext<FilterContextType>({} as FilterContextType);

export const FilterProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [radius, setRadiusState] = useState(50);
  const [showAllClinics, setShowAllClinicsState] = useState(false);
  const [selectedType, setSelectedType] = useState<ClinicTypeValue | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const radiusRef = useRef(50);
  const showAllClinicsRef = useRef(false);
  const userLocationRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const isFetchingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const prevSearchQueryRef = useRef("");

  useEffect(() => {
    radiusRef.current = radius;
  }, [radius]);

  useEffect(() => {
    showAllClinicsRef.current = showAllClinics;
  }, [showAllClinics]);

  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  const setRadius = useCallback((value: number) => {
    setRadiusState(value);
    radiusRef.current = value;
  }, []);

  const setShowAllClinics = useCallback((value: boolean) => {
    setShowAllClinicsState(value);
    showAllClinicsRef.current = value;
  }, []);

  const fetchLocation = useCallback(async () => {
    // Skip location request for ADMIN and STAFF
    if (user?.role === "ADMIN" || user?.role === "STAFF") {
      return null;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        toast.error(
          "Location permission denied. Please enable location permissions in your device settings."
        );
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(coords);
      userLocationRef.current = coords;
      return coords;
    } catch (err) {
      console.error("Failed to get location:", err);
      return null;
    }
  }, [user?.role]);

  const refreshClinics = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    if (isFetchingRef.current) {
      return;
    }
    isFetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      // Skip location for ADMIN and STAFF - always show all clinics
      const isAdminOrStaff = user?.role === "ADMIN" || user?.role === "STAFF";
      let location = userLocationRef.current;

      if (!isAdminOrStaff && !location && !showAllClinicsRef.current) {
        location = await fetchLocation();
      }

      const params: any = {
        page: 1,
        limit: 50,
      };

      if (selectedType) {
        params.type = selectedType;
      }

      if (searchQuery) {
        params.query = searchQuery;
      }

      // For ADMIN and STAFF, don't use location-based filtering
      if (!isAdminOrStaff && !showAllClinicsRef.current && location) {
        params.latitude = location.latitude;
        params.longitude = location.longitude;
        params.radius = radiusRef.current;
      }

      const response = await ClinicService.getClinics(params);
      const fetchedClinics = response.clinics;
      console.log(`FilterContext: Fetched ${fetchedClinics.length} clinics`);

      console.log(`FilterContext: Fetched ${fetchedClinics.length} clinics`);
      setClinics(fetchedClinics);
    } catch (err) {
      console.log("Failed to fetch clinics:", err);
      setError("Failed to load clinics");
      setClinics([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [fetchLocation, selectedType, searchQuery, isAuthenticated, user?.role]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      isInitializedRef.current = false;
      setClinics([]);
    }
  }, [isAuthenticated, authLoading]);

  // Initial load - only runs once when auth is ready
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (isInitializedRef.current) return;

    // For ADMIN and STAFF, automatically set showAllClinics to true (no location needed)
    if (user?.role === "ADMIN" || user?.role === "STAFF") {
      setShowAllClinicsState(true);
      showAllClinicsRef.current = true;
    }

    console.log("FilterContext: Initial fetch triggered");
    isInitializedRef.current = true;
    refreshClinics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading, user?.role]);

  // Search query changes - only runs after initialization and when query actually changes
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (!isInitializedRef.current) return;

    // Skip if searchQuery hasn't actually changed (prevents initial mount trigger)
    if (prevSearchQueryRef.current === searchQuery) return;
    prevSearchQueryRef.current = searchQuery;

    console.log("FilterContext: Search query changed, triggering fetch");
    const timeoutId = setTimeout(() => {
      refreshClinics();
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedType(null);
    setRadius(10);
    setShowAllClinics(false);
  }, [setRadius, setShowAllClinics]);

  const value: FilterContextType = {
    userLocation,
    fetchLocation,

    radius,
    setRadius,
    showAllClinics,
    setShowAllClinics,
    selectedType,
    setSelectedType,
    searchQuery,
    setSearchQuery,

    showFilters,
    setShowFilters,

    clinics,
    loading,
    error,
    refreshClinics,

    radiusRef,
    showAllClinicsRef,
    userLocationRef,

    clearFilters,
  };

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
};

export const useFilters = (): FilterContextType => {
  const context = useContext(FilterContext);

  if (!context) {
    throw new Error("useFilters must be used within a FilterProvider");
  }

  return context;
};

export default FilterContext;
