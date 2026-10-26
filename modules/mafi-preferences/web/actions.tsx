import { useEffect, useState } from "react";
import type { ReactionResult, Vote } from "../contracts.ts";
import { nextVote, submitReaction } from "./controller.ts";

export interface ItemActionProps {
  itemId: string;
  myVote?: Vote;
  placement: "card" | "article" | "phone";
}

function Thumb({
  kind, pressed, busy, onClick, placement,
}: {
  kind: "up" | "down";
  pressed: boolean;
  busy: boolean;
  onClick: () => void;
  placement: ItemActionProps["placement"];
}) {
  const label = kind === "up" ? "赞同" : "不感兴趣";
  const glyph = kind === "up" ? "👍" : "👎";
  const size = placement === "phone" ? "size-11 text-[15px]" : placement === "article" ? "size-8 text-[14px]" : "size-11 lg:size-[26px] text-[13px] lg:text-[12px]";
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      disabled={busy}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className={`relative z-10 inline-flex shrink-0 items-center justify-center rounded-control border transition-colors duration-150 ${size} ${
        pressed
          ? "border-accent/70 bg-bg-sunk text-accent"
          : "border-transparent text-ink-4 hover:border-line-strong hover:bg-bg-sunk hover:text-ink-2"
      } disabled:opacity-50`}
    >
      <span aria-hidden>{glyph}</span>
    </button>
  );
}

export function ThumbsButtons({ itemId, myVote = null, placement }: ItemActionProps) {
  const [vote, setVote] = useState<Vote>(myVote ?? null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setVote(myVote ?? null); }, [myVote]);
  useEffect(() => {
    const onPref = (e: Event) => {
      const detail = (e as CustomEvent<ReactionResult>).detail;
      if (detail?.itemId === itemId) setVote(detail.myVote);
    };
    window.addEventListener("mafi:preferences-changed", onPref);
    return () => window.removeEventListener("mafi:preferences-changed", onPref);
  }, [itemId]);
  const click = async (kind: "up" | "down") => {
    const desired = nextVote(vote, kind);
    const prev = vote;
    setVote(desired);
    setBusy(true);
    try {
      const result = await submitReaction(itemId, desired);
      setVote(result.myVote);
    } catch {
      setVote(prev);
    } finally {
      setBusy(false);
    }
  };
  return (
    <span className="inline-flex items-center gap-0.5">
      <Thumb kind="up" pressed={vote === "up"} busy={busy} placement={placement} onClick={() => void click("up")} />
      <Thumb kind="down" pressed={vote === "down"} busy={busy} placement={placement} onClick={() => void click("down")} />
    </span>
  );
}
