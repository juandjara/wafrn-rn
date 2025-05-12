import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { getEnvironmentStatic } from './api/auth'

dayjs.extend(relativeTime)

export function unfurlCacheUrl(url: string) {
  const env = getEnvironmentStatic()
  if (!url.startsWith(env!.CACHE_URL)) {
    return url
  }
  return decodeURIComponent(url.replace(env!.CACHE_URL, ''))
}

export function formatCachedUrl(url: string) {
  const env = getEnvironmentStatic()
  return `${env?.CACHE_URL}${encodeURIComponent(url)}`
}

export function formatMediaUrl(url?: string) {
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
  return `${env?.MEDIA_URL}/${url.startsWith('/') ? url.slice(1) : url}`
}

export function formatSmallAvatar(link?: string) {
  if (!link) {
    return ''
  }
  const url = formatCachedUrl(formatMediaUrl(link))
  const small = `${url}&avatar=true`
  return small
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
