import { cacheDirectory, makeDirectoryAsync, getInfoAsync, downloadAsync } from 'expo-file-system'
import { unfurlCacheUrl } from './formatters'
import { showToast } from './interaction'
import colors from 'tailwindcss/colors'
import { saveToLibraryAsync } from 'expo-media-library'

const CACHE_DIR = `${cacheDirectory}WAFRN/`

async function ensureDownloadDirectory() {
  const dir = await getInfoAsync(CACHE_DIR)
  if (!dir.exists) {
    console.log('WAFRN directory does not exist, creating...')
    await makeDirectoryAsync(CACHE_DIR, { intermediates: true })
  }
}

async function saveFileToGallery(localUrl: string) {
  await saveToLibraryAsync(localUrl)
}

export async function downloadFile(url: string) {
  const name = unfurlCacheUrl(url).split('/').pop()
  try {
    await ensureDownloadDirectory()
    const file = await downloadAsync(url, `${CACHE_DIR}${name}`)
    console.log('Downloaded file', file.uri)
    await saveFileToGallery(file.uri)
    console.log('Saved file to gallery')
    showToast('Downloaded file', colors.green[100], colors.green[900])
  } catch (e) {
    console.error('Failed to download file', e)
    showToast('Failed to download file', colors.red[100], colors.red[900])
  }
}
