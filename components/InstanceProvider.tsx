import { SAVED_INSTANCE_KEY } from "@/lib/api/auth";
import useAsyncStorage from "@/lib/useLocalStorage";
import { Pressable, Text, View } from "react-native";
import InstancePicker from "./InstancePicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function InstanceProvider({ children }: React.PropsWithChildren) {
  const {
    value: savedInstance,
    setValue: setSavedInstance
  } = useAsyncStorage<string>(SAVED_INSTANCE_KEY)

  if (!savedInstance) {
    return <InstancePicker />
  }

  return (
    <View>
      <View className="flex-row items-center gap-3">
        <Pressable
          className="bg-black/30 rounded-full p-2"
          onPress={() => setSavedInstance(null)}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
        </Pressable>
        <Text className="text-gray-200">
          Connected to {savedInstance}
        </Text>
      </View>
      {children}
    </View>
  )
}
