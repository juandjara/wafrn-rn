import { fetchToLocalUri } from './files'
import { getJSON } from './http'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { useToasts } from './toasts'
import { useMutation, useQuery } from '@tanstack/react-query'

const SLINGSHOT_URL = 'https://slingshot.microcosm.blue'
const SPRITE_COLLECTION = 'actor.rpg.sprite'
const RKEY = 'self'

const ITEM_COLLECTION = 'equipment.rpg.item'

type MiniDidDoc = {
  did: string
  handle: string
  pds: string
  signing_key: string
}
type Record<T = unknown> = {
  cid: string
  uri: string
  value: T
}
type AtBlob = {
  $type: 'blob'
  mimeType: 'image/png'
  ref: { $link: string }
  size: number
}
type RPGSpriteRecord = {
  $type: typeof SPRITE_COLLECTION
  columns: number
  createdAt: string // iso date
  updatedAt: string
  displayUrl?: string // full http url
  frameHeight: number
  frameWidth: number
  frames: number
  height: number
  width: number
  rows: number
  source: string // at URI
  spriteBackdrop?: string
  spriteSheet: AtBlob
}
type RecordList<T = unknown> = {
  cursor: 'string'
  records: [
    {
      cid: 'string'
      uri: 'string'
      value: T
    },
  ]
}
type RPGItemRecord = {
  $type: typeof ITEM_COLLECTION
  give: string // AT URI
  icon: AtBlob
  item: string
  kind: string
  asset: AtBlob
  title: string
  context: string
  iconCid: string
  assetCid: string
  category: string
  provider: string // DID
  acceptedAt: string
  description: string
}

async function getPDS(did: string, signal?: AbortSignal) {
  const url = `${SLINGSHOT_URL}/xrpc/com.bad-example.identity.resolveMiniDoc?identifier=${did}`
  const data = await getJSON(url, { signal })
  const doc = data as MiniDidDoc
  return doc.pds
}

async function getSpritesheetRecord(
  pds: string,
  did: string,
  signal?: AbortSignal,
) {
  try {
    const url = `${pds}/xrpc/com.atproto.repo.getRecord?repo=${did}&collection=${SPRITE_COLLECTION}&rkey=${RKEY}`
    const data = await getJSON(url, { signal })
    return data as Record<RPGSpriteRecord>
  } catch (err) {
    console.error(err)
    return null
  }
}

export async function getRPGSprite(did: string, signal?: AbortSignal) {
  const pds = await getPDS(did, signal)
  const spritesheetRecord = await getSpritesheetRecord(pds, did, signal)
  if (!spritesheetRecord) {
    const err = new Error(`No rpg.actor data found for this account`)
    err.cause = 404
    throw err
  }

  const filename = `spritesheet-${spritesheetRecord.cid}.png`
  const spriteSheetUrl = buildBlobUrl({
    pds,
    did,
    cid: spritesheetRecord.value.spriteSheet.ref.$link,
  })
  const localSpritesheet = await fetchToLocalUri(spriteSheetUrl, filename)
  const context = ImageManipulator.manipulate(localSpritesheet)
  context.crop({
    originX: 0,
    originY: 0,
    height: spritesheetRecord.value.frameHeight,
    width: spritesheetRecord.value.frameWidth,
  })
  const rendered = await context.renderAsync()
  const result = await rendered.saveAsync({ format: SaveFormat.WEBP })
  context.release()
  return result
}

async function fetchRPGData(did: string, signal?: AbortSignal) {
  const [sprite, items] = await Promise.all([
    getRPGSprite(did, signal),
    getRPGItems(did, signal),
  ])
  return { sprite, items }
}

export function useRPGData(did: string) {
  return useQuery({
    queryKey: ['rpg-data', did],
    queryFn: ({ signal }) => {
      try {
        return fetchRPGData(did, signal)
      } catch (err) {
        console.error(err)
        return null
      }
    },
    enabled: !!did,
  })
}

export function useRPGDataMutation() {
  const { showToastError } = useToasts()
  return useMutation({
    mutationKey: ['rpg-actor-sprite'],
    mutationFn: async (did: string) => {
      if (did) {
        return fetchRPGData(did)
      }
    },
    onError: (err) => {
      console.error(err)
      if (err.cause === 404) {
        showToastError('No rpg.actor data found for this account')
      } else {
        showToastError(`Failed getting rpg.actor data: ${err.message}`)
      }
    },
  })
}

function buildBlobUrl({
  pds,
  did,
  cid,
}: {
  pds: string
  did: string
  cid: string
}) {
  return `${pds}/xrpc/com.atproto.sync.getBlob?cid=${cid}&did=${did}`
}

export async function getRPGItems(did: string, signal?: AbortSignal) {
  const pds = await getPDS(did, signal)
  const url = `${pds}/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=${ITEM_COLLECTION}&limit=5`
  const data = await getJSON(url, { signal })
  const list = data as RecordList<RPGItemRecord>
  return list.records.map((r) => {
    const cid = r.value.icon.ref.$link
    return buildBlobUrl({ pds, did, cid })
  })
}
