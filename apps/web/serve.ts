import { serve } from "bun";
import path from "path";

const server = serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/") {
      return new Response(
        Bun.file(path.join(import.meta.dir, "public/index.html")),
      );
    }

    // Check if the file exists relative to the web package root
    const file = Bun.file(path.join(import.meta.dir, url.pathname.slice(1)));
    if (await file.exists()) {
      return new Response(file);
    }

    // Check in dist folder
    const distFile = Bun.file(path.join(import.meta.dir, "dist", url.pathname));
    if (await distFile.exists()) {
      return new Response(distFile);
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Listening on http://localhost:${server.port}`);
