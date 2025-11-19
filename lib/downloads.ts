import { Paths, Directory, File } from 'expo-file-system'
import {
  saveToLibraryAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-media-library'
import * as Device from 'expo-device'
import { useToasts } from './toasts'
import { useMutation } from '@tanstack/react-query'

const CACHE_DIR = Paths.join(Paths.cache, 'WAFRN')

function ensureDownloadDirectory() {
  const dir = new Directory(CACHE_DIR)
  if (!dir.exists) {
    console.log('WAFRN download directory does not exist, creating...')
    dir.create({ intermediates: true })
  }
}

export async function saveFileToGallery(localUrl: string) {
  if (Device.isDevice) {
    const prevPerm = await getPermissionsAsync(true)
    if (!prevPerm.granted) {
      if (!prevPerm.canAskAgain) {
        throw new Error(
          'Download permission missing. Check the write storage permission for this app in the settings of your device',
        )
      }
      const newPerm = await requestPermissionsAsync(true)
      if (!newPerm.granted) {
        throw new Error('Download permission not granted')
      }
    }
  }
  await saveToLibraryAsync(localUrl)
}

export async function downloadFile(url: string, name: string) {
  ensureDownloadDirectory()
  const result = await File.downloadFileAsync(url, new File(CACHE_DIR, name))
  return result.uri
}

export type DownloadToGalleryPayload = {
  url: string
  filename: string
}

export function useDownloadToGalleryMutation() {
  const { showToastSuccess, showToastError } = useToasts()
  return useMutation<void, Error, DownloadToGalleryPayload>({
    mutationKey: ['download-to-gallery'],
    mutationFn: async ({ url, filename }) => {
      const uri = await downloadFile(url, filename)
      await saveFileToGallery(uri)
    },
    onSuccess: () => showToastSuccess('Downloaded to gallery'),
    onError: () => showToastError('Failed to download'),
  })
}
