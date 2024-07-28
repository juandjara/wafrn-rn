import { Platform } from "react-native";
import { getItemAsync, deleteItemAsync, setItemAsync } from 'expo-secure-store'
import { useMutation, useQuery } from "@tanstack/react-query";

async function setStorageItemAsync(key: string, value: string | null) {
  if (Platform.OS === 'web') {
    try {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.error('Local storage is unavailable:', e);
    }
  } else {
    if (value === null) {
      await deleteItemAsync(key);
    } else {
      await setItemAsync(key, value);
    }
  }
}
async function getStorageItemAsync(key: string) {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key)
      }
      console.error('Error: localStorage is not defined in window');
    } catch (e) {
      console.error('Error getting value from localStorage: ', e);
    }
  } else {
    try {
      return getItemAsync(key);
    } catch (err) {
      console.error('Error getting value from SecureStore: ', err);
    }
  }
  return null
}

export default function useAsyncStorage<T = unknown>(key: string) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['getAsyncStorage', key],
    queryFn: async () => {
      const value = await getStorageItemAsync(key);
      return value ? JSON.parse(value) as T : null;
    },
  })
  const mutation = useMutation<void, Error, T | null>({
    mutationKey: ['setAsyncStorage', key],
    mutationFn: async (value) => {
      const serializedValue = value ? JSON.stringify(value) : null;
      await setStorageItemAsync(key, serializedValue);
      await refetch();
    },
  })

  const loading = isLoading || mutation.isPending;
  return {
    loading,
    value: data || null,
    setValue: mutation.mutateAsync,
  }
}
