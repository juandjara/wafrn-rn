import { cacheDirectory, makeDirectoryAsync, getInfoAsync, downloadAsync } from 'expo-file-system'
import { showToastError, showToastSuccess } from './interaction'
import { saveToLibraryAsync, getPermissionsAsync, requestPermissionsAsync } from 'expo-media-library'
import * as Device from 'expo-device';

const CACHE_DIR = `${cacheDirectory}WAFRN/`

async function ensureDownloadDirectory() {
  const dir = await getInfoAsync(CACHE_DIR)
  if (!dir.exists) {
    console.log('WAFRN download directory does not exist, creating...')
    await makeDirectoryAsync(CACHE_DIR, { intermediates: true })
  }
}

async function saveFileToGallery(localUrl: string) {
  if (Device.isDevice) {
    const prevPerm = await getPermissionsAsync(true)
    if (!prevPerm.granted) {
      if (!prevPerm.canAskAgain) {
        throw new Error('Download permission missing. Check the write storage permission for this app in the settings of your device')
      }
      const newPerm = await requestPermissionsAsync(true)
      if (!newPerm.granted) {
        throw new Error('Download permission not granted')
      }
    }
  }
  await saveToLibraryAsync(localUrl)
}

export async function downloadFile(url: string, name: string, saveToGallery = true) {
  try {
    await ensureDownloadDirectory()
    const file = await downloadAsync(url, `${CACHE_DIR}${name}`)
    if (saveToGallery) {
      await saveFileToGallery(file.uri)
      showToastSuccess('Downloaded file')
    }
    return file
  } catch (e) {
    console.error('Failed to download file', e)
    showToastError(`Failed to download file: ${e}`)
  }
}
