import { QueueProvider } from "@/src/context/QueueContext";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Toaster } from "sonner-native";
import CustomSplashScreen from "../src/components/CustomSplashScreen";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { FilterProvider } from "../src/context/FilterContext";

SplashScreen.preventAutoHideAsync();

/**
 * Function: RootLayoutNav
 * Purpose: Manages the main navigation stack, enforces authentication protection, and provides global contexts.
 * i/p: None (Uses hooks: useAuth, useSegments, useRouter)
 * o/p: JSX.Element (The Navigation Stack wrapped in Providers or a Loading Screen)
 */
function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const hasInitializedRef = React.useRef(false);
  const initialAuthCheckDoneRef = React.useRef(false);

  /**
   * Effect: Initial Authentication Check
   * Purpose: Handles the first-time redirection logic when the app mounts.
   *          Ensures the user is routed to the correct group ((public) vs (patient)) based on auth state.
   */
  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (isLoading) {
      initialAuthCheckDoneRef.current = false;
      return;
    }
    if (!initialAuthCheckDoneRef.current) {
      initialAuthCheckDoneRef.current = true;
    }

    // Logic: If user exists, redirect away from public routes. If not, redirect to login.
    if (user) {
      const currentRouteGroup = segments[0];
      const inAuthGroup = currentRouteGroup === "(public)";

      if (inAuthGroup) {
        if (user.role === "STAFF") {
          router.replace("/(staff)/(tabs)");
        } else if (user.role === "ADMIN") {
          router.replace("/(admin)/(tabs)");
        } else if (user.role === "PATIENT") {
          router.replace("/(patient)/(tabs)");
        }
      } else {
        const isOnCorrectRoute =
          (user.role === "STAFF" && currentRouteGroup === "(staff)") ||
          (user.role === "ADMIN" && currentRouteGroup === "(admin)") ||
          (user.role === "PATIENT" && currentRouteGroup === "(patient)");

        if (!isOnCorrectRoute) {
          if (user.role === "STAFF") {
            router.replace("/(staff)/(tabs)");
          } else if (user.role === "ADMIN") {
            router.replace("/(admin)/(tabs)");
          } else if (user.role === "PATIENT") {
            router.replace("/(patient)/(tabs)");
          }
        }
      }
    } else {
      const inAuthGroup = segments[0] === "(public)";
      if (!inAuthGroup) {
        router.replace("/(public)/login");
      }
    }

    hasInitializedRef.current = true;

    // Small delay to ensure navigation container is fully mounted before rendering child screens
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [isLoading, user, segments, router]);

  /**
   * Effect: Reactive Authentication Check
   * Purpose: Monitors changes in user state or route segments after initialization.
   *          Acts as a guard to prevent unauthorized access if the user logs out or tries to navigate manually.
   */
  useEffect(() => {
    if (!hasInitializedRef.current || !isNavigationReady) return;

    const currentRouteGroup = segments[0];
    const inAuthGroup = currentRouteGroup === "(public)";

    if (user) {
      // If user is on public routes, redirect to their role-based route
      if (inAuthGroup) {
        if (user.role === "STAFF") {
          router.replace("/(staff)/(tabs)");
        } else if (user.role === "ADMIN") {
          router.replace("/(admin)/(tabs)");
        } else if (user.role === "PATIENT") {
          router.replace("/(patient)/(tabs)");
        }
      } else {
        // User is authenticated but check if they're on the correct route group
        const isOnCorrectRoute =
          (user.role === "STAFF" && currentRouteGroup === "(staff)") ||
          (user.role === "ADMIN" && currentRouteGroup === "(admin)") ||
          (user.role === "PATIENT" && currentRouteGroup === "(patient)");

        if (!isOnCorrectRoute) {
          // Redirect to correct route based on role
          if (user.role === "STAFF") {
            router.replace("/(staff)/(tabs)");
          } else if (user.role === "ADMIN") {
            router.replace("/(admin)/(tabs)");
          } else if (user.role === "PATIENT") {
            router.replace("/(patient)/(tabs)");
          }
        }
      }
    } else if (!user && !inAuthGroup) {
      // User is not authenticated but on protected routes
      router.replace("/(public)/login");
    }
  }, [user, segments, router, isNavigationReady]);

  // Show splash screen while auth is loading or navigation isn't ready
  const isInitialLoading = isLoading && !initialAuthCheckDoneRef.current;
  if (isInitialLoading || !isNavigationReady) {
    return <CustomSplashScreen />;
  }

  return (
    <FilterProvider>
      <QueueProvider>
        <View style={{ flex: 1 }}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="(public)" />
            <Stack.Screen name="(patient)" />
            <Stack.Screen name="(staff)" />
            <Stack.Screen name="(admin)" />
          </Stack>
          <Toaster position="top-center" richColors />
        </View>
      </QueueProvider>
    </FilterProvider>
  );
}

/**
 * Function: RootLayout
 * Purpose: The main entry point component for the Expo Router.
 *          Handles global app initialization (resources, splash screen) and wraps the app in the AuthProvider.
 * i/p: None
 * o/p: JSX.Element (GestureHandlerRootView wrapping the application)
 */
export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  /**
   * Effect: App Preparation
   * Purpose: Simulates resource loading or performs actual async setup before hiding the splash screen.
   */
  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load any resources here (fonts, initial data, etc.)
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return <CustomSplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
