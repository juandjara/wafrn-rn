import { useState } from 'react'
import {
  DEFAULT_PUBLIC_OPTIONS,
  getPrivateOptionValue,
  getPublicOptionValue,
  PrivateOptionNames,
  PrivateOptionTypeMap,
  PublicOptionNames,
  PublicOptionTypeMap,
  useSettings,
} from './api/settings'
import { useCurrentUser, useEditProfileMutation } from './api/user'

export type OptionName = PrivateOptionNames | PublicOptionNames
type OptionValueMap = PrivateOptionTypeMap & PublicOptionTypeMap

// editProfile top-level booleans that settings screens can edit alongside options
export type ProfileFlagName =
  | 'manuallyAcceptsFollows'
  | 'hideFollows'
  | 'hideProfileNotLoggedIn'
  | 'disableEmailNotifications'

function isPublicOption(key: OptionName): key is PublicOptionNames {
  return key in DEFAULT_PUBLIC_OPTIONS
}

/**
 * Form state + save flow hook shared by the settings screens.
 * It seeds the listed option keys (and optionally editProfile boolean flags)
 * from the current server values assuming settings/currentUser are already
 * in the query cache when the screen opens.
 *
 * It also joins new options with profile flags for sending them to useEditProfileMutation
 */
export function useOptionsForm<
  K extends OptionName,
  P extends ProfileFlagName = never,
>(optionKeys: readonly K[], profileFlagKeys: readonly P[] = []) {
  const { data: settings } = useSettings()
  const { data: me } = useCurrentUser()
  const editMutation = useEditProfileMutation()

  type FormState = {
    [T in K]: OptionValueMap[T]
  } & {
    [F in P]: boolean
  }

  const [form, setForm] = useState<FormState>(() => {
    const opts = settings?.options || []
    const values = {} as Record<string, unknown>
    for (const key of optionKeys) {
      values[key] = isPublicOption(key)
        ? getPublicOptionValue(opts, key)
        : getPrivateOptionValue(opts, key)
    }
    for (const flag of profileFlagKeys) {
      values[flag] = (me?.[flag] as boolean) || false
    }
    return values as FormState
  })

  function update<T extends keyof FormState>(
    key: T,
    value: FormState[T] | ((prev: FormState[T]) => FormState[T]),
  ) {
    setForm((prev) => {
      const newValue = typeof value === 'function' ? value(prev[key]) : value
      return { ...prev, [key]: newValue }
    })
  }

  /** overrides can replace form values at save time for using with validation or type coercion */
  function submit(overrides?: Partial<FormState>) {
    const values = { ...form, ...overrides }
    const profileFlags = Object.fromEntries(
      profileFlagKeys.map((flag) => [flag, values[flag]]),
    )
    const newOptions = optionKeys.map((key) => ({
      name: key,
      value: JSON.stringify(values[key]),
    }))
    editMutation.mutate({ ...profileFlags, options: newOptions })
  }

  return { form, update, submit, isPending: editMutation.isPending }
}
