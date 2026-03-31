import { instanceAtom } from './api/auth'

// NOTE: path param can be a full URL or a single path
export default function parseIncomingPath(_path: string) {
  let path = _path.slice()
  try {
    // create a copy of the original path so you can later use the original in the search url
    const url = new URL(path, 'wafrn:///')
    const instance = instanceAtom.get()
    const instanceHost = new URL(instance).host
    const host = url.host ?? instanceHost

    // base replacements to turn web routes into app routes
    if (path.includes('fediverse/')) {
      path = path.replace('fediverse/', '')
    }
    if (path.includes('blog/')) {
      path = path.replace('blog/', 'user/')
    }
    if (path.includes('/resetPassword/')) {
      const parts = path.split('/')
      const code = parts.pop()
      const email = decodeURIComponent(parts.pop() ?? '')
      path = `/complete-password-reset?code=${code}&email=${email}`
    }
    if (path.includes('/activate/')) {
      const parts = path.split('/')
      const code = parts.pop()
      const email = decodeURIComponent(parts.pop() ?? '')
      path = `/activate-account?code=${code}&email=${email}`
    }

    // extra checks for links on other instances
    if (host !== instanceHost) {
      if (path.includes('user/')) {
        path = path.replace('user/', 'user/@')
        path = `${path}@${host}`
      }
      if (path.includes('post/')) {
        path = `/search?q=${_path}`
      }
    }
  } catch (err) {
    console.error(
      '[parseIncomingPath]: error checking for url redirection: ',
      err,
    )
  }
  return path
}
