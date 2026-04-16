import { serve } from 'bun'

const server = serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url)
    if (url.pathname === '/') {
      return new Response(Bun.file('public/index.html'))
    }

    // Check if the file exists
    const file = Bun.file(url.pathname.slice(1))
    if (await file.exists()) {
      return new Response(file)
    }

    // Check in dist folder
    const distFile = Bun.file(`dist${url.pathname}`)
    if (await distFile.exists()) {
      return new Response(distFile)
    }

    return new Response('Not found', { status: 404 })
  },
})

console.log(`Listening on http://localhost:${server.port}`)
