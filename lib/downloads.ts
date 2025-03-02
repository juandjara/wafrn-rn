import { cacheDirectory, makeDirectoryAsync, getInfoAsync, downloadAsync } from 'expo-file-system'
import { showToastError, showToastSuccess } from './interaction'
import { saveToLibraryAsync } from 'expo-media-library'

const CACHE_DIR = `${cacheDirectory}WAFRN/`

async function ensureDownloadDirectory() {
  const dir = await getInfoAsync(CACHE_DIR)
  if (!dir.exists) {
    console.log('WAFRN download directory does not exist, creating...')
    await makeDirectoryAsync(CACHE_DIR, { intermediates: true })
  }
}

async function saveFileToGallery(localUrl: string) {
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
    showToastError('Failed to download file')
  }
}
