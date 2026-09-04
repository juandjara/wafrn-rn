import { instanceAtom } from './api/auth'
import instances from '@/instances.json'

/** Reencode path segments into query params */
function reencode(segment: string) {
  return encodeURIComponent(decodeURIComponent(segment))
}

/**
 * Returns a rewritten app route, or null when no rewrite rule was applied,
 * so callers can differentiate rewrites from 404s
 *
 * The incoming path param can be a full http URL, an app path or a wafrn:/// url
 */
export default function parseIncomingPath(_path: string) {
  try {
    // ensure no trailing slash so segment split is stable
    if (_path.endsWith('/')) {
      _path = _path.slice(0, -1)
    }

    const url = new URL(_path, 'wafrn:///')
    const instanceHost = new URL(instanceAtom.get()).host
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:'
    const isWafScheme =
      url.protocol === 'wafrn:' || url.protocol.endsWith('+wafrn:')

    // not interested in mailto: or tel: links
    if (!isHttp && !isWafScheme) {
      return null
    }

    const host = isHttp ? url.host : instanceHost
    const remote = host !== instanceHost

    // do not parse a link that is not local or from a known wafrn instance
    if (remote && !instances.includes(host)) {
      return null
    }

    const segments = url.pathname.split('/').filter(Boolean)
    if (url.protocol === 'wafrn:' && url.host) {
      // wafrn://blog/x (with a double slash) parses 'blog' as the URL host
      segments.unshift(url.host)
    }
    if (segments[0] === '--') {
      // expo dev-client prefix: exp+wafrn://<dev-server>/--/<path>
      segments.shift()
    }
    if (segments[0] === 'fediverse') {
      segments.shift()
    }
    if (segments[0] === 'blog') {
      segments[0] = 'user'
    }

    switch (segments[0]) {
      case 'share':
        return `/editor?${url.searchParams.toString()}`
      case 'dashboard':
        if (segments[1] === 'search' && segments[2]) {
          return `/search?q=${reencode(segments.slice(2).join('/'))}`
        }
        break
      case 'activate':
      case 'resetPassword': {
        const [origRoute, email, code] = segments
        const destRoute =
          origRoute === 'activate'
            ? '/activate-account'
            : '/complete-password-reset'
        return `${destRoute}?code=${reencode(code ?? '')}&email=${reencode(email ?? '')}`
      }
      case 'user':
        if (remote && segments[1] && !segments[1].startsWith('@')) {
          segments[1] = `@${segments[1]}@${host}`
        }
        if (segments[1] && segments[2] === 'ask') {
          return `/user/${segments[1]}?ask=1`
        }
        break
      case 'post':
        if (remote) {
          return `/search?q=${encodeURIComponent(_path)}`
        }
        break
    }

    const path = `/${segments.join('/')}`
    if (path === url.pathname) {
      return null
    }
    return path + url.search
  } catch (err) {
    console.error('[parseIncomingPath]: error checking', err)
    return null
  }
}
