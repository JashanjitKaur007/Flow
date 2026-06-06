import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ============================================
// RADIUS OPTIONS
// ============================================
const RADIUS_OPTIONS = [
  { label: "5", value: 5 },
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "200", value: 200 },
  { label: "500", value: 500 },
];

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ============================================
// FILTER BOTTOM SHEET COMPONENT
// ============================================
interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  radius: number;
  setRadius: (r: number) => void;
  showAllClinics: boolean;
  setShowAllClinics: (v: boolean) => void;
  onApply: () => void;
}

export const FilterBottomSheet = React.memo<FilterBottomSheetProps>(
  ({
    visible,
    onClose,
    radius,
    setRadius,
    showAllClinics,
    setShowAllClinics,
    onApply,
  }) => {
    // Memoize handlers to prevent re-renders
    const handleApply = React.useCallback(() => {
      onApply();
    }, [onApply]);

    const handleSetRadius = React.useCallback(
      (value: number) => {
        setRadius(value);
      },
      [setRadius]
    );

    const handleSetShowAllClinics = React.useCallback(
      (value: boolean) => {
        setShowAllClinics(value);
      },
      [setShowAllClinics]
    );
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const prevVisibleRef = useRef(visible);
    const isAnimatingRef = useRef(false);
    const [shouldRender, setShouldRender] = React.useState(visible);
    const isClosingRef = useRef(false);

    // Show/hide animation - only trigger on visible prop change
    React.useEffect(() => {
      // Only animate if visible state actually changed
      if (prevVisibleRef.current === visible) return;
      prevVisibleRef.current = visible;

      if (visible) {
        // Reset closing flag
        isClosingRef.current = false;
        // Ensure component is rendered
        setShouldRender(true);
        // Reset to initial position before animating in
        translateY.setValue(SCREEN_HEIGHT);
        overlayOpacity.setValue(0);
        isAnimatingRef.current = true;

        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 150,
          }),
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          isAnimatingRef.current = false;
        });
      } else if (!isClosingRef.current) {
        // Only animate out if not already closing (prevents double animation)
        // This handles the case when visible prop changes externally
        isAnimatingRef.current = true;
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          isAnimatingRef.current = false;
          setShouldRender(false); // Hide component after animation
        });
      }
    }, [visible]);

    // Store onClose in ref for pan responder
    const onCloseRef = React.useRef(onClose);
    React.useEffect(() => {
      onCloseRef.current = onClose;
    }, [onClose]);

    // Handle close with animation
    const handleClose = React.useCallback(() => {
      if (isAnimatingRef.current || isClosingRef.current) return; // Prevent multiple calls

      isClosingRef.current = true;
      isAnimatingRef.current = true;

      // Start the close animation
      // Keep shouldRender true during entire animation so Modal stays visible
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        isAnimatingRef.current = false;

        // Wait a bit to ensure animation is fully visible, then hide Modal
        setTimeout(() => {
          setShouldRender(false);

          // Call onClose after Modal is hidden
          // This updates parent state but component should still be mounted briefly
          setTimeout(() => {
            onCloseRef.current();
            isClosingRef.current = false;
          }, 50);
        }, 50);
      });
    }, [translateY, overlayOpacity]);

    // Store handleClose in ref for pan responder
    const handleCloseRef = React.useRef(handleClose);
    React.useEffect(() => {
      handleCloseRef.current = handleClose;
    }, [handleClose]);

    // Pan responder for drag to dismiss
    const panResponder = React.useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return gestureState.dy > 5;
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 80 || gestureState.vy > 0.5) {
            // Use handleClose for smooth animation
            handleCloseRef.current();
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              damping: 20,
            }).start();
          }
        },
      })
    ).current;

    if (!shouldRender) return null;

    return (
      <Modal
        visible={shouldRender}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        {/* Overlay - covers entire screen */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.sheetOverlay,
            { opacity: overlayOpacity },
          ]}
          pointerEvents="box-none"
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={handleClose}
          />
        </Animated.View>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY }], paddingBottom: insets.bottom + 16 },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Drag Handle */}
          <View {...panResponder.panHandlers} style={styles.handleArea}>
            <View style={styles.sheetHandle} />
          </View>

          {/* Compact Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filters</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Show All Toggle */}
          <View style={styles.sheetRow}>
            <Text style={styles.sheetRowLabel}>Show all clinics</Text>
            <Switch
              value={showAllClinics}
              onValueChange={handleSetShowAllClinics}
              trackColor={{ false: "#E2E8F0", true: "#0165FC" }}
              thumbColor="white"
              style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
            />
          </View>

          {/* Radius Chips */}
          {!showAllClinics && (
            <View style={styles.radiusSection}>
              <Text style={styles.sheetRowLabel}>Distance (km)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.radiusChipsContainer}
              >
                {RADIUS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.radiusChip,
                      radius === option.value && styles.radiusChipSelected,
                    ]}
                    onPress={() => handleSetRadius(option.value)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.radiusChipText,
                        radius === option.value &&
                          styles.radiusChipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Apply Button */}
          <TouchableOpacity
            style={styles.sheetApplyBtn}
            onPress={handleApply}
            activeOpacity={0.8}
          >
            <Text style={styles.sheetApplyText}>Apply</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    );
  }
);

FilterBottomSheet.displayName = "FilterBottomSheet";

const styles = StyleSheet.create({
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  handleArea: {
    paddingVertical: 12,
    alignItems: "center",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#DEE2E6",
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1E293B",
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sheetRowLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#475569",
  },
  radiusSection: {
    paddingVertical: 14,
  },
  radiusChipsContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  radiusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  radiusChipSelected: {
    backgroundColor: "#0165FC",
    borderColor: "#0165FC",
  },
  radiusChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  radiusChipTextSelected: {
    color: "white",
  },
  sheetApplyBtn: {
    backgroundColor: "#0165FC",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  sheetApplyText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
});
