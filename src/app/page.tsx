"use client";

import React from "react";

/* ========================
   Shared Types & Utilities
======================== */

type CSWTag = "Referral" | "Upsell" | "Churn Risk";

type CSWRow = {
  id: string;
  company: string;
  primaryContact: string;
  phone: string;
  email: string;
  lastTouch: string;      // YYYY-MM-DD (stored); display as MM/DD/YYYY
  lastContacted: string;  // YYYY-MM-DD (stored); display as MM/DD/YYYY
  notes?: string;
  pipedriveUrl?: string;
  tags: CSWTag[];         // Book of Business checkboxes control these
  target?: boolean;       // "Today's Targets" flag
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* Format YYYY-MM-DD -> MM/DD/YYYY for display only */
function fmtDate(v: string | undefined) {
  if (!v) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return v;
  const [, y, mo, d] = m;
  return `${mo}/${d}/${y}`;
}

/* localStorage state hook */
function useLocalStorageState<T>(key: string, initial: T) {
  const [state, setState] = React.useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, JSON.stringify(state));
    }
  }, [key, state]);

  return [state, setState] as const;
}

/* UI bits */
function TagBadge({ t }: { t: CSWTag }) {
  const map: Record<CSWTag, string> = {
    "Referral": "bg-sky-100 text-sky-700 border-sky-300",
    "Upsell": "bg-emerald-100 text-emerald-700 border-emerald-300",
    "Churn Risk": "bg-rose-100 text-rose-700 border-rose-300",
  };
  return <span className={`px-2 py-0.5 text-xs rounded-full border ${map[t]}`}>{t}</span>;
}

/* Tag checkboxes used in Book of Business */
function TagsCheckboxes({
  value,
  onChange,
}: {
  value: CSWTag[];
  onChange: (next: CSWTag[]) => void;
}) {
  const all: CSWTag[] = ["Referral", "Upsell", "Churn Risk"];
  return (
    <div className="flex gap-4 px-2 py-1">
      {all.map((t) => {
        const checked = value.includes(t);
        return (
          <label key={t} className="flex items-center gap-2 text-sm whitespace-nowrap">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={checked}
              onChange={(e) => {
                const next = e.target.checked
                  ? [...value, t]
                  : value.filter((x) => x !== t);
                onChange(next);
              }}
            />
            {t}
          </label>
        );
      })}
    </div>
  );
}

/* Inline-editable cell */
function EditableCell({
  value,
  onCommit,
  placeholder,
  type = "text",
  className = "",
  displayRender,
}: {
  value: string | number | "" | undefined;
  onCommit: (v: string) => void;
  placeholder?: string;
  type?: "text" | "date" | "number" | "url" | "textarea";
  className?: string; // applied in display mode
  displayRender?: (v: string | number | "" | undefined) => React.ReactNode; // custom display
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value === undefined ? "" : String(value));

  React.useEffect(() => {
    setDraft(value === undefined ? "" : String(value));
  }, [value]);

  if (!editing) {
    const rendered =
      displayRender
        ? displayRender(value)
        : value === "" || value === undefined
          ? <span className="text-slate-400 italic">{placeholder ?? "—"}</span>
          : type === "url"
            ? (
              <a
                className="text-sky-600 underline underline-offset-2"
                href={String(value)}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {String(value)}
              </a>
            )
            : String(value);

    return (
      <div
        className={`px-2 py-1 cursor-text ${className}`}
        onDoubleClick={() => setEditing(true)}
        title="Double-click to edit"
      >
        {rendered}
      </div>
    );
  }

  const commit = () => {
    onCommit(draft);
    setEditing(false);
  };

  const commonProps = {
    autoFocus: true,
    value: draft,
    onChange: (e: any) => setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && type !== "textarea") commit();
      if (e.key === "Escape") setEditing(false);
    },
    className:
      "w-full px-2 py-1 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white",
  } as any;

  return type === "textarea" ? (
    <textarea rows={2} {...commonProps} />
  ) : (
    <input type={type} {...commonProps} />
  );
}

/* ========================
   Sortable Book of Business
======================== */

type SortDir = "asc" | "desc";
type SortKey = keyof CSWRow;

