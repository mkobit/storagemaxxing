import { serve } from "bun";
import path from "path";

const server = serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    
    // Attempt to serve from package root (for index.html)
    const rootFile = Bun.file(path.join(import.meta.dir, pathname));
    if (await rootFile.exists()) {
      return new Response(rootFile);
    }

    // Attempt to serve from src or other locations
    const file = Bun.file(path.join(import.meta.dir, pathname.slice(1)));
    if (await file.exists()) {
      return new Response(file);
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Listening on http://localhost:${server.port}`);
