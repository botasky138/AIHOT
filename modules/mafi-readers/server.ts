import path from "node:path";
import type { ServerModule } from "@aihot/backend/modules";
import { config } from "@aihot/backend/config";
import { guardedFetch } from "@aihot/backend/lib/http-fetch";
import { FileReaderStore } from "./backend/cache.ts";
import { createReaders, type Readers } from "./backend/readers.ts";

export function createReaderServer(readers?: Readers): ServerModule {
  let service = readers;
  const getReaders = () => service ??= createReaders({ siteUrl: config.siteUrl, aaKey: () => process.env.AA_API_KEY, fetch: guardedFetch, store: new FileReaderStore(path.join(config.dataDir, "mafi-readers")) });
  return {
    name: "mafi-readers",
    http(app) {
      app.addHook("onRequest", async (request, reply) => {
        if (request.url.split("?")[0].startsWith("/api/mafi-readers/")) {
          reply.header("Cache-Control", "private, no-store");
          reply.header("X-Robots-Tag", "noindex, nofollow, noarchive");
        }
      });
      app.get("/api/mafi-readers/codex-resets", async () => getReaders().codexResets());
      app.get("/api/mafi-readers/aa-models", async () => getReaders().aaModels());
    },
  };
}

export default createReaderServer();
