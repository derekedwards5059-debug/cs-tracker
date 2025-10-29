"use client";

import React from "react";

/** =========================
 * Types & Utilities
 * ========================= */
type Tag = "Referral" | "Upsell" | "Churn Risk";

type Row = {
  id: string;
  company: string;
  primaryContact: string;
  phone: string;
  email: string;
  lastTouch: string;       // mm/dd/yyyy
  lastContacted: string;   // mm/dd/yyyy
  signedDate?: string;     // mm/dd/yyyy (new)
  pipedriveUrl?: string;
  notes?: string;
  tags: Tag[];
  target?: boolean;
  hideRenewal?: boolean;   // new
};

// localStorage key (unchanged to preserve data)
const LS_KEY = "csw.book";

/** Helpers */
const uid = () => Math.random().toString(36).slice(2, 10);

const fmt = (d: string) => d?.trim() || "";
const todayStr = () => new Date().toLocaleDateString("en-US");

/** Safe parse mm/dd/yyyy -> Date | null */
function parseMDY(mdy: string | undefined): Date | null {
  if (!mdy) return null;
  const [m, d, y] = mdy.split("/").map((x) => parseInt(x, 10));
  if (!m || !d || !y) return null;
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : dt;
}

/** add years to a mm/dd/yyyy string */
function addYears(mdy: string | undefined, years: number): Date | null {
  const dt = parseMDY(mdy);
  if (!dt) return null;
  const copy = new Date(dt.getTime());
  copy.setFullYear(copy.getFullYear() + years);
  return copy;
}

/** mm/dd/yyyy from Date */
function toMDY(date: Date): string {
  return date.toLocaleDateString("en-US");
}

/** Non-destructive migration: add new fields if missing */
function migrate(rows: Row[]): Row[] {
  return rows.map((r) => ({
    ...r,
    signedDate: r.signedDate ?? "",
    hideRenewal: r.hideRenewal ?? false,
    target: r.target ?? false,
    tags: Array.isArray(r.tags) ? r.tags : [],
  }));
}

/** Load & Save */
function useLocalRows() {
  const [rows, setRows] = React.useState<Row[]>([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Row[];
        setRows(migrate(parsed));
      } else {
        // seed with empty set; you already have real data
        setRows([]);
      }
    } catch {
      setRows([]);
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(rows));
    } catch {}
  }, [rows]);

  return [rows, setRows] as const;
}

/** Small UI helpers */
const Card = ({ title, value }: { title: string; value: React.ReactNode }) => (
  <div className="rounded-2xl border bg-white px-4 py-3 whitespace-nowrap">
    <div className="text-xs text-slate-500">{title}</div>
    <div className="text-2xl font-semibold text-slate-800">{value}</div>
  </div>
);

