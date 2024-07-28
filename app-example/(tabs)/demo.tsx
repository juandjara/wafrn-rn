import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Picker } from '@react-native-picker/picker';
import { View, Text } from "react-native";
import { cssInterop } from 'nativewind'
import colors from 'tailwindcss/colors'

const TPicker = cssInterop(Picker<any>, {
  className: 'style',
})
const TPickerItem = cssInterop((Picker<any>).Item, {
  className: 'style',
})

const options = [
  { label: 'Public', value: 0 },
  { label: 'Unlisted', value: 5 },
  { label: 'Instance Only', value: 10 },
  { label: 'Followers Only', value: 20 },
  { label: 'Direct', value: 30 },
]

export default function Demo() {
  const insets = useSafeAreaInsets()
  const padding = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  }

  const [privacy, setPrivacy] = useState(0)

  return (
    <View style={padding}>
      <View className="p-3">
        <Text className="text-white">Demo text</Text>
        <View style={{ marginTop: 8, borderWidth: 1, borderColor: 'white' }}>
          <TPicker
            mode='dropdown'
            className="text-white bg-zinc-800"
            dropdownIconColor={'white'}
            selectedValue={privacy}
            onValueChange={(itemValue, itemIndex) =>
              setPrivacy(itemValue)
            }>
            {options.map((opt) => (
              <TPickerItem
                key={opt.value}
                label={opt.label}
                value={opt.value}
                style={{
                  color: colors.white,
                  backgroundColor: colors.zinc[800],
                }}
              />
            ))}
          </TPicker>
        </View>
      </View>
    </View>
  )
};
