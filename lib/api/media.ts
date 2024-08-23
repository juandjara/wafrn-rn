import { formatCachedUrl, formatMediaUrl } from "../formatters"
import { PostMedia } from "./posts.types"
import { CACHE_HOST } from "../config"
import probe from 'probe-image-size' 
import { Buffer } from 'buffer'
import { useQuery } from "@tanstack/react-query"
import { isValidURL } from "./content"

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
]

export function isVideo(url: string) {
  if (!isValidURL(url)) return false
  return VIDEO_EXTENSIONS.some((ext) => url.endsWith(ext))
}
export function isAudio(url: string) {
  if (!isValidURL(url)) return false
  return AUDIO_EXTENSIONS.some((ext) => url.endsWith(ext))
}
export function isNotAV(url: string) {
  return !isVideo(url) && !isAudio(url) && !isImage(url)
}
export function isSVG(url: string) {
  if (!isValidURL(url)) return false
  return url.endsWith('svg')
} 
export function isImage(url: string) {
  if (!isValidURL(url)) return false
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

export function useAspectRatio(media: PostMedia) {
  const url = formatCachedUrl(formatMediaUrl(media.url))
  const { data } = useQuery({
    queryKey: ['aspectRatio', media.url],
    queryFn: () => getRemoteAspectRatio(url),
    enabled: isImage(url)
  })
  return data || 1
}

export async function getRemoteAspectRatio(url: string) {
  return 1
  // try {
  //   const res = await fetch(url)
  //   const abuf = await res.arrayBuffer()
  //   const meta = probe.sync(Buffer.from(abuf))
  //   if (!meta) {
  //     console.error(`Error getting aspect ratio for image ${url}: probe.sync returned null`)
  //     return 1
  //   }
  //   return meta.height / meta.width
  // } catch (error) {
  //   console.error(`Error getting aspect ratio for image ${url}`, error)
  //   return 1
  // }
}
