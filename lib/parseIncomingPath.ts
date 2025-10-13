export default function parseIncomingPath(path: string) {
  try {
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
  } catch (err) {
    console.error(
      '[parseIncomingPath]: error checking for url redirection: ',
      err,
    )
  }
  return path
}
