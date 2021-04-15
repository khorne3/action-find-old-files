import cp from 'child_process'
import { FileList } from './model'
import { promises as fs } from 'fs'
import { basename, join } from 'path'
import { getInput, setOutput, debug } from '@actions/core'

const FILES = 'stale-docs.json'
const DIRS = JSON.parse(getInput('dirs'))
const MIN_AGE = parseInt(getInput('minAge'))

/**
 * Read files from directory recursively
 */
async function getFiles(dir: string): Promise<string[]> {
  try {
    const dirPath = join(process.env.GITHUB_WORKSPACE, dir)
    debug('dirPath: ' + dirPath)
    const items = await fs.readdir(dirPath, { withFileTypes: true })
    debug('items: ' + JSON.stringify(items))
    const files = await Promise.all(
      items.map(async (item) => {
        const path = `${dir}/${item.name}`
        const fullPath = join(process.env.GITHUB_WORKSPACE, dir, item.name)
        const res = await fs.lstat(fullPath)
        debug('res: ' + JSON.stringify(res))

        return res.isDirectory() ? getFiles(path) : path
      }),
    )

    return Array.prototype.concat(...files)
  } catch (error) {
    console.error(`Get files ${error}`)
  }
}

/**
 * Find docs
 */
async function findStaleDocs(): Promise<FileList> {
  const result: FileList = {}

  try {
    for (const dir of DIRS) {
      const files = await getFiles(dir)

      for (const file of files) {
        // Skip mirrors, check only Markdown files
        if (basename(file).indexOf('mirror') > -1 || !file.endsWith('.md')) continue

        const output = parseInt(cp.execSync('git log -1 --pretty="format:%ct" ' + file, { encoding: 'utf8' }))
        const age = Math.round((Date.now() / 1000 - output) / 86400)

        if (age >= MIN_AGE) {
          result[file] = age
        }
      }
    }
  } catch (error) {
    console.error(`Find stale docs ${error}`)
  }

  return result
}

/**
 * Main function
 */
async function run(): Promise<void> {
  const files = await findStaleDocs()

  await fs.writeFile(FILES, JSON.stringify(files, null, 4))
  setOutput('files', FILES)

  console.log(`Finished: ${FILES}`)
}

try {
  run()
} catch (err) {
  console.error(err)
}
