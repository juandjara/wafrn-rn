import { PostMedia } from "./posts.types"
import { BASE_URL, CACHE_HOST } from "../config"
import { useMutation } from "@tanstack/react-query"
import { isValidURL } from "./content"
import { Timestamps } from "./types"
import { useAuth } from "../contexts/AuthContext"
import { showToast } from "../interaction"
import colors from "tailwindcss/colors"
import { getJSON } from "../http"

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
  return media.width && media.height ? media.width / media.height : 1
}

type UploadPayload = {
  uri: string
  type: string
  name: string
}

export async function uploadMedia(token: string, payload: UploadPayload) {
  const formData = new FormData()
  // turns out that the React Native implementation of FormData can read local files if given a file:// URI inside an object
  formData.append('image', payload as any)
  const response = await getJSON(`${BASE_URL}/api/uploadMedia`, {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    }
  })
  const data = response as MediaUploadResponse[]
  return Array.isArray(data) ? data[0] : data
}

export function useMediaUploadMutation() {
  const { token } = useAuth()
  return useMutation({
    mutationKey: ['mediaUpload'],
    mutationFn: (medias: UploadPayload[]) => Promise.all(medias.map(m => uploadMedia(token!, m))),
    onSuccess: () => {
      showToast('Media uploaded', colors.green[100], colors.green[900])
    },
    onError: (err) => {
      console.error(err)
      showToast('Failed to upload media', colors.red[100], colors.red[900])
    }
  })
}

export type MediaUploadResponse = Timestamps
  & Omit<PostMedia, 'posts' | 'description' | 'aspectRatio'>
  & {
    userId: string
    ipUpload: string
  }
