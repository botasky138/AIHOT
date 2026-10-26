import { webModules } from "../../site-modules";

export function ModuleItemActions(props: { itemId: string; myVote?: "up" | "down" | null; placement: "card" | "article" | "phone" }) {
  return (
    <>
      {webModules().flatMap((m) => m.itemActions ?? []).map((action) => (
        <action.Component key={action.key} {...props} />
      ))}
    </>
  );
}
