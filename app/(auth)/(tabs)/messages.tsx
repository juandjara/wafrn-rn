import Dashboard from "@/components/dashboard/Dashboard";
import { DashboardMode } from "@/lib/api/dashboard";
import { Stack } from "expo-router";
import { Text, View } from "react-native";

export default function Messages() {
  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          headerTitle: 'Direct Messages'
        }}
      />
      <Dashboard
        mode={DashboardMode.PRIVATE} 
        header={
          <Text className="text-white text-sm p-3">
            <Text className="font-bold">Attention: </Text>
            Private messages are not encrypted point to point.
            Do not share any sensitive information.
            Admins both of your instance and the target instance can read the DMs.
          </Text>
        }
      />
    </View>
  )
}
