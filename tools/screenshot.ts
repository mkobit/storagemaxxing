import { chromium } from 'playwright'
import { spawn } from 'child_process'
import * as fs from 'fs'

async function main() {
  console.log('Starting build...')
  const buildProc = spawn('bun', ['run', 'build'], { stdio: 'inherit' })
  await new Promise((resolve) => buildProc.on('close', resolve))

  console.log('Starting server...')
  const serverProc = spawn('bun', ['run', 'serve.ts'], { stdio: 'pipe' })

  let serverStarted = false
  serverProc.stdout.on('data', (data) => {
    const output = data.toString()
    console.log(`[Server]: ${output.trim()}`)
    if (output.includes('Listening on')) {
      serverStarted = true
    }
  })

  serverProc.stderr.on('data', (data) => {
    console.error(`[Server Error]: ${data.toString().trim()}`)
  })

  // Wait for server to start
  let waitCount = 0
  while (!serverStarted && waitCount < 50) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    waitCount++
  }

  if (!serverStarted) {
    console.error('Server failed to start in time.')
    serverProc.kill()
    process.exit(1)
  }

  console.log('Taking screenshot...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })

    // Give it an extra second to render any client-side components completely
    await page.waitForTimeout(1000)

    await page.screenshot({ path: 'screenshot.png', fullPage: true })
    console.log('Screenshot saved to screenshot.png')
  } catch (err) {
    console.error('Error taking screenshot:', err)
  } finally {
    await browser.close()
    serverProc.kill()
    console.log('Server stopped.')
  }
}

main()
