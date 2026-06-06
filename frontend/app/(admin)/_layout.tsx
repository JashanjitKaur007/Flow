import { Stack } from "expo-router";
import { View } from "react-native";

export default function PrivateLayout() {
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
          name="admin-edit-profile/index"
          options={{
            headerShown: false,
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="edit-clinic/[id]"
          options={{
            headerShown: false,
            presentation: "card",
          }}
        />
      </Stack>
    </View>
  );
}
