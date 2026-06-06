import { Stack } from "expo-router";
import { View } from "react-native";

export default function StaffLayout() {
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
          name="staff-edit-profile/index"
          options={{
            headerShown: false,
            presentation: "card",
          }}
        />
      </Stack>
    </View>
  );
}
