import { Stack, usePathname } from "expo-router";
import { View } from "react-native";
import { ActiveTokenBar } from "../../src/components/ActiveTokenBar";

export default function PrivateLayout() {
  const pathname = usePathname();
  const isClinicDetails = pathname?.includes("clinic-details");

  return (
    <View style={{ flex: 1, backgroundColor: "#FAFBFC" }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="clinic-details/[id]"
          options={{
            headerShown: false,
            presentation: "card",
          }}
        />
      </Stack>

      {!pathname?.includes("tokens") &&
        !pathname?.includes("map") &&
        !isClinicDetails && <ActiveTokenBar />}
    </View>
  );
}
