import { PostMedia } from './posts.types'
import { useMutation, useQuery } from '@tanstack/react-query'
import { isValidURL } from './content'
import { Timestamps } from './types'
import { useAuth } from '../contexts/AuthContext'
import { showToastError, showToastSuccess } from '../interaction'
import { getJSON, uploadFile } from '../http'
import { FileSystemUploadType } from 'expo-file-system'
import { getEnvironmentStatic } from './auth'
import { launchImageLibraryAsync } from 'expo-image-picker'

const AUDIO_EXTENSIONS = [
  'aac',
  'm4a',
  'mp3',
  'oga',
  'ogg',
  'opus',
  'wav',
  'weba',
]
const VIDEO_EXTENSIONS = ['mp4', 'webm']
const IMG_EXTENSIONS = [
  'bmp',
  'gif',
  'ico',
  'jpeg',
  'jpg',
  'png',
  'svg',
  'webp',
  'avif',
  'blob', // weird ¿misskey? thing
  'jfif', // I dont know what this is but it's in the wild
]

export function isVideo(mime: string | undefined, url: string) {
  if (!isValidURL(url)) return false
  return (
    mime?.startsWith('video') ||
    VIDEO_EXTENSIONS.some((ext) => url.endsWith(ext))
  )
}
export function isAudio(mime: string | undefined, url: string) {
  if (!isValidURL(url)) return false
  return (
    mime?.startsWith('audio') ||
    AUDIO_EXTENSIONS.some((ext) => url.endsWith(ext))
  )
}
export function isNotAV(mime: string | undefined, url: string) {
  return !isVideo(mime, url) && !isAudio(mime, url) && !isImage(mime, url)
}
export function isSVG(url: string) {
  if (!isValidURL(url)) return false
  return url.endsWith('svg')
}
export function isImage(mime: string | undefined, url: string) {
  if (!isValidURL(url)) {
    return false
  }

  if (mime?.startsWith('image')) {
    return true
  }

  let fullUrl = new URL(url)
  const env = getEnvironmentStatic()
  const isCDN = fullUrl.host === env?.CACHE_HOST
  if (isCDN) {
    url = decodeURIComponent(fullUrl.searchParams.get('media') || '')
    if (!isValidURL(url)) return false
    fullUrl = new URL(url)
  }
  const hasExtension = fullUrl.pathname.includes('.')
  return (
    !hasExtension ||
    IMG_EXTENSIONS.some((ext) => fullUrl.pathname.endsWith(ext))
  )
}

export function getGIFAspectRatio(media: PostMedia) {
  const sp = new URL(media.url).searchParams
  const h = sp.get('hh') ? Number(sp.get('hh')) : media.width
  const w = sp.get('ww') ? Number(sp.get('ww')) : media.height
  return w && h ? (w / h) : 1
}

export function getAspectRatio(media: PostMedia) {
  return media.width && media.height ? media.height / media.width : 1
}

export type MediaUploadPayload = {
  uri: string
  type: string
  name: string
}

export async function uploadMedia(token: string, payload: MediaUploadPayload) {
  const env = getEnvironmentStatic()
  const url = `${env?.API_URL}/uploadMedia`
  const res = await uploadFile({
    uploadUrl: url,
    fileUri: payload.uri,
    fieldName: 'image',
    httpMethod: 'POST',
    mimeType: payload.type,
    uploadType: FileSystemUploadType.MULTIPART,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })
  const data = res as MediaUploadResponse[]

  return Array.isArray(data) ? data[0] : data
}

export function useMediaUploadMutation() {
  const { token } = useAuth()
  return useMutation({
    mutationKey: ['mediaUpload'],
    mutationFn: (medias: MediaUploadPayload[]) =>
      Promise.all(medias.map((m) => uploadMedia(token!, m))),
    onSuccess: () => {
      showToastSuccess('Media uploaded')
    },
    onError: (err) => {
      console.error(err)
      showToastError('Failed to upload media')
    },
  })
}

export type MediaUploadResponse = Timestamps &
  Omit<PostMedia, 'posts' | 'description' | 'aspectRatio'> & {
    userId: string
    ipUpload: string
  }

export function extensionFromMimeType(mime: string) {
  return (
    mime
      .split('/')
      .pop()
      ?.replace('jpeg', 'jpg')
      .replace('svg+xml', 'svg')
      .replace('x-icon', 'ico') || ''
  )
}

// TODO: Add a switch to support uploading GIF files as avatars
// android will convert gif files to png if allow editing or compression is enabled
export async function pickEditableImage() {
  const result = await launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: true,
    allowsMultipleSelection: false,
    quality: 0.5,
  })
  if (result.canceled) {
    return null
  }
  const img = result.assets[0]
  return {
    uri: img.uri,
    name: img.fileName!,
    type: img.mimeType!,
  }
}

export type LinkPreview = {
  images: string[]
  videos: string[]
  favicons: string[]
  siteName?: string
  title?: string
  description?: string
  url?: string
}

export async function getLinkPreview(link: string) {
  const env = getEnvironmentStatic()
  const data = await getJSON(`${env?.API_URL}/linkPreview/?url=${encodeURIComponent(link)}`)
  return data as LinkPreview
}

export function useLinkPreview(link: string | null) {
  return useQuery({
    queryKey: ['linkPreview', link],
    queryFn: () => getLinkPreview(link!),
    enabled: !!link
  })
}
