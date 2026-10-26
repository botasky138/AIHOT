import { defineWebModule } from "@aihot/web/modules";
import { IconChart, IconClock } from "@aihot/web/components/icons";

export default defineWebModule({
  name: "mafi-readers",
  sidebar: { section: "模型", items: [
    { to: "/leaderboard", label: "AA 模型榜", icon: IconChart },
    { to: "/codex-reset", label: "Tibo 重置监控", icon: IconClock },
  ] },
  tabs: [{ key: "models", to: "/leaderboard", label: "模型榜", icon: IconChart }],
  tools: [
    { to: "/codex-reset", label: "Tibo 重置监控", icon: <IconClock size={18} /> },
  ],
  agent: () => import("./web/agent.tsx"),
});
