import { Paths, Directory, File } from 'expo-file-system'
import {
  saveToLibraryAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-media-library'
import * as Device from 'expo-device'
import { getUserAgent, handleFetchError } from './http'

const CACHE_DIRNAME = 'WAFRN'

export type UploadableFile = {
  uri: string
  name?: string
  type?: string
}

function getCachePath() {
  return Paths.join(Paths.cache, CACHE_DIRNAME)
}

function ensureCacheDir() {
  const dir = new Directory(getCachePath())
  if (!dir.exists) {
    dir.create({ intermediates: true })
  }
}

async function ensureMediaLibraryPermission() {
  if (!Device.isDevice) return
  const prev = await getPermissionsAsync(true)
  if (prev.granted) return
  if (!prev.canAskAgain) {
    throw new Error(
      'Download permission missing. Check the write storage permission for this app in the settings of your device',
    )
  }
  const next = await requestPermissionsAsync(true)
  if (!next.granted) {
    throw new Error('Download permission not granted')
  }
}

async function fetchMimeType(url: string): Promise<string> {
  const ua = getUserAgent()
  const res = await fetch(url, {
    method: 'HEAD',
    headers: ua ? { 'User-Agent': ua } : {},
  })
  if (!res.ok) {
    await handleFetchError(url, res)
  }
  const mime = res.headers.get('Content-Type')
  if (!mime) {
    throw new Error('No Content-Type for this URL')
  }
  return mime
}

function extensionFromMimeType(mime: string) {
  return (
    mime
      .split('/')
      .pop()
      ?.replace('jpeg', 'jpg')
      .replace('svg+xml', 'svg')
      .replace('x-icon', 'ico') || ''
  )
}

export async function getUploadableFile({
  uri,
}: UploadableFile): Promise<Blob> {
  // expo-file-system's File implements Blob, so FormData accepts it directly.
  return new File(uri) as unknown as Blob
}

export async function writeBase64ToCache(
  filename: string,
  base64: string,
  _mimeType: string,
): Promise<string> {
  ensureCacheDir()
  const file = new File(getCachePath(), filename)
  file.write(base64, { encoding: 'base64' })
  return file.uri
}

export async function saveTextToDevice(
  filename: string,
  text: string,
  _mimeType: string,
): Promise<void> {
  ensureCacheDir()
  const file = new File(getCachePath(), filename)
  file.write(text)
  await ensureMediaLibraryPermission()
  await saveToLibraryAsync(file.uri)
}

export async function fetchToLocalUri(
  url: string,
  filename: string,
): Promise<string> {
  ensureCacheDir()
  let path = new File(getCachePath(), filename)
  if (path.exists) {
    path = new File(getCachePath(), `copy_${Date.now()}_${filename}`)
  }
  const result = await File.downloadFileAsync(url, path)
  return result.uri
}

export async function downloadToDevice(
  url: string,
  mime: string,
): Promise<void> {
  ensureCacheDir()
  if (!mime) {
    mime = await fetchMimeType(url)
  }
  const basename = new URL(url).pathname.split('/').at(-1)!
  const name = `${basename}.${extensionFromMimeType(mime)}`
  let path = new File(getCachePath(), name)
  if (path.exists) {
    path = new File(getCachePath(), `copy_${Date.now()}_${name}`)
  }
  const result = await File.downloadFileAsync(url, path)
  await ensureMediaLibraryPermission()
  await saveToLibraryAsync(result.uri)
}
