import pkg from '@/package.json'
import { getJSON } from '../http'
import { useQuery } from '@tanstack/react-query'
import { compare } from 'compare-versions'
import { RELEASES_URL } from '../envVars'
import { Platform } from 'react-native'

type FDroidPackage = {
  packageName: string
  suggestedVersionCode: number
  packages: {
    versionName: string
    versionCode: number
  }[]
}

const SIGNATURE_CHANGE_VERSION = '1.13.0'

const NO_UPDATE = {
  tag: '',
  pkg: pkg.version,
  tagIsGreater: false,
  reinstallRequired: false,
}

async function fetchLatestVersion(signal: AbortSignal) {
  try {
    const url = RELEASES_URL
    const json = (await getJSON(url, { signal })) as FDroidPackage
    const tag = json.packages.find(
      (p) => p.versionCode === json.suggestedVersionCode,
    )?.versionName
    if (!tag) {
      return NO_UPDATE
    }
    const tagIsGreater = compare(tag, pkg.version, '>')
    const reinstallRequired =
      compare(tag, SIGNATURE_CHANGE_VERSION, '>=') &&
      compare(pkg.version, SIGNATURE_CHANGE_VERSION, '<')
    return { tag, pkg: pkg.version, tagIsGreater, reinstallRequired }
  } catch (err) {
    console.error('F-Droid is down or having problems', err)
    return NO_UPDATE
  }
}

export function useVersionCheck() {
  return useQuery({
    queryKey: ['version-check'],
    queryFn: ({ signal }) => fetchLatestVersion(signal),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: Platform.OS === 'android',
  })
}
