#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const INSTANCES_FILE = path.resolve(ROOT, 'instances.json')

const INSTANCES_URL =
  process.env.INSTANCES_URL || 'https://join.wafrn.net/instances.json'

function parseUrl(fullUrl) {
  try {
    const url = new URL(fullUrl)
    return url.host
  } catch (err) {
    console.error('Failed parsing url', fullUrl, err)
    return null
  }
}

async function main() {
  console.log(`Fetching instance list from ${INSTANCES_URL}`)
  const res = await fetch(INSTANCES_URL)
  if (!res.ok) {
    console.error('Error fetching instances: ', await res.text())
    throw new Error(
      `fetch to ${INSTANCES_URL} failed with a code ${res.status} ${res.statusText}`,
    )
  }
  const json = await res.json()
  const domains = Array.from(
    new Set(json.map((d) => parseUrl(d.url)).filter((d) => d !== null)),
  )
  const domainsText = JSON.stringify(domains, null, 2)
  console.log(`Saving instance list to ${INSTANCES_FILE}`)
  fs.writeFileSync(INSTANCES_FILE, domainsText)
}

try {
  await main()
} catch (err) {
  console.error('Error fetching instances list: ', err)
}
