import { useCallback, useEffect, useRef, useState } from "react";
import { useFilters } from "../context/FilterContext";

// ============================================
// MAP REGION TYPE
// ============================================
interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// ============================================
// MAP VIEW MODEL
// ============================================
export const useMapViewModel = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Selected clinic
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);

  // Map ref
  const mapRef = useRef<any>(null);

  // Initial region - will be set to user location
  const [initialRegion, setInitialRegion] = useState<MapRegion>({
    latitude: 43.4516,
    longitude: -80.4925,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Get shared data from context
  const {
    clinics, // Shared clinics from context
    loading, // Shared loading state
    error, // Shared error state
    refreshClinics, // Shared refresh function
    userLocation,
    radius,
    setRadius,
    showAllClinics,
    setShowAllClinics,
    showFilters,
    setShowFilters,
    radiusRef,
    showAllClinicsRef,
    userLocationRef,
  } = useFilters();

  // ============================================
  // SET INITIAL REGION WHEN USER LOCATION CHANGES
  // ============================================
  useEffect(() => {
    if (userLocation) {
      setInitialRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      setPermissionGranted(true);
    }
  }, [userLocation]);

  // Track last clinics count to detect when list changes
  const lastClinicsCountRef = useRef(0);

  // ============================================
  // FOCUS MAP ON FIRST CLINIC OR USER LOCATION
  // ============================================
  useEffect(() => {
    if (!mapRef.current || loading) return;

    const location = userLocationRef.current;
    const clinicsCount = clinics.length;
    const clinicsChanged = clinicsCount !== lastClinicsCountRef.current;

    // Update ref
    lastClinicsCountRef.current = clinicsCount;

    // If clinics exist and list changed, focus on first clinic
    if (clinicsCount > 0 && clinicsChanged) {
      const firstClinic = clinics[0];

      setTimeout(() => {
        mapRef.current?.animateToRegion(
          {
            latitude: firstClinic.latitude,
            longitude: firstClinic.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          750
        );
        // Select first clinic
        setSelectedClinicId(firstClinic.id);
      }, 300);
    }
    // If no clinics but user location exists and list changed, focus on user location
    else if (clinicsCount === 0 && location && clinicsChanged) {
      setTimeout(() => {
        mapRef.current?.animateToRegion(
          {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          500
        );
        setSelectedClinicId(null);
      }, 300);
    }
  }, [clinics, loading, userLocationRef]);

  // ============================================
  // FOCUS ON CLINIC
  // ============================================
  const focusOnClinic = useCallback(
    (clinicId: string) => {
      const clinic = clinics.find((c) => c.id === clinicId);
      if (!clinic || !mapRef.current) return;

      setSelectedClinicId(clinicId);

      mapRef.current.animateToRegion(
        {
          latitude: clinic.latitude,
          longitude: clinic.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        400
      );
    },
    [clinics]
  );

  // ============================================
  // FOCUS ON USER LOCATION
  // ============================================
  const focusOnUser = useCallback(() => {
    const location = userLocationRef.current;
    if (!location || !mapRef.current) return;

    setSelectedClinicId(null);

    mapRef.current.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      400
    );
  }, [userLocationRef]);

  // ============================================
  // APPLY FILTERS
  // ============================================
  const applyFilters = useCallback(async () => {
    console.log(
      `Applying filters - radius: ${radiusRef.current}, showAll: ${showAllClinicsRef.current}`
    );
    setShowFilters(false);
    // Explicitly refresh clinics when Apply is clicked
    await refreshClinics();
  }, [setShowFilters, radiusRef, showAllClinicsRef, refreshClinics]);

  // ============================================
  // HANDLE CARD SCROLL - Focus on clinic
  // ============================================
  const onCardScrollEnd = useCallback(
    (index: number) => {
      if (index >= 0 && index < clinics.length) {
        const clinic = clinics[index];
        setSelectedClinicId(clinic.id);

        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: clinic.latitude,
              longitude: clinic.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            300
          );
        }
      }
    },
    [clinics]
  );

  return {
    // Data - use shared clinics from context
    clinics,
    userLocation,
    selectedClinicId,
    initialRegion,

    // State - use shared loading/error from context
    loading,
    error,
    permissionGranted,

    // Filters (from shared context)
    radius,
    setRadius,
    showAllClinics,
    setShowAllClinics,
    showFilters,
    setShowFilters,

    // Ref
    mapRef,

    // Actions
    fetchClinics: refreshClinics,
    focusOnClinic,
    focusOnUser,
    applyFilters,
    onCardScrollEnd,
    setSelectedClinicId,
  };
};

export default useMapViewModel;
