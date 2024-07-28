import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function useSafeAreaPadding() {
  const sx = useSafeAreaInsets()
  return {
    paddingTop: sx.top,
    paddingBottom: sx.bottom,
    paddingLeft: sx.left,
    paddingRight: sx.right,
  }
}
