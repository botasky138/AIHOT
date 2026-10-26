import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { loadItemDetail } from "@aihot/backend/publication/detail";
import { config } from "@aihot/backend/config";
import { sql } from "@aihot/backend/db";
import { ITEM_ID_RE, type Vote } from "../contracts.ts";
import { deviceSetCookie, newDeviceId, readDeviceId } from "./identity.ts";
import { checkReactionLimit } from "./limits.ts";
import { setReaction } from "./store.ts";

function siteOrigin(): string {
  return new URL(config.siteUrl).origin;
}

function sameOrigin(req: FastifyRequest): boolean {
  const site = siteOrigin();
  const origin = req.headers.origin;
  if (origin === "null") return false;
  if (origin) return origin === site;
  const fetchSite = String(req.headers["sec-fetch-site"] ?? "");
  if (fetchSite === "cross-site") return false;
  return true;
}

function clientIp(req: FastifyRequest): string {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.trim()) return xf.split(",")[0]!.trim();
  return req.ip;
}

function secureCookie(): boolean {
  return new URL(config.siteUrl).protocol === "https:";
}

function problem(reply: FastifyReply, status: number, code: string, detail: string, retryAfter?: number) {
  if (retryAfter) reply.header("Retry-After", retryAfter);
  return reply.code(status).header("Cache-Control", "private, no-store").type("application/problem+json").send({
    type: `https://aihot.news/problems/${code}`,
    title: code,
    status,
    detail,
  });
}

export function registerReactionRoutes(app: FastifyInstance) {
  app.post("/api/site/reactions", { bodyLimit: 1024 }, async (req, reply) => {
    if (!sameOrigin(req)) return problem(reply, 403, "forbidden", "cross-origin reaction rejected");
    const ip = clientIp(req);
    let deviceId = readDeviceId(req.headers.cookie);
    const limit = checkReactionLimit({ deviceId, ip });
    if (!limit.allowed) return problem(reply, 429, "rate_limited", "too many reactions", limit.retryAfter);

    const body = req.body as { itemId?: unknown; vote?: unknown };
    if (!body || typeof body !== "object") return problem(reply, 400, "invalid_request", "JSON body required");
    const itemId = body.itemId;
    const vote = body.vote as Vote | undefined;
    if (typeof itemId !== "string" || !ITEM_ID_RE.test(itemId)) return problem(reply, 400, "invalid_request", "invalid itemId");
    if (!(vote === "up" || vote === "down" || vote === null)) return problem(reply, 400, "invalid_request", "vote must be up, down, or null");

    const detail = await loadItemDetail(itemId);
    if (detail.kind === "not_found") return problem(reply, 404, "not_found", "item not found");

    const [pub] = await sql<{ source_id: string }[]>`
      SELECT source_id FROM publications WHERE article_id = ${itemId} LIMIT 1`;
    if (!pub) return problem(reply, 404, "not_found", "item not found");

    if (!deviceId) deviceId = newDeviceId();
    const result = await setReaction(deviceId, itemId, vote, pub.source_id);
    reply.header("Cache-Control", "private, no-store");
    // Renew 400d cookie on every successful write (mint or refresh).
    reply.header("Set-Cookie", deviceSetCookie(deviceId, secureCookie()));
    return reply.send(result);
  });
}
