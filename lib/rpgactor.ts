import { getJSON } from './http'
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

export type RPGSprite = {
  spriteSheetUrl: string
  frameHeight: number
  frameWidth: number
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
  pds,
  did,
  collection,
  limit = 5,
  signal,
}: {
  pds: string
  did: string
  collection: string
  limit?: number
  signal?: AbortSignal
}) {
  const url = `${pds}/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=${collection}&limit=${limit}`
  const data = await getJSON(url, { signal })
  return data as RecordList<T>
}

async function getSpritesheetRecord(did: string, signal?: AbortSignal) {
  const { pds } = await getDidDoc(did, signal)
  const list = await listRecords<RPGSpriteRecord>({
    pds,
    did,
    collection: SPRITE_COLLECTION,
    signal,
  })
  const record = list.records.find((r) => r.uri.endsWith(RKEY))
  if (!record) {
    return null
  }
  const spriteSheetUrl = buildBlobUrl({
    pds,
    did,
    cid: record.value.spriteSheet.ref.$link,
  })
  return {
    spriteSheetUrl,
    frameHeight: record.value.frameHeight,
    frameWidth: record.value.frameWidth,
  } satisfies RPGSprite
}

export function useRPGSpritesheet(did: string) {
  return useQuery({
    queryKey: ['rpg-actor-sprite', did],
    queryFn: ({ signal }) => getSpritesheetRecord(did, signal),
    enabled: !!did,
  })
}

async function getRPGItems(did: string, signal?: AbortSignal) {
  const { pds } = await getDidDoc(did, signal)
  const list = await listRecords<RPGItemRecord>({
    pds,
    did,
    collection: ITEM_COLLECTION,
  })
  return list.records.map((r) => {
    const { icon, title, description, context } = r.value
    const cid = icon.ref.$link
    const iconUrl = buildBlobUrl({ pds, did, cid })
    return { cid, iconUrl, title, description, context } satisfies RPGItem
  })
}

export function useRPGItems(did: string) {
  return useQuery({
    queryKey: ['rpg-actor-items', did],
    queryFn: ({ signal }) => getRPGItems(did, signal),
    enabled: !!did,
  })
}

export function useRPGDataMutation() {
  const { showToastError } = useToasts()
  return useMutation({
    mutationKey: ['rpg-actor-check'],
    mutationFn: (did: string) => getSpritesheetRecord(did),
    onError: (err) => {
      console.error(err)
      showToastError(`Failed getting rpg.actor data: ${err.message}`)
    },
  })
}
