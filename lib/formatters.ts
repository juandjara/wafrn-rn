import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { getEnvironmentStatic } from './api/auth'

dayjs.extend(relativeTime)

export function formatMediaUrl(url?: string, mediaUrl?: string) {
  if (!url) {
    return ''
  }

  const env = getEnvironmentStatic()
  if (url.startsWith('http')) {
    return url
  }
  if (url.startsWith('?')) {
    return url
  }
  return `${mediaUrl || env?.MEDIA_URL}/${url.startsWith('/') ? url.slice(1) : url}`
}

export function formatDate(date: string) {
  return new Date(date).toLocaleString()
}

export function formatUserUrl(url?: string) {
  if (!url) {
    return ''
  }
  return url.startsWith('@') ? url : `@${url}`
}

export function formatTimeAgo(date: string) {
  const day = dayjs(new Date(date))
  const timeAgoLong = day.fromNow()
  if (timeAgoLong === 'a few seconds ago') {
    return 'now'
  }

  const formatTimeAgo = timeAgoLong
    .replace(/ years?/, 'y')
    .replace(/ months?/, 'mo')
    .replace(/ days?/, 'd')
    .replace(/ hours?/, 'h')
    .replace(/ minutes?/, 'm')
    .replace(/ seconds?/, 's')
    .replace(/^one|^an|^a/, '1')

  return formatTimeAgo
}

function formatCacheHost(host?: string) {
  if (!host) {
    host = getEnvironmentStatic().CACHE_HOST
  }
  return host.startsWith('http') ? host : `https://${host}`
}

export function formatHeaderUrl(userId: string, cacheHost?: string) {
  if (!userId) {
    return ''
  }
  const host = formatCacheHost(cacheHost)
  return `${host}/api/v2/cache/header/${userId}`
}
export function formatAvatarUrl(userId: string, cacheHost?: string) {
  if (!userId) {
    return ''
  }
  const host = formatCacheHost(cacheHost)
  return `${host}/api/v2/cache/avatar/${userId}`
}
export function formatMediaIdUrl(mediaId: string, cacheHost?: string) {
  const host = formatCacheHost(cacheHost)
  return `${host}/api/v2/cache/media/${mediaId}`
}
export function formatEmojiUrl(emojiId: string, cacheHost?: string) {
  const host = formatCacheHost(cacheHost)
  return `${host}/api/v2/cache/emoji/${emojiId}`
}
export function formatFaviconUrl(pageUrl: string, cacheHost?: string) {
  const host = formatCacheHost(cacheHost)
  return `${host}/api/v2/cache/favicon/${encodeURIComponent(pageUrl)}`
}
