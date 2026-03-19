import { Paths, Directory, File } from 'expo-file-system'
import {
  saveToLibraryAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-media-library'
import * as Device from 'expo-device'
import { useToasts } from './toasts'
import { useMutation } from '@tanstack/react-query'
import { extensionFromMimeType } from './api/media'
import { getUserAgent, handleFetchError } from './http'

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

async function fetchMimeType(url: string) {
  const res = await fetch(url, {
    method: 'HEAD',
    headers: {
      'User-Agent': getUserAgent(),
    },
  })
  if (!res.ok) {
    await handleFetchError(url, res)
  }
  const mime = res.headers.get('Content-Type')
  if (!mime) {
    throw new Error('No Content-Type for this image URL')
  }
  return mime
}

export async function downloadFile(url: string, mime: string) {
  if (!mime) {
    mime = await fetchMimeType(url)
  }
  ensureDownloadDirectory()
  const basename = new URL(url).pathname.split('/').at(-1)!
  const name = `${basename}.${extensionFromMimeType(mime)}`
  let path = new File(CACHE_DIR, name)
  if (path.exists) {
    path = new File(CACHE_DIR, `copy_${Date.now()}_${name}`)
  }
  const result = await File.downloadFileAsync(url, path)
  return result.uri
}

export type DownloadToGalleryPayload = {
  url: string
  mime: string
}

export function useDownloadToGalleryMutation() {
  const { showToastSuccess, showToastError } = useToasts()
  return useMutation<void, Error, DownloadToGalleryPayload>({
    mutationKey: ['download-to-gallery'],
    mutationFn: async ({ url, mime }) => {
      const uri = await downloadFile(url, mime)
      await saveFileToGallery(uri)
    },
    onSuccess: () => showToastSuccess('Downloaded to gallery'),
    onError: (error) => {
      console.error('Error downloading file:', error)
      showToastError('Failed to download')
    },
  })
}
