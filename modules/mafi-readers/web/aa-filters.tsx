import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { IconBookmark, IconCheck, IconChevronDown, IconChevronRight, IconMinus, IconSearch } from "@aihot/web/components/icons";
import {
  collectTreeModelIds,
  filterAaModelTree,
  type AaModelTreeFamily,
  type AaModelTreeOrg,
} from "./aa-rank.ts";

const triggerClass =
  "flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-control border border-line bg-transparent px-3 text-left text-[13px] text-ink outline-none transition-colors hover:border-line-strong focus:border-accent";
const popoverClass =
  "absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-card border border-line bg-surface shadow-[var(--shadow-pop)]";
const optionClass =
  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-ink-2 transition-colors hover:bg-bg-sunk hover:text-ink";

function useDismissible(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  return ref;
}

function CheckboxMark({ checked, indeterminate = false }: { checked: boolean; indeterminate?: boolean }) {
  const on = checked || indeterminate;
  return (
    <span
      aria-hidden="true"
      className={`inline-flex size-4 shrink-0 items-center justify-center rounded-mark border transition-colors ${on ? "border-accent bg-accent text-accent-contrast" : "border-line-strong bg-transparent"}`}
    >
      {indeterminate && !checked ? <IconMinus size={11} strokeWidth={3} /> : checked ? <IconCheck size={11} strokeWidth={3} /> : null}
    </span>
  );
}

