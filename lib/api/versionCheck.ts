import pkg from '@/package.json'
import { getJSON } from '../http'
import { useQuery } from '@tanstack/react-query'
import { compare } from 'compare-versions'

const RELEASES_URL =
  process.env.RELEASES_URL ||
  'https://codeberg.org/api/v1/repos/REPO_OWNER/releases/latest'

let repoOwner = 'wafrn/wafrn-rn'
if (pkg.repository?.url) {
  const parts = pkg.repository?.url.split('/')
  const repo = parts.at(-1)
  const owner = parts.at(-2)
  repoOwner = `${owner}/${repo}`
}

// omited fields: "author", "assets", "archive_download_count"
type CodebergRelease = {
  id: number
  tag_name: string
  target_commitish: string
  name: string
  body: string
  url: string
  html_url: string
  tarball_url: string
  zipball_url: string
  upload_url: string
  hide_archive_links: boolean
  draft: boolean
  prerelease: boolean
  created_at: string // ISO date
  published_at: string // ISO date
}

async function fetchLatestVersion(signal: AbortSignal) {
  try {
    const url = RELEASES_URL.replace('REPO_OWNER', repoOwner)
    const json = (await getJSON(url, { signal })) as CodebergRelease
    let tag = json.tag_name
    if (tag.startsWith('v')) {
      tag = tag.substring(1)
    }
    const tagIsGreater = compare(tag, pkg.version, '>')
    return { tag, pkg: pkg.version, tagIsGreater }
  } catch (err) {
    console.error('Codeberg is down or having problems', err)
    return { tag: '', pkg: pkg.version, tagIsGreater: false }
  }
}

export function useVersionCheck() {
  return useQuery({
    queryKey: ['version-check'],
    queryFn: ({ signal }) => fetchLatestVersion(signal),
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}
