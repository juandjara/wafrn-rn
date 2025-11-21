import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  BackHandler,
} from 'react-native'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import Header, { HEADER_HEIGHT } from '@/components/Header'
import { useRef, useState } from 'react'
import { useToasts } from '@/lib/toasts'

const FAIL_MESSAGES = [
  'You die! No more wafrn for you',
  'You have waf your last rn',
  'That is enough wafrn for today',
  'You die! Now go touch some grass',
  'You die! Now time to forever sleep',
  'See you in the next life',
]

const SUCCESS_MESSAGES = [
  'You win! If you ever see me in person, I owe you a beer.',
  'You win the price to best wafrn user, you can say it in your bio',
  'You win! A shipment of blahjas is on its way to you /j',
  'You win! Here, have a little gold star ⭐',
  'You win! Now go tell your mom you are a winner',
  'You win! Now go tell your friends you are a winner',
]

export default function RollScreen() {
  const sx = useSafeAreaPadding()
  const [rolls, setRolls] = useState<number[]>([])
  const [isRolling, setIsRolling] = useState(false)
  const [isDead, setIsDead] = useState(false)
  const movingValue = useRef(new Animated.Value(0)).current
  const rotation = movingValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })
  const { showToastDarkSouls, showToastInfo, showToastSuccess } = useToasts()

  const animation = useRef(
    Animated.loop(
      Animated.timing(movingValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
    ),
  ).current

  function processRoll() {
    const newRoll = Math.min(6, Math.round(Math.random() * 5) + 1)
    setRolls([...rolls, newRoll])

    if (newRoll === 6) {
      showToastSuccess(getSuccessMessage())
    }
    if (newRoll === 1) {
      showToastDarkSouls(getFailMessage())
      setIsDead(true)
      setTimeout(() => {
        BackHandler.exitApp()
      }, 3000)
    }
    if (newRoll !== 6 && newRoll !== 1) {
      showToastInfo('Try again?')
    }
  }

  function getFailMessage() {
    return FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)]
  }

  function getSuccessMessage() {
    return SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]
  }

  function rollDice() {
    if (isDead) {
      return
    }

    if (isRolling) {
      setIsRolling(false)
      animation.reset()
      processRoll()
    } else {
      setIsRolling(true)
      animation.start()
    }
  }

  const lastRoll = rolls[rolls.length - 1]
  const dices = '⚀⚁⚂⚃⚄⚅'.split('')
  const lastDice = dices[lastRoll - 1]

  return (
    <View style={{ ...sx, flex: 1, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header title="Try your luck" />
      <Pressable
        onPress={rollDice}
        className="flex-1 px-5 justify-center items-center"
        style={{ paddingBottom: sx.paddingBottom }}
      >
        {isRolling ? (
          <Animated.View
            style={{
              transform: [{ rotate: rotation }],
            }}
          >
            <Text className="text-6xl text-white leading-tight text-center">
              {lastDice || '🎲'}
            </Text>
          </Animated.View>
        ) : (
          <View className={isRolling ? '' : 'animate-bounce'}>
            <Text className="text-6xl text-white leading-tight text-center">
              {lastDice || '🎲'}
            </Text>
          </View>
        )}
        <View className="mt-6 mb-8">
          <Text className="text-white text-xl text-center mb-2">
            Tap to{' '}
            <Text className="font-bold">{isRolling ? 'stop' : 'roll'}</Text> the
            dice
          </Text>
          <Text className="my-1 text-white text-sm text-center">
            If you get a 6, you will see some nice words.
          </Text>
          <Text className="text-white text-sm text-center">
            If you get a 1, you are dead.
          </Text>
        </View>
        <View className="border-t border-white rounded-lg py-6">
          <Text className="text-white text-sm text-center">
            You survived {rolls.length} rolls
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-4 justify-center items-center">
          {rolls.map((roll, index) => (
            <Text
              key={index}
              className="text-white text-4xl text-center w-10 h-10"
            >
              {dices[roll - 1]}
            </Text>
          ))}
        </View>
      </Pressable>
    </View>
  )
}
