import { formatCachedUrl, formatMediaUrl } from "../formatters"
import { PostMedia } from "./posts.types"
import { CACHE_HOST } from "../config"
import probe from 'probe-image-size' 
import { Buffer } from 'buffer'

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
  return VIDEO_EXTENSIONS.some((ext) => url.endsWith(ext))
}
export function isAudio(url: string) {
  return AUDIO_EXTENSIONS.some((ext) => url.endsWith(ext))
}
export function isNotAV(url: string) {
  return !isVideo(url) && !isAudio(url) && !isImage(url)
}
export function isSVG(url: string) {
  return url.endsWith('svg')
} 
export function isImage(url: string) {
  const fullUrl = new URL(url)
  const isCDN = fullUrl.host === CACHE_HOST
  let lastPart = fullUrl.pathname.split('/').pop()
  if (isCDN) {
    lastPart = decodeURIComponent(fullUrl.searchParams.get('media') || '')?.split('/').pop()
  }

  const hasExtension = lastPart?.includes('.')
  return !hasExtension || IMG_EXTENSIONS.some((ext) => url.endsWith(ext))
}

export async function getRemoteAspectRatio(url: string) {
  try {
    const res = await fetch(url)
    const abuf = await res.arrayBuffer()
    const meta = await probe.sync(Buffer.from(abuf))
    if (!meta) {
      console.error(`Error getting aspect ratio for image ${url}: probe.sync returned null`)
      return 1
    }
    return meta.height / meta.width
  } catch (error) {
    console.error(`Error getting aspect ratio for image ${url}`, error)
    return 1
  }
}

export async function addSizesToMedias(medias: PostMedia[]) {
  return Promise.all(medias.map(async (media) => {
    const url = formatCachedUrl(formatMediaUrl(media.url))
    if (isImage(url)) {
      const aspectRatio = await getRemoteAspectRatio(url)
      return { ...media, aspectRatio }
    }
    return media
  }))
}
