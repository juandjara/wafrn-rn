#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

let baseDir = ''
if (typeof __dirname !== 'undefined') {
  baseDir = __dirname
} else {
  baseDir = process.cwd()
}
const ROOT = path.resolve(baseDir, '..')

const GRADLE_FILE = path.resolve(ROOT, 'android/app/build.gradle')

function main() {
  const gradleFile = fs.readFileSync(GRADLE_FILE, 'utf8')
  const test = "applicationId 'dev.djara.wafrn_rn.dev'"

  if (gradleFile.includes(test)) {
    throw new Error(
      'Development environment detected. Deploying to production is not allowed. Run `npm run setup:prod` to set up the production environment.',
    )
  }
}
main()