const Badge = ({ t }: { t: Tag }) => {
  const map: Record<Tag, string> = {
    Referral: "bg-sky-100 text-sky-700 border-sky-300",
    Upsell: "bg-emerald-100 text-emerald-700 border-emerald-300",
    "Churn Risk": "bg-rose-100 text-rose-700 border-rose-300",
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full border ${map[t]} whitespace-nowrap`}>
      {t}
    </span>
  );
};

/** =========================
 * Column Resize Table
 * =========================
 * Simple resizable columns via <colgroup> + drag handles in the header.
 */
type Column<RowT> = {
  key: keyof RowT | string;
  label: string;
  initPx?: number;       // initial width in px
  align?: "left" | "right" | "center";
  // Renderers
  render?: (row: RowT) => React.ReactNode;
  headerRender?: () => React.ReactNode;
};

function ResizableTable<RowT extends { id: string }>({
  columns,
  rows,
  rowClassName = "",
}: {
  columns: Column<RowT>[];
  rows: RowT[];
  rowClassName?: string;
}) {
  const MIN_W = 70;
  const [widths, setWidths] = React.useState<number[]>(
    columns.map((c) => Math.max(c.initPx ?? 140, MIN_W))
  );
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // drag state
  const drag = React.useRef<{
    idx: number;
    startX: number;
    startW: number;
    active: boolean;
  }>({ idx: -1, startX: 0, startW: 0, active: false });

  const onMouseMove = React.useCallback((e: MouseEvent) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    setWidths((w) => {
      const next = [...w];
      next[drag.current.idx] = Math.max(MIN_W, drag.current.startW + dx);
      return next;
    });
  }, []);

  const onMouseUp = React.useCallback(() => {
    if (!drag.current.active) return;
    drag.current.active = false;
    document.body.style.cursor = "default";
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }, [onMouseMove]);

  const startDrag = (idx: number, event: React.MouseEvent) => {
    drag.current = {
      idx,
      startX: event.clientX,
      startW: widths[idx],
      active: true,
    };
    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div ref={containerRef} className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-max text-sm table-fixed">
        <colgroup>
          {widths.map((w, i) => (
            <col key={i} style={{ width: `${w}px` }} />
          ))}
        </colgroup>

        <thead className="bg-slate-50 text-slate-600 select-none">
          <tr className="text-left">
            {columns.map((c, i) => (
              <th key={String(c.key)} className="relative font-semibold">
                <div
                  className={`px-3 py-2 whitespace-nowrap ${
                    c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left"
                  }`}
                  title={typeof c.label === "string" ? c.label : undefined}
                >
                  {c.headerRender ? c.headerRender() : c.label}
                </div>
                {/* drag handle */}
                <span
                  onMouseDown={(e) => startDrag(i, e)}
                  className="absolute top-0 right-0 h-full w-1 cursor-col-resize"
                />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={`border-t border-slate-100 ${rowClassName}`}>
              {columns.map((c, i) => (
                <td key={String(c.key)} className="px-3 py-2 whitespace-nowrap">
                  {c.render ? (c.render(r) as React.ReactNode) : ((r as any)[c.key] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Editable cell (no wrap, click to edit, no text wrap even in input) */
function Editable({
  value,
  onCommit,
  placeholder,
  type = "text",
  className = "",
}: {
  value: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  type?: "text" | "date";
  className?: string;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value ?? "");
  React.useEffect(() => setDraft(value ?? ""), [value]);

  if (!editing) {
    return (
      <div
        className={`whitespace-nowrap cursor-text ${className}`}
        onDoubleClick={() => setEditing(true)}
        title={value || placeholder || ""}
      >
        {value ? value : <span className="text-slate-400">{placeholder ?? "—"}</span>}
      </div>
    );
  }
  const commit = () => {
    onCommit(draft);
    setEditing(false);
  };
  return (
    <input
      type={type}
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      className="w-full px-2 py-1 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white whitespace-nowrap"
      placeholder={placeholder}
    />
  );
}

/** =========================
 * Main App
 * ========================= */
export default function CustomerSuccessApp() {
  const [screen, setScreen] = React.useState<"Workflow" | "Master Flow" | "Reports">("Workflow");
  const [rows, setRows] = useLocalRows();
  const [workflowTab, setWorkflowTab] = React.useState<
    "Book of Business" | "Referrals" | "Upsells" | "Churn Risks" | "Today’s Targets" | "Renewals"
  >("Book of Business");

  const counts = React.useMemo(() => {
    const has = (t: Tag) => rows.filter((r) => r.tags.includes(t)).length;
    return {
      book: rows.length,
      ref: has("Referral"),
      ups: has("Upsell"),
      churn: has("Churn Risk"),
      targets: rows.filter((r) => r.target).length,
    };
  }, [rows]);

  /** Derived views */
  const viewRows = React.useMemo(() => {
    switch (workflowTab) {
      case "Referrals":
        return rows.filter((r) => r.tags.includes("Referral"));
      case "Upsells":
        return rows.filter((r) => r.tags.includes("Upsell"));
      case "Churn Risks":
        return rows.filter((r) => r.tags.includes("Churn Risk"));
      case "Today’s Targets":
        return rows.filter((r) => r.target);
      case "Renewals": {
        // everyone, sort by upcoming renewal (signedDate + 1y)
        const withOrder = rows.map((r) => {
          const nextRenewal = addYears(r.signedDate, 1);
          const ord = nextRenewal ? nextRenewal.getTime() : Number.POSITIVE_INFINITY;
          return { row: r, ord, hidden: r.hideRenewal ?? false };
        });
        // hide = pushed to bottom
        withOrder.sort((a, b) => {
          if (a.hidden !== b.hidden) return a.hidden ? 1 : -1;
          return a.ord - b.ord;
        });
        return withOrder.map((x) => x.row);
      }
      default:
        return rows;
    }
  }, [workflowTab, rows]);

  /** Common actions */
  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, ...patch } : r)));

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
        signedDate: "",
        pipedriveUrl: "",
        notes: "",
        tags: [],
        target: false,
        hideRenewal: false,
      },
      ...cur,
    ]);

  const deleteRow = (id: string) => setRows((cur) => cur.filter((r) => r.id !== id));

  /** Columns (NO WRAP + resizable) */
  const baseCols: Column<Row>[] = [
    {
      key: "tags",
      label: "Tags",
      initPx: 170,
      render: (r) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          {/* BoB shows checkboxes to toggle tags */}
          {workflowTab === "Book of Business" ? (
            ["Referral", "Upsell", "Churn Risk"].map((t) => {
              const tag = t as Tag;
              const checked = r.tags.includes(tag);
              return (
                <label key={t} className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      updateRow(r.id, {
                        tags: e.target.checked
                          ? [...r.tags, tag]
                          : r.tags.filter((x) => x !== tag),
                      })
                    }
                  />
                  {t}
                </label>
              );
            })
          ) : (
            // Non-BoB tabs: show badges
            (r.tags.length ? r.tags : []).map((t) => <Badge key={t} t={t} />)
          )}
        </div>
      ),
    },
    {
      key: "company",
      label: "Company",
      initPx: 210,
      render: (r) => (
        <Editable
          value={fmt(r.company)}
          onCommit={(v) => updateRow(r.id, { company: v })}
          placeholder="Company"
        />
      ),
    },
    {
      key: "primaryContact",
      label: "Primary Contact",
      initPx: 170,
      render: (r) => (
        <Editable
          value={fmt(r.primaryContact)}
          onCommit={(v) => updateRow(r.id, { primaryContact: v })}
          placeholder="Name"
        />
      ),
    },
    {
      key: "phone",
      label: "Phone",
      initPx: 130,
      render: (r) => (
        <Editable
          value={fmt(r.phone)}
          onCommit={(v) => updateRow(r.id, { phone: v })}
          placeholder="Phone"
          className="tabular-nums"
        />
      ),
    },
    {
      key: "email",
      label: "Email",
      initPx: 210,
      render: (r) => (
        <Editable
          value={fmt(r.email)}
          onCommit={(v) => updateRow(r.id, { email: v })}
          placeholder="Email"
        />
      ),
    },
    {
      key: "lastTouch",
      label: "Last Touch",
      initPx: 120,
      render: (r) => (
        <Editable
          value={fmt(r.lastTouch)}
          onCommit={(v) => updateRow(r.id, { lastTouch: v })}
          placeholder="mm/dd/yyyy"
        />
      ),
    },
    {
      key: "lastContacted",
      label: "Last Contacted",
      initPx: 130,
      render: (r) => (
        <Editable
          value={fmt(r.lastContacted)}
          onCommit={(v) => updateRow(r.id, { lastContacted: v })}
          placeholder="mm/dd/yyyy"
        />
      ),
    },
    {
      key: "signedDate",
      label: "Signed Date",
      initPx: 120,
      render: (r) => (
        <Editable
          value={fmt(r.signedDate || "")}
          onCommit={(v) => updateRow(r.id, { signedDate: v })}
          placeholder="mm/dd/yyyy"
        />
      ),
    },
    {
      key: "pipedriveUrl",
      label: "PipeDrive",
      initPx: 110, // small, no wrap
      render: (r) =>
        r.pipedriveUrl ? (
          <a
            href={r.pipedriveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center px-2 py-1 rounded border border-slate-300 text-sky-700 hover:bg-slate-50 whitespace-nowrap"
            title={r.pipedriveUrl}
          >
            Open
          </a>
        ) : (
          <Editable
            value=""
            onCommit={(v) => updateRow(r.id, { pipedriveUrl: v })}
            placeholder="https://…"
          />
        ),
    },
    {
      key: "notes",
      label: "Notes",
      initPx: 260, // slightly smaller by default (resizable anyway)
      render: (r) => (
        <Editable
          value={fmt(r.notes || "")}
          onCommit={(v) => updateRow(r.id, { notes: v })}
          placeholder="Notes…"
        />
      ),
    },
    {
      key: "target",
      label: "Target?",
      initPx: 90,
      render: (r) => (
        <input
          type="checkbox"
          checked={!!r.target}
          onChange={(e) => updateRow(r.id, { target: e.target.checked })}
        />
      ),
    },
    {
      key: "actions",
      label: "",
      initPx: 90,
      render: (r) => (
        <button
          onClick={() => deleteRow(r.id)}
          className="px-3 py-1 rounded bg-rose-600 text-white text-sm hover:bg-rose-700 whitespace-nowrap"
        >
          Delete
        </button>
      ),
    },
  ];

  // Additional column only visible in Renewals: Hide?
  const renewalHideCol: Column<Row> = {
    key: "hideRenewal",
    label: "Hide",
    initPx: 70,
    render: (r) => (
      <input
        type="checkbox"
        checked={!!r.hideRenewal}
        onChange={(e) => updateRow(r.id, { hideRenewal: e.target.checked })}
        title="Hide this account in Renewals (pushed to bottom)"
      />
    ),
  };

  const columnsForTab =
    workflowTab === "Renewals" ? [...baseCols.slice(0, baseCols.length - 2), renewalHideCol, ...baseCols.slice(-2)] : baseCols;

  /** Layout */
  return (
    <main className="w-screen h-screen overflow-hidden bg-slate-100 text-slate-800 flex flex-col">
      {/* Top Header */}
      <div className="flex items-center gap-3 px-4 pt-3">
        <div className="h-10 w-10 rounded-2xl bg-white/80 border border-slate-200 shadow-sm flex items-center justify-center">
          👤
        </div>
        <div>
          <h1 className="text-xl font-semibold">Customer Success</h1>
          <p className="text-slate-500 text-xs -mt-0.5 whitespace-nowrap">Workflow Management</p>
        </div>
        <div className="flex-1" />
        <div className="flex gap-2">
          {(["Workflow", "Master Flow", "Reports"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setScreen(t)}
              className={`rounded-xl px-4 py-2 text-sm border shadow-sm whitespace-nowrap ${
                screen === t ? "bg-slate-900 text-white" : "bg-white border-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 overflow-auto gap-4">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <Card title="Book of Business" value={counts.book} />
          <Card title="Referrals" value={counts.ref} />
          <Card title="Upsells" value={counts.ups} />
          <Card title="Churn Risks" value={counts.churn} />
          <Card title="Today’s Targets" value={counts.targets} />
        </div>

        {screen === "Workflow" && (
          <>
            {/* Sub-tabs */}
            <div className="flex gap-2">
              {(
                [
                  "Book of Business",
                  "Referrals",
                  "Upsells",
                  "Churn Risks",
                  "Today’s Targets",
                  "Renewals",
                ] as const
              ).map((t) => (
                <button
                  key={t}
                  onClick={() => setWorkflowTab(t)}
                  className={`rounded-xl px-3 py-1.5 text-sm border whitespace-nowrap ${
                    workflowTab === t ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300"
                  }`}
                >
                  {t}
                </button>
              ))}
              <div className="flex-1" />
              <button
                onClick={addRow}
                className="rounded-xl px-3 py-1.5 text-sm border bg-white border-slate-300 hover:bg-slate-50 whitespace-nowrap"
              >
                + Add New
              </button>
            </div>

            {/* Table */}
            <ResizableTable<Row>
              columns={columnsForTab}
              rows={viewRows}
              rowClassName="hover:bg-slate-50/40"
            />
          </>
        )}

        {screen === "Master Flow" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Card title="Total Records" value={rows.length} />
              <Card title="Referrals" value={rows.filter((r) => r.tags.includes("Referral")).length} />
              <Card title="Upsells" value={rows.filter((r) => r.tags.includes("Upsell")).length} />
              <Card title="Churn Risks" value={rows.filter((r) => r.tags.includes("Churn Risk")).length} />
            </div>

            {/* Simple read-only combined list */}
            <ResizableTable<Row>
              columns={[
                { key: "tags", label: "Tags", initPx: 160, render: (r) => (r.tags.length ? r.tags.map((t) => <Badge key={t} t={t} />) : "—") },
                { key: "company", label: "Company", initPx: 200 },
                { key: "primaryContact", label: "Primary Contact", initPx: 160 },
                { key: "email", label: "Email", initPx: 220 },
                { key: "lastTouch", label: "Last Touch", initPx: 120 },
                { key: "lastContacted", label: "Last Contacted", initPx: 140 },
                {
                  key: "signedDate",
                  label: "Signed Date",
                  initPx: 120,
                  render: (r) => fmt(r.signedDate || ""),
                },
              ]}
              rows={rows}
            />
          </div>
        )}

        {screen === "Reports" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Reports</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Card title="Total Touches" value="—" />
              <Card title="Total Updates" value="—" />
              <Card title="Avg Touches/Day" value="—" />
              <Card title="Avg Updates/Day" value="—" />
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-6 text-slate-600 whitespace-nowrap">
              Chart placeholder. Wire to your metrics later.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
