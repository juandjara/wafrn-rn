import { getItemAsync, deleteItemAsync, setItemAsync } from 'expo-secure-store'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

export async function setStorageItemAsync(key: string, value: string | null) {
  if (value === null) {
    await deleteItemAsync(key)
  } else {
    await setItemAsync(key, value)
  }
}
export async function getStorageItemAsync(key: string) {
  try {
    return getItemAsync(key)
  } catch (err) {
    console.error('Error getting value from SecureStore: ', err)
  }
  return null
}

export default function useAsyncStorage<T = unknown>(
  key: string,
  defaultValue?: T,
) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['getAsyncStorage', key],
    queryFn: async () => {
      const value = await getStorageItemAsync(key)
      return value ? (JSON.parse(value) as T) : defaultValue || null
    },
    placeholderData: keepPreviousData,
  })
  const mutation = useMutation<void, Error, T | null>({
    mutationKey: ['setAsyncStorage', key],
    mutationFn: async (value) => {
      const serializedValue = value ? JSON.stringify(value) : null
      await setStorageItemAsync(key, serializedValue)
      await refetch()
    },
  })
  const loading = isLoading || mutation.isPending

  return useMemo(
    () => ({
      loading,
      value: data || null,
      setValue: (value: T | null) => mutation.mutateAsync(value),
    }),
    [loading, data, mutation],
  )
}