/* Single table row */
function CSRow({
  row,
  onUpdate,
  onDelete,
  showTagBadges = false, // in non-BoB tabs we show badges (read-only)
}: {
  row: CSWRow;
  onUpdate: (next: Partial<CSWRow>) => void;
  onDelete: () => void;
  showTagBadges?: boolean;
}) {
  return (
    <tr className="border-b last:border-0 border-slate-200 hover:bg-slate-50">
      {/* Tags: BoB = checkboxes; other tabs = badges */}
      <td className="whitespace-nowrap">
        {showTagBadges ? (
          <div className="flex gap-1 px-2 py-1 flex-wrap">
            {row.tags.length ? row.tags.map((t) => <TagBadge key={t} t={t} />) : <span className="text-slate-400 italic">none</span>}
          </div>
        ) : (
          <TagsCheckboxes value={row.tags} onChange={(v) => onUpdate({ tags: v })} />
        )}
      </td>

      {/* Editable cells */}
      <td><EditableCell value={row.company} onCommit={(v) => onUpdate({ company: v })} placeholder="Company" /></td>
      <td><EditableCell value={row.primaryContact} onCommit={(v) => onUpdate({ primaryContact: v })} placeholder="Name" /></td>
      <td><EditableCell value={row.phone} onCommit={(v) => onUpdate({ phone: v })} placeholder="Phone" /></td>
      <td><EditableCell value={row.email} onCommit={(v) => onUpdate({ email: v })} placeholder="Email" /></td>
      <td>
        <EditableCell
          type="date"
          value={row.lastTouch}
          onCommit={(v) => onUpdate({ lastTouch: v })}
          placeholder="YYYY-MM-DD"
          displayRender={(v) => fmtDate(String(v))}
        />
      </td>
      <td>
        <EditableCell
          type="date"
          value={row.lastContacted}
          onCommit={(v) => onUpdate({ lastContacted: v })}
          placeholder="YYYY-MM-DD"
          displayRender={(v) => fmtDate(String(v))}
        />
      </td>
      <td>
        <EditableCell
          type="url"
          value={row.pipedriveUrl ?? ""}
          onCommit={(v) => onUpdate({ pipedriveUrl: v })}
          placeholder="https://app.pipedrive.com/..."
        />
      </td>

      {/* Notes: one line + horizontal scroll; textarea only while editing */}
      <td className="min-w-64">
        <EditableCell
          type="textarea"
          value={row.notes ?? ""}
          onCommit={(v) => onUpdate({ notes: v })}
          placeholder="Notes…"
          className="max-w-[800px] whitespace-nowrap overflow-x-auto"
        />
      </td>

      {/* Target? */}
      <td className="text-center">
        <input
          type="checkbox"
          checked={!!row.target}
          onChange={(e) => onUpdate({ target: e.target.checked })}
          className="h-4 w-4"
          title="Add to Today's Targets"
        />
      </td>

      <td className="text-right pr-2">
        <button
          onClick={onDelete}
          className="px-3 py-1 rounded bg-rose-600 text-white text-sm hover:bg-rose-700"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

/* Reusable sortable table */
function CSWTable({
  rows,
  setRows,
  headerTitle,
  filter,
  showTagBadges = false,
}: {
  rows: CSWRow[];
  setRows: React.Dispatch<React.SetStateAction<CSWRow[]>>;
  headerTitle: string;
  filter?: (r: CSWRow) => boolean;
  showTagBadges?: boolean; // true for non-BoB tabs
}) {
  const visible = React.useMemo(
    () => (filter ? rows.filter(filter) : rows),
    [rows, filter]
  );

  const addRow = () =>
    setRows((cur) => [
      {
        id: uid(),
        company: "",
        primaryContact: "",
        phone: "",
        email: "",
        lastTouch: "",
        lastContacted: "",
        notes: "",
        pipedriveUrl: "",
        tags: [],
        target: false,
      },
      ...cur,
    ]);

  /* ---- Sorting ---- */
  const [sortKey, setSortKey] = React.useState<SortKey>("company");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");

  const sorted = React.useMemo(() => {
    const list = [...visible];
    list.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (sortKey === "target") {
        const na = !!av ? 1 : 0;
        const nb = !!bv ? 1 : 0;
        return sortDir === "asc" ? na - nb : nb - na;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return list;
  }, [visible, sortKey, sortDir]);

  function th(label: string, k: SortKey | "dummy") {
    if (k === "dummy") return <th key={label} className="px-2 py-2" />;
    const active = sortKey === k;
    const arrow = active ? (sortDir === "asc" ? "↑" : "↓") : "";
    return (
      <th
        key={String(k)}
        onClick={() => {
          if (active) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
          else {
            setSortKey(k as SortKey);
            setSortDir("asc");
          }
        }}
        className={`px-2 py-2 text-left text-sm font-semibold cursor-pointer select-none ${
          active ? "underline" : ""
        }`}
        title="Click to sort"
      >
        {label} {arrow}
      </th>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">{headerTitle}</h3>
        <button
          onClick={addRow}
          className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800"
        >
          + Add New
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr className="text-left">
              {th("Tags", "tags" as any)}
              {th("Company", "company")}
              {th("Primary Contact", "primaryContact")}
              {th("Phone", "phone")}
              {th("Email", "email")}
              {th("Last Touch", "lastTouch")}
              {th("Last Contacted", "lastContacted")}
              {th("PipeDrive Link", "pipedriveUrl")}
              {th("Notes", "notes")}
              {th("Target?", "target")}
              {th("", "dummy")}
            </tr>
          </thead>

          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-4 py-10 text-center text-slate-400">
                  No rows yet. Click <b>+ Add New</b> to create your first record.
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <CSRow
                  key={r.id}
                  row={r}
                  showTagBadges={showTagBadges}
                  onUpdate={(next) =>
                    setRows((cur) =>
                      cur.map((x) => (x.id === r.id ? { ...x, ...next } : x))
                    )
                  }
                  onDelete={() =>
                    setRows((cur) => cur.filter((x) => x.id !== r.id))
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ========================
   Workflow Pro (Tabs)
======================== */

function WorkflowPro() {
  const [rows, setRows] = useLocalStorageState<CSWRow[]>("csw.book", [
    // Seed records (edit/delete inline)
    {
      id: uid(),
      company: "Jamar Power",
      primaryContact: "Phil Edwards",
      phone: "619-261-2262",
      email: "phil@jamarpower.com",
      lastTouch: "2025-10-21",
      lastContacted: "2025-10-21",
      notes: "Asked about investing",
      pipedriveUrl: "",
      tags: ["Referral"],
      target: false,
    },
    {
      id: uid(),
      company: "Stardust",
      primaryContact: "Brennen Chaput",
      phone: "705-507-0867",
      email: "brennen@stardustsolar.com",
      lastTouch: "2025-10-21",
      lastContacted: "2025-10-21",
      notes: "",
      pipedriveUrl: "",
      tags: ["Referral"],
      target: false,
    },
    {
      id: uid(),
      company: "RME",
      primaryContact: "Erick Justesen",
      phone: "",
      email: "erick@rmeinnovations.com",
      lastTouch: "2025-10-21",
      lastContacted: "2025-10-21",
      notes: "",
      pipedriveUrl: "",
      tags: ["Referral", "Churn Risk"],
      target: false,
    },
    {
      id: uid(),
      company: "Homepal",
      primaryContact: "Jourdan Ochoa",
      phone: "480-466-9773",
      email: "jourdan@custompro.us",
      lastTouch: "2025-10-22",
      lastContacted: "2025-10-22",
      notes:
        "Great convo; she seemed excited. Told her to email intro to me and Walid.",
      pipedriveUrl: "",
      tags: ["Referral", "Upsell"],
      target: true,
    },
  ]);

  type View =
    | "Book of Business"
    | "Referrals"
    | "Upsells"
    | "Churn Risks"
    | "Today's Targets";

  const [view, setView] = React.useState<View>("Book of Business");

  const counts = React.useMemo(() => {
    const has = (t: CSWTag) => rows.filter((r) => r.tags.includes(t)).length;
    return {
      all: rows.length,
      ref: has("Referral"),
      ups: has("Upsell"),
      churn: has("Churn Risk"),
      targets: rows.filter((r) => !!r.target).length,
    };
  }, [rows]);

  return (
    <section className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-slate-500">Book of Business</div>
          <div className="text-3xl font-semibold">{counts.all}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-slate-500">Referrals</div>
          <div className="text-3xl font-semibold">{counts.ref}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-slate-500">Upsells</div>
          <div className="text-3xl font-semibold">{counts.ups}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-slate-500">Churn Risks</div>
          <div className="text-3xl font-semibold">{counts.churn}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-slate-500">Today’s Targets</div>
          <div className="text-3xl font-semibold">{counts.targets}</div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(
          [
            "Book of Business",
            "Referrals",
            "Upsells",
            "Churn Risks",
            "Today's Targets",
          ] as View[]
        ).map((t) => (
          <button
            key={t}
            onClick={() => setView(t)}
            className={`rounded-xl px-3 py-1.5 text-sm border ${
              view === t
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tables */}
      {view === "Book of Business" && (
        <CSWTable rows={rows} setRows={setRows} headerTitle="Book of Business (All Customers)" />
      )}

      {view === "Referrals" && (
        <CSWTable
          rows={rows}
          setRows={setRows}
          headerTitle="Referrals"
          showTagBadges
          filter={(r) => r.tags.includes("Referral")}
        />
      )}

      {view === "Upsells" && (
        <CSWTable
          rows={rows}
          setRows={setRows}
          headerTitle="Upsells"
          showTagBadges
          filter={(r) => r.tags.includes("Upsell")}
        />
      )}

      {view === "Churn Risks" && (
        <CSWTable
          rows={rows}
          setRows={setRows}
          headerTitle="Churn Risks"
          showTagBadges
          filter={(r) => r.tags.includes("Churn Risk")}
        />
      )}

      {view === "Today's Targets" && (
        <CSWTable
          rows={rows}
          setRows={setRows}
          headerTitle="Today's Targets"
          showTagBadges
          filter={(r) => !!r.target}
        />
      )}
    </section>
  );
}

/* ========================
   Master Flow & Reports
======================== */

function MasterFlow() {
  const [rows, setRows] = useLocalStorageState<CSWRow[]>("csw.book", []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-slate-500">Total Records</div>
          <div className="text-3xl font-semibold">{rows.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-slate-500">Referrals</div>
          <div className="text-3xl font-semibold">
            {rows.filter((r) => r.tags.includes("Referral")).length}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-slate-500">Upsells</div>
          <div className="text-3xl font-semibold">
            {rows.filter((r) => r.tags.includes("Upsell")).length}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-slate-500">Churn Risks</div>
          <div className="text-3xl font-semibold">
            {rows.filter((r) => r.tags.includes("Churn Risk")).length}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-slate-500">Today’s Targets</div>
          <div className="text-3xl font-semibold">
            {rows.filter((r) => !!r.target).length}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/60 backdrop-blur">
        <table className="min-w-full">
          <thead className="bg-slate-50/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Tags</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Company</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Primary Contact</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Last Touch</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Last Contacted</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Target?</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/40">
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-1 flex-wrap">
                    {r.tags.length ? r.tags.map((t) => <TagBadge key={t} t={t} />) : <span className="text-slate-400 italic">none</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{r.company}</td>
                <td className="px-4 py-3 text-sm">{r.primaryContact}</td>
                <td className="px-4 py-3 text-sm text-blue-700 underline">
                  <a href={`mailto:${r.email}`}>{r.email}</a>
                </td>
                <td className="px-4 py-3 text-sm">{fmtDate(r.lastTouch)}</td>
                <td className="px-4 py-3 text-sm">{fmtDate(r.lastContacted)}</td>
                <td className="px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!!r.target}
                    onChange={(e) =>
                      setRows((cur) =>
                        cur.map((x) =>
                          x.id === r.id ? { ...x, target: e.target.checked } : x
                        )
                      )
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Reports() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800">Productivity Report</h2>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-slate-500">Total Touches</div>
          <div className="text-3xl font-semibold">4</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-slate-500">Total Updates</div>
          <div className="text-3xl font-semibold">8</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-slate-500">Avg Touches/Day</div>
          <div className="text-3xl font-semibold">0.6</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-slate-500">Avg Updates/Day</div>
          <div className="text-3xl font-semibold">1.1</div>
        </div>
      </div>
      <div className="rounded-2xl bg-white/60 backdrop-blur border border-slate-200 p-6 text-slate-600">
        <p>Chart placeholder. Wire up to your data (e.g., Recharts) to mirror Base44’s bar chart.</p>
      </div>
    </div>
  );
}

/* ========================
   Root App Shell
======================== */

export default function CustomerSuccessApp() {
  const [screen, setScreen] = React.useState<"Workflow" | "Master Flow" | "Reports">("Workflow");

  return (
    <main className="w-screen h-screen overflow-hidden bg-slate-100 text-slate-800 flex flex-col">
      <div className="flex-1 flex flex-col p-4 overflow-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-white/60 border border-slate-200 shadow-sm flex items-center justify-center">👤</div>
          <div>
            <h1 className="text-2xl font-semibold">Customer Success</h1>
            <p className="text-slate-500 text-sm -mt-0.5">Workflow Management</p>
          </div>
          <div className="flex-1" />
          <div className="flex gap-2">
            {["Workflow", "Master Flow", "Reports"].map((t) => (
              <button
                key={t}
                onClick={() => setScreen(t as any)}
                className={`rounded-xl px-4 py-2 text-sm border shadow-sm ${
                  screen === t ? "bg-slate-900 text-white" : "bg-white border-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Screens */}
        {screen === "Workflow" && <WorkflowPro />}
        {screen === "Master Flow" && <MasterFlow />}
        {screen === "Reports" && <Reports />}
      </div>
    </main>
  );
}
