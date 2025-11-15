import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import {
  Button,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Colors } from '@/constants/Colors'
import { Toasts } from '@backpackapp-io/react-native-toast'
import { Image } from 'expo-image'
import { z } from 'zod'
import { Field, Form } from 'houseform'
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  renderers,
} from 'react-native-popup-menu'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { GENDERS } from '@/lib/genders'
import { MediaUploadPayload, pickEditableImage } from '@/lib/api/media'
import { router } from 'expo-router'
import { useRegisterMutation } from '@/lib/api/user'
import { showToastSuccess } from '@/lib/interaction'
import { useCSSVariable } from 'uniwind'

const bigW = require('@/assets/images/logo_w.png')

type RegisterFormState = {
  email: string
  password: string
  username: string
  bio: string
  dob: string
  gender: string
  avatar?: MediaUploadPayload
}

const minDate = new Date()
minDate.setFullYear(minDate.getFullYear() - 18)

function parseDate(input: string) {
  const [d, m, y] = input.split('/').map((n) => Number(n))
  if (!d || !m || !y) {
    return null
  }

  const date = new Date(y, Math.min(0, m - 1), d)
  return date
}

export default function Register() {
  const sx = useSafeAreaPadding()
  const inputTextColor = Colors.dark.text
  const gray600 = useCSSVariable('--color-gray-600') as string

  const mutation = useRegisterMutation()

  function onSubmit(values: RegisterFormState) {
    mutation.mutate(
      {
        email: values.email,
        password: values.password,
        avatar: values.avatar,
        birthDate: parseDate(values.dob)!.toISOString(),
        description: values.bio,
        url: values.username,
      },
      {
        onSuccess: () => {
          showToastSuccess(
            'Registration sent! You will receive an email when an admin approves your application.',
          )
          router.navigate('/sign-in')
        },
      },
    )
  }

  return (
    <View
      className="flex-1 mx-4"
      style={{
        ...sx,
        backgroundColor: Colors.dark.background,
      }}
    >
      <Toasts />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView>
          <Image
            source={bigW}
            style={{
              marginTop: 48,
              width: 120,
              height: 120,
              alignSelf: 'center',
            }}
          />
          <Text className="text-lg text-center text-white my-6">
            Welcome! We hope you enjoy this place!
          </Text>
          <View className="mb-12">
            <Text className="text-center text-gray-200 mb-6">
              An administrator will review your profile before you can join.
              This process can take a few hours.
            </Text>

            <Pressable
              className="flex-row items-center gap-3 mb-2"
              onPress={() => router.back()}
            >
              <View className="bg-black/30 rounded-full p-2">
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={20}
                  color="white"
                />
              </View>
              <Text className="text-gray-200">Back to login</Text>
            </Pressable>

            <Form onSubmit={onSubmit}>
              {({ isValid, submit }) => (
                <View className="mb-6">
                  <Field
                    name="email"
                    onBlurValidate={z
                      .string()
                      .email({ message: 'Invalid email address' })}
                    children={({ value, setValue, onBlur, errors }) => (
                      <View className="my-3">
                        <TextInput
                          autoCapitalize="none"
                          inputMode="email"
                          placeholder="Email"
                          style={{ color: inputTextColor }}
                          className="p-3 border border-gray-500 rounded placeholder:text-gray-400"
                          value={value}
                          onChangeText={setValue}
                          onBlur={onBlur}
                        />
                        {errors.map((error) => (
                          <Text
                            key={error}
                            className="text-xs text-red-600 my-1"
                          >
                            {error}
                          </Text>
                        ))}
                      </View>
                    )}
                  />
                  <Field
                    name="password"
                    onBlurValidate={z
                      .string()
                      .min(8, 'Password must at least 8 characters long')}
                    children={({ value, setValue, onBlur, errors }) => (
                      <View className="my-3">
                        <TextInput
                          secureTextEntry
                          autoCapitalize="none"
                          autoCorrect={false}
                          autoComplete="new-password"
                          placeholder="Password"
                          style={{ color: inputTextColor }}
                          className="p-3 border border-gray-500 rounded placeholder:text-gray-400"
                          value={value}
                          onChangeText={setValue}
                          onBlur={onBlur}
                        />
                        {errors.map((error) => (
                          <Text
                            key={error}
                            className="text-xs text-red-600 my-1"
                          >
                            {error}
                          </Text>
                        ))}
                      </View>
                    )}
                  />
                  <Field
                    name="username"
                    onChangeValidate={z
                      .string()
                      .regex(/^\w+$/, 'Invalid username')}
                    children={({ value, setValue, onBlur, errors }) => (
                      <View className="my-3">
                        <TextInput
                          autoCapitalize="none"
                          placeholder="Your username"
                          style={{ color: inputTextColor }}
                          className="p-3 border border-gray-500 rounded placeholder:text-gray-400"
                          value={value}
                          onChangeText={setValue}
                          onBlur={onBlur}
                        />
                        <Text className="text-xs text-gray-200 my-1">
                          Right now we do not allow special characters nor
                          spaces
                        </Text>
                        {errors.map((error) => (
                          <Text
                            key={error}
                            className="text-xs text-red-600 my-1"
                          >
                            {error}
                          </Text>
                        ))}
                      </View>
                    )}
                  />
                  <Field
                    name="dob"
                    onChangeValidate={z
                      .string()
                      .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Invalid date')
                      .refine(
                        (input) => {
                          const date = parseDate(input)
                          if (!date) {
                            return false
                          }

                          return date.getTime() < minDate.getTime()
                        },
                        {
                          message:
                            'You must be at least 18 years old to use this app',
                        },
                      )}
                    children={({ value, setValue, onBlur, errors }) => (
                      <View className="my-3">
                        <TextInput
                          placeholder="Your birth date"
                          style={{ color: inputTextColor }}
                          className="p-3 border border-gray-500 rounded placeholder:text-gray-400"
                          value={value}
                          onChangeText={setValue}
                          onBlur={onBlur}
                        />
                        <Text className="text-xs text-gray-200 my-1">
                          Format <Text className="font-bold">DD/MM/YYYY</Text> -
                          Your birthday date is required for legal reasons in
                          the EU and the USA. It is not shared with anyone.
                        </Text>
                        {errors.map((error) => (
                          <Text
                            key={error}
                            className="text-xs text-red-600 my-1"
                          >
                            {error}
                          </Text>
                        ))}
                      </View>
                    )}
                  />
                  <Field
                    name="bio"
                    onBlurValidate={z.string()}
                    children={({ value, setValue, onBlur, errors }) => (
                      <View className="my-3">
                        <TextInput
                          multiline
                          numberOfLines={3}
                          placeholder="Describe yourself (optional)"
                          style={{ color: inputTextColor }}
                          className="p-3 border border-gray-500 rounded placeholder:text-gray-400"
                          value={value}
                          onChangeText={setValue}
                          onBlur={onBlur}
                        />
                        <Text className="text-xs text-gray-200 my-1">
                          A short description of yourself so other people can
                          know who you are
                        </Text>
                        {errors.map((error) => (
                          <Text
                            key={error}
                            className="text-xs text-red-600 my-1"
                          >
                            {error}
                          </Text>
                        ))}
                      </View>
                    )}
                  />
                  <Field
                    name="gender"
                    onChangeValidate={z.string()}
                    children={({ value, setValue, errors }) => (
                      <View className="my-3">
                        <Menu
                          onSelect={setValue}
                          renderer={renderers.SlideInMenu}
                        >
                          <MenuTrigger>
                            <View className="flex-row items-center gap-1 rounded p-3 border border-gray-600">
                              <Text className="text-white flex-grow flex-shrink">
                                {value}
                                {!value && (
                                  <Text className="text-gray-400">
                                    Select your gender (or {"don't"})
                                  </Text>
                                )}
                              </Text>
                              <MaterialCommunityIcons
                                name="chevron-down"
                                color={gray600}
                                size={20}
                              />
                            </View>
                          </MenuTrigger>
                          <MenuOptions
                            customStyles={{
                              optionsContainer: {
                                paddingBottom: sx.paddingBottom,
                                maxHeight: '50%',
                              },
                            }}
                          >
                            <ScrollView>
                              {GENDERS.map((gender) => (
                                <MenuOption
                                  key={gender}
                                  onSelect={() => setValue(gender)}
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 16,
                                    padding: 16,
                                  }}
                                >
                                  <Text className="font-semibold flex-shrink flex-grow">
                                    {gender}
                                  </Text>
                                  {value === gender && (
                                    <Ionicons
                                      className="flex-shrink-0"
                                      name="checkmark-sharp"
                                      color="black"
                                      size={24}
                                    />
                                  )}
                                </MenuOption>
                              ))}
                            </ScrollView>
                          </MenuOptions>
                        </Menu>
                        <Text className="text-xs text-gray-200 my-1">
                          This actually does nothing at all
                        </Text>
                        {errors.map((error) => (
                          <Text
                            key={error}
                            className="text-xs text-red-600 my-1"
                          >
                            {error}
                          </Text>
                        ))}
                      </View>
                    )}
                  />
                  <Field
                    name="avatar"
                    onChangeValidate={z.any()}
                    children={({ value, setValue, errors }) => (
                      <View className="items-start my-4">
                        <Text className="text-white mb-2">
                          Avatar{' '}
                          <Text className="text-gray-200 text-xs">
                            (optional)
                          </Text>
                        </Text>
                        <Pressable
                          className="relative bg-black rounded-lg border border-gray-500"
                          onPress={async () => {
                            const image = await pickEditableImage()
                            if (image) {
                              setValue(image)
                            }
                          }}
                        >
                          <Image
                            style={{ width: 150, height: 150 }}
                            source={value}
                            className="rounded-lg"
                          />
                          {value && (
                            <Pressable
                              className="absolute z-20 right-0.5 top-0.5 bg-black/40 rounded-full p-1"
                              onPress={() => setValue(null)}
                            >
                              <MaterialCommunityIcons
                                name="close"
                                size={20}
                                color="white"
                              />
                            </Pressable>
                          )}
                          <View className="absolute z-20 right-1 bottom-1 bg-black/40 rounded-full p-2">
                            <MaterialCommunityIcons
                              name="camera"
                              size={20}
                              color="white"
                            />
                          </View>
                        </Pressable>
                        {errors.map((error) => (
                          <Text
                            key={error}
                            className="text-xs text-red-600 my-1"
                          >
                            {error}
                          </Text>
                        ))}
                      </View>
                    )}
                  />
                  <View className="my-3">
                    <Button
                      disabled={!isValid || mutation.isPending}
                      title="Register"
                      onPress={submit}
                    />
                  </View>
                </View>
              )}
            </Form>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
