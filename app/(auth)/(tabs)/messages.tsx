import Dashboard from "@/components/dashboard/Dashboard";
import Header, { HEADER_HEIGHT } from "@/components/Header";
import { DashboardMode } from "@/lib/api/dashboard";
import useSafeAreaPadding from "@/lib/useSafeAreaPadding";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Text, View } from "react-native";

export default function Messages() {
  const sx = useSafeAreaPadding()
  const bottomTabBarHeight = useBottomTabBarHeight()
  
  return (
    <View style={{ flex: 1, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header title='Direct Messages' />
      <Dashboard
        mode={DashboardMode.PRIVATE}
        bottomPadding={bottomTabBarHeight}
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