export function DarkSingleSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
  formatOption,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  formatOption?: (option: { value: T; label: string }) => string;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const ref = useDismissible(open, close);
  const listId = useId();
  const current = options.find((option) => option.value === value);
  const display = current ? (formatOption?.(current) ?? current.label) : String(value);

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={triggerClass}
        onClick={() => setOpen((next) => !next)}
      >
        <span className="min-w-0 truncate">{display}</span>
        <IconChevronDown size={14} className={`shrink-0 text-ink-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div id={listId} role="listbox" aria-label={label} className={`${popoverClass} max-h-64 overflow-y-auto py-1`}>
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={selected}
                className={`${optionClass} ${selected ? "bg-bg-sunk text-ink" : ""}`}
                onClick={() => {
                  onChange(option.value);
                  close();
                }}
              >
                <span className="min-w-0 flex-1 truncate">{formatOption?.(option) ?? option.label}</span>
                {selected ? <IconCheck size={14} className="shrink-0 text-accent" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function DarkMultiSelect({
  label,
  summary,
  options,
  selected,
  onChange,
  searchPlaceholder = "搜索…",
  emptyLabel = "没有匹配项",
  searchable = true,
}: {
  label: string;
  summary: string;
  options: readonly { value: string; label: string }[];
  selected: readonly string[];
  onChange: (next: string[]) => void;
  searchPlaceholder?: string;
  emptyLabel?: string;
  /** When false, omit the in-popover search (for short option lists). */
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const close = () => {
    setOpen(false);
    setQuery("");
  };
  const ref = useDismissible(open, close);
  const listId = useId();
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const filtered = useMemo(() => {
    if (!searchable) return options;
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => option.label.toLowerCase().includes(needle) || option.value.toLowerCase().includes(needle));
  }, [options, query, searchable]);

  const toggle = (value: string) => {
    if (selectedSet.has(value)) onChange(selected.filter((item) => item !== value));
    else onChange([...selected, value]);
  };

  const clear = () => onChange([]);
  const selectAll = () => onChange(options.map((option) => option.value));

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={triggerClass}
        onClick={() => setOpen((next) => !next)}
      >
        <span className="min-w-0 truncate">{summary}</span>
        <IconChevronDown size={14} className={`shrink-0 text-ink-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className={`${popoverClass} flex max-h-[min(24rem,70vh)] flex-col`}>
          {searchable ? (
            <div className="border-b border-line p-2">
              <label className="flex h-8 items-center gap-2 rounded-control border border-line bg-bg-sunk px-2.5 text-ink-3">
                <IconSearch size={14} className="shrink-0" />
                <input
                  aria-label={`${label}搜索`}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-4"
                />
              </label>
            </div>
          ) : null}
          <div id={listId} role="listbox" aria-label={label} aria-multiselectable="true" className="min-h-0 flex-1 overflow-y-auto py-1">
            {filtered.length ? filtered.map((option) => {
              const checked = selectedSet.has(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={checked}
                  className={optionClass}
                  onClick={() => toggle(option.value)}
                >
                  <CheckboxMark checked={checked} />
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                </button>
              );
            }) : <p className="px-3 py-4 text-[12px] text-ink-4">{emptyLabel}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-line p-2">
            <button type="button" className="h-8 rounded-control border border-line text-[12px] font-medium text-ink-2 hover:border-line-strong hover:text-ink" onClick={clear}>
              Clear
            </button>
            <button type="button" className="h-8 rounded-control border border-line text-[12px] font-medium text-ink-2 hover:border-line-strong hover:text-ink" onClick={selectAll}>
              Select all
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function selectionState(ids: readonly string[], selected: ReadonlySet<string>): "none" | "some" | "all" {
  if (!ids.length) return "none";
  let hit = 0;
  for (const id of ids) if (selected.has(id)) hit += 1;
  if (hit === 0) return "none";
  if (hit === ids.length) return "all";
  return "some";
}

function toggleIds(selected: readonly string[], ids: readonly string[], turnOn: boolean): string[] {
  if (!ids.length) return [...selected];
  if (turnOn) {
    const set = new Set(selected);
    for (const id of ids) set.add(id);
    return [...set];
  }
  const drop = new Set(ids);
  return selected.filter((id) => !drop.has(id));
}

function familyIds(family: AaModelTreeFamily): string[] {
  return family.leaves.map((leaf) => leaf.id);
}

function orgIds(org: AaModelTreeOrg): string[] {
  return org.families.flatMap(familyIds);
}

/** AA-style hierarchical model multi-select: org → family → variants, one search inside the popover. */
export function DarkModelTreeSelect({
  label,
  summary,
  tree,
  selected,
  onChange,
  onSave,
  searchPlaceholder = "Search...",
  emptyLabel = "没有匹配的模型",
}: {
  label: string;
  summary: string;
  tree: readonly AaModelTreeOrg[];
  selected: readonly string[];
  onChange: (next: string[]) => void;
  /** Explicit persist of the current selection (and related prefs by the parent). */
  onSave?: () => void;
  searchPlaceholder?: string;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(() => new Set());
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(() => new Set());
  const [savedFlash, setSavedFlash] = useState(false);
  const close = () => {
    setOpen(false);
    setQuery("");
  };
  const ref = useDismissible(open, close);
  const listId = useId();
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const allIds = useMemo(() => collectTreeModelIds(tree), [tree]);
  const filtered = useMemo(() => filterAaModelTree(tree, query), [tree, query]);
  const searching = query.trim().length > 0;

  useEffect(() => {
    if (!open || !searching) return;
    const nextOrgs = new Set<string>();
    const nextFamilies = new Set<string>();
    for (const org of filtered) {
      nextOrgs.add(org.key);
      for (const family of org.families) nextFamilies.add(`${org.key}::${family.key}`);
    }
    setExpandedOrgs(nextOrgs);
    setExpandedFamilies(nextFamilies);
  }, [open, searching, filtered]);

  const clear = () => onChange([]);
  const selectAll = () => onChange(allIds);

  const toggleOrgOpen = (key: string) => {
    setExpandedOrgs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleFamilyOpen = (key: string) => {
    setExpandedFamilies((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={triggerClass}
        onClick={() => setOpen((next) => !next)}
      >
        <span className="min-w-0 truncate">{summary}</span>
        <IconChevronDown size={14} className={`shrink-0 text-ink-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className={`${popoverClass} flex w-[min(24rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] flex-col sm:w-[28rem]`}>
          <div className="border-b border-line p-2">
            <label className="flex h-8 items-center gap-2 rounded-control border border-line bg-bg-sunk px-2.5 text-ink-3">
              <IconSearch size={14} className="shrink-0" />
              <input
                aria-label={`${label}搜索`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-4"
              />
            </label>
          </div>
          <div id={listId} role="tree" aria-label={label} aria-multiselectable="true" className="min-h-0 max-h-[min(28rem,60vh)] flex-1 overflow-y-auto py-1">
            {filtered.length ? filtered.map((org) => {
              const oIds = orgIds(org);
              const oState = selectionState(oIds, selectedSet);
              const orgOpen = searching || expandedOrgs.has(org.key);
              return (
                <div key={org.key} role="treeitem" aria-expanded={orgOpen} className="select-none">
                  <div className="flex items-center gap-1 px-2 py-1.5 hover:bg-bg-sunk">
                    <button
                      type="button"
                      aria-label={orgOpen ? `折叠 ${org.name}` : `展开 ${org.name}`}
                      className="inline-flex size-6 shrink-0 items-center justify-center rounded-mark text-ink-4 hover:text-ink"
                      onClick={() => toggleOrgOpen(org.key)}
                    >
                      <IconChevronRight size={14} className={`transition-transform ${orgOpen ? "rotate-90" : ""}`} />
                    </button>
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left text-[13px] font-medium text-ink"
                      onClick={() => onChange(toggleIds(selected, oIds, oState !== "all"))}
                    >
                      <CheckboxMark checked={oState === "all"} indeterminate={oState === "some"} />
                      <span className="min-w-0 truncate">{org.name}</span>
                      <span className="shrink-0 text-[11px] font-normal text-ink-4">{oIds.length}</span>
                    </button>
                  </div>
                  {orgOpen ? (
                    <div role="group" className="ml-4 border-l border-line">
                      {org.families.map((family) => {
                        const fIds = familyIds(family);
                        const fState = selectionState(fIds, selectedSet);
                        const familyKey = `${org.key}::${family.key}`;
                        const familyOpen = searching || expandedFamilies.has(familyKey);
                        const onlyLeaf = family.leaves.length === 1 && family.leaves[0].label === family.leaves[0].name;
                        if (onlyLeaf) {
                          const leaf = family.leaves[0];
                          const checked = selectedSet.has(leaf.id);
                          return (
                            <button
                              key={familyKey}
                              type="button"
                              role="treeitem"
                              aria-selected={checked}
                              className="flex w-full items-center gap-2.5 py-1.5 pl-8 pr-3 text-left text-[13px] text-ink-2 hover:bg-bg-sunk hover:text-ink"
                              onClick={() => onChange(toggleIds(selected, [leaf.id], !checked))}
                            >
                              <CheckboxMark checked={checked} />
                              <span className="min-w-0 flex-1 truncate" title={leaf.name}>{leaf.name}</span>
                            </button>
                          );
                        }
                        return (
                          <div key={familyKey} role="treeitem" aria-expanded={familyOpen}>
                            <div className="flex items-center gap-1 py-1.5 pl-2 pr-2 hover:bg-bg-sunk">
                              <button
                                type="button"
                                aria-label={familyOpen ? `折叠 ${family.name}` : `展开 ${family.name}`}
                                className="inline-flex size-6 shrink-0 items-center justify-center rounded-mark text-ink-4 hover:text-ink"
                                onClick={() => toggleFamilyOpen(familyKey)}
                              >
                                <IconChevronRight size={14} className={`transition-transform ${familyOpen ? "rotate-90" : ""}`} />
                              </button>
                              <button
                                type="button"
                                className="flex min-w-0 flex-1 items-center gap-2.5 text-left text-[13px] text-ink"
                                onClick={() => onChange(toggleIds(selected, fIds, fState !== "all"))}
                              >
                                <CheckboxMark checked={fState === "all"} indeterminate={fState === "some"} />
                                <span className="min-w-0 flex-1 truncate">{family.name}</span>
                                <span className="shrink-0 text-[11px] text-ink-4">{fIds.length}</span>
                              </button>
                            </div>
                            {familyOpen ? (
                              <div role="group" className="ml-5 border-l border-line-soft">
                                {family.leaves.map((leaf) => {
                                  const checked = selectedSet.has(leaf.id);
                                  return (
                                    <button
                                      key={leaf.id}
                                      type="button"
                                      role="treeitem"
                                      aria-selected={checked}
                                      className="flex w-full items-center gap-2.5 py-1.5 pl-8 pr-3 text-left text-[12px] text-ink-2 hover:bg-bg-sunk hover:text-ink"
                                      onClick={() => onChange(toggleIds(selected, [leaf.id], !checked))}
                                      title={leaf.name}
                                    >
                                      <CheckboxMark checked={checked} />
                                      <span className="min-w-0 flex-1 truncate">{leaf.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            }) : <p className="px-3 py-4 text-[12px] text-ink-4">{emptyLabel}</p>}
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-line p-2">
            <button type="button" className="h-8 rounded-control border border-line text-[12px] font-medium text-ink-2 hover:border-line-strong hover:text-ink" onClick={clear}>
              Clear
            </button>
            <button type="button" className="h-8 rounded-control border border-line text-[12px] font-medium text-ink-2 hover:border-line-strong hover:text-ink" onClick={selectAll}>
              Select all
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-control border border-line text-[12px] font-medium text-ink-2 hover:border-line-strong hover:text-ink"
              onClick={() => {
                onSave?.();
                setSavedFlash(true);
                window.setTimeout(() => setSavedFlash(false), 1500);
              }}
              aria-label="Save selection"
            >
              <IconBookmark size={13} />
              {savedFlash ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 text-[12px] text-ink-4">
      <span>{label}</span>
      {children}
    </div>
  );
}
