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

type AtBlob = {
  $type: 'blob'
  mimeType: 'image/png'
  ref: { $link: string }
  size: number
}
export type RPGSpriteRecord = {
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
type Record<T = unknown> = {
  cid: string
  uri: string
  value: T
}
type RecordList<T = unknown> = {
  cursor: 'string'
  records: Record<T>[]
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

export type RPGItem = {
  cid: string
  iconUrl: string
  title: string
  description: string
  context: string
}

async function getDidDoc(did: string, signal?: AbortSignal) {
  const url = `${SLINGSHOT_URL}/xrpc/com.bad-example.identity.resolveMiniDoc?identifier=${did}`
  const data = await getJSON(url, { signal })
  return data as MiniDidDoc
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

async function listRecords<T>({
  did,
  collection,
  limit = 5,
  signal,
}: {
  did: string
  collection: string
  limit?: number
  signal?: AbortSignal
}) {
  const { pds } = await getDidDoc(did, signal)
  const url = `${pds}/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=${collection}&limit=${limit}`
  const data = await getJSON(url, { signal })
  return data as RecordList<T>
}

async function getSpritesheetRecord(did: string, signal?: AbortSignal) {
  const list = await listRecords<RPGSpriteRecord>({
    did,
    collection: SPRITE_COLLECTION,
    signal,
  })
  const record = list.records.find((r) => r.uri.endsWith(RKEY))
  return record ?? null
}

export async function getRPGSprite(did: string, signal?: AbortSignal) {
  const { pds } = await getDidDoc(did, signal)
  const spritesheetRecord = await getSpritesheetRecord(did, signal)
  if (!spritesheetRecord) {
    return null
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

export async function getRPGItems(did: string, signal?: AbortSignal) {
  const { pds } = await getDidDoc(did, signal)
  const list = await listRecords<RPGItemRecord>({
    did,
    collection: ITEM_COLLECTION,
  })
  return list.records.map((r) => {
    const { icon, title, description, context } = r.value
    const cid = icon.ref.$link
    const iconUrl = buildBlobUrl({ pds, did, cid })
    return { cid, iconUrl, title, description, context }
  })
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
    queryFn: ({ signal }) => fetchRPGData(did, signal),
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
      showToastError(`Failed getting rpg.actor data: ${err.message}`)
    },
  })
}
