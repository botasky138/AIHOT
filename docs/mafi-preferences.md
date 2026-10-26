# MAFi：设备阅读偏好（赞/踩）

2026-10-26（Asia/Tokyo）。本机试运行说明，描述当前实现，不是对外产品承诺。

## Cookie：`mafi_device`

- 含义：匿名设备 UUID，服务端按 `(device_id, article_id)` 保存赞/踩；未登录时只认设备。
- 属性：`HttpOnly`、`SameSite=Lax`、`Path=/`、约 400 天（`Max-Age=34560000`）；站点为 HTTPS 时加 `Secure`。
- 用途：仅影响该设备在动态（`/all`+pool）、精选（`/`+timeline）、热点上的**阅读排序视图**，并在个性化响应中附带 `myVote`。
- 清除：删除浏览器中的 `mafi_device` Cookie 即失去本机偏好视图；公开排序与公开缓存不受影响。服务端可能仍保留历史反应行（撤销投票会把 `vote` 置为 `null`，不删行）。

## 不影响采集

投票**不会**改 `sources.interval_minutes` / `next_fetch_at`，也不会调用 `scheduleDueSources` 或 `adaptIntervals`。采集调度与公开池、全局精选席位、日报保持原样。

## 相关接口（实现现状）

- `POST /api/site/reactions`：同域、限流（设备优先，回退 IP）；正文 `{ itemId, vote: "up"|"down"|null }`。
- 带有效 Cookie 的 site 列表/详情：`Cache-Control: private, no-store`；无 Cookie 的公开响应保持 public cache，且不含 `myVote`。
