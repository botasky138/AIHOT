import { apiGet } from "@aihot/web/lib/api.server";
import type { ReadResult } from "../contracts.ts";

export async function readPage<T>(endpoint: string, sourceUrl: string, request: Request): Promise<ReadResult<T>> {
  return apiGet<ReadResult<T>>(endpoint, { signal: request.signal }).catch(() => ({
    status: "unavailable", sourceUrl, fetchedAt: null, nextRefreshAt: null, data: null,
    message: "暂时无法连接数据源，请稍后再看或打开来源页面。",
  }));
}
