import { PostMedia } from "./posts.types"
import { BASE_URL, CACHE_HOST } from "../config"
import { useMutation } from "@tanstack/react-query"
import { isValidURL } from "./content"
import { Timestamps } from "./types"
import { useAuth } from "../contexts/AuthContext"
import { showToastError, showToastSuccess } from "../interaction"
import { uploadFile } from "../http"
import { FileSystemUploadType } from "expo-file-system"

const AUDIO_EXTENSIONS = [
  'aac',
  'm4a',
  'mp3',
  'oga',
  'ogg',
  'opus',
  'wav',
  'weba'
]
const VIDEO_EXTENSIONS = [
  'mp4',
  'webm'
]
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
  'jfif' // I dont know what this is but it's in the wild
]

export function isVideo(mime: string | undefined, url: string) {
  if (!isValidURL(url)) return false
  return mime?.startsWith('video') || VIDEO_EXTENSIONS.some((ext) => url.endsWith(ext))
}
export function isAudio(mime: string | undefined, url: string) {
  if (!isValidURL(url)) return false
  return mime?.startsWith('audio') || AUDIO_EXTENSIONS.some((ext) => url.endsWith(ext))
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
  const isCDN = fullUrl.host === CACHE_HOST
  if (isCDN) {
    url =  decodeURIComponent(fullUrl.searchParams.get('media') || '')
    if (!isValidURL(url)) return false
    fullUrl = new URL(url)
  }
  const hasExtension = fullUrl.pathname.includes('.')
  return !hasExtension || IMG_EXTENSIONS.some((ext) => fullUrl.pathname.endsWith(ext))
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
  const url = `${BASE_URL}/api/uploadMedia`
  const res = await uploadFile({
    uploadUrl: url,
    fileUri: payload.uri,
    fieldName: 'image',
    httpMethod: 'POST',
    mimeType: payload.type,
    uploadType: FileSystemUploadType.MULTIPART,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    }
  })
  const data = res as MediaUploadResponse[]

  return Array.isArray(data) ? data[0] : data
}

export function useMediaUploadMutation() {
  const { token } = useAuth()
  return useMutation({
    mutationKey: ['mediaUpload'],
    mutationFn: (medias: MediaUploadPayload[]) => Promise.all(medias.map(m => uploadMedia(token!, m))),
    onSuccess: () => {
      showToastSuccess('Media uploaded')
    },
    onError: (err) => {
      console.error(err)
      showToastError('Failed to upload media')
    }
  })
}

export type MediaUploadResponse = Timestamps
  & Omit<PostMedia, 'posts' | 'description' | 'aspectRatio'>
  & {
    userId: string
    ipUpload: string
  }
