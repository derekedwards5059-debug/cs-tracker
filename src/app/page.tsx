"use client";
import React, { useMemo, useState } from "react";

// --- Types ---
export type EntryType = "Referral" | "Upsell" | "Churn Risk";

type BaseRow = {
  company: string;
  primaryContact: string;
  phone?: string;
  email: string;
  lastTouch: string; // YYYY-MM-DD
  lastContacted: string; // YYYY-MM-DD
  notes?: string;
};

type ReferralRow = BaseRow & {
  asked: "Yes" | "No";
  response?: string;
  prospects?: number | "-";
};

type UpsellRow = BaseRow & {
  opportunity: string;
  response?: string;
};

type ChurnRow = BaseRow & {
  meetingsMissed: number;
  usage: "Up" | "Down" | "Flat";
  risk: "Low" | "Med" | "High";
  nextAction?: string;
};

// --- Mock Data (replace with API later) ---
const referralsSeed: ReferralRow[] = [
  {
    company: "Jamar Power",
    primaryContact: "Phil Edwards",
    phone: "619-261-2262",
    email: "phil@jamarpower.com",
    lastTouch: "2025-10-21",
    lastContacted: "2025-10-21",
    asked: "Yes",
    response: "Receptive, no specifics",
    prospects: "-",
    notes: "Asked about investing",
  },
  {
    company: "Stardust",
    primaryContact: "Brennen Chaput",
    phone: "705-507-0867",
    email: "brennen@stardustsolar.com",
    lastTouch: "2025-10-21",
    lastContacted: "2025-10-21",
    asked: "Yes",
    response: "Receptive, no specifics",
    prospects: "-",
  },
  {
    company: "RME",
    primaryContact: "Erick Justesen",
    phone: "",
    email: "erick@rmeinnovations.com",
    lastTouch: "2025-10-21",
    lastContacted: "2025-10-21",
    asked: "Yes",
    response: "Receptive, no specifics",
  },
  {
    company: "Homepal",
    primaryContact: "Jourdan Ochoa",
    phone: "480-466-9773",
    email: "jourdan@custompro.us",
    lastTouch: "2025-10-22",
    lastContacted: "2025-10-22",
    asked: "Yes",
    response: "Has someone in mind",
    prospects: 1,
    notes: "Excited; email intro to Derek & Waleed",
  },
];

const upsellsSeed: UpsellRow[] = [
  {
    company: "Innovate Labs",
    primaryContact: "Emily Davis",
    phone: "555-0104",
    email: "emily@innovatelabs.com",
    lastTouch: "2024-01-10",
    lastContacted: "2024-01-08",
    opportunity: "Additional seats",
    response: "Need to discuss with team",
    notes: "Team growing; good timing",
  },
  {
    company: "Global Enterprises",
    primaryContact: "Michael Chen",
    phone: "555-0103",
    email: "michael@globalent.com",
    lastTouch: "2024-01-13",
    lastContacted: "2024-01-11",
    opportunity: "Premium plan upgrade",
    response: "Pricing review; EOM decision",
    notes: "Interested in additional features",
  },
];

const churnSeed: ChurnRow[] = [
  {
    company: "StartupXYZ",
    primaryContact: "Alex Martinez",
    phone: "",
    email: "alex@startupxyz.com",
    lastTouch: "2024-01-07",
    lastContacted: "2024-01-04",
    meetingsMissed: 2,
    usage: "Down",
    risk: "High",
    notes: "Budget stress; exec sponsor moved on",
    nextAction: "Schedule exec sync; propose light tier",
  },
  {
    company: "Beta Systems",
    primaryContact: "Lisa Wong",
    phone: "",
    email: "lisa@betasystems.com",
    lastTouch: "2024-01-12",
    lastContacted: "2024-01-10",
    meetingsMissed: 1,
    usage: "Down",
    risk: "Med",
    notes: "Feature adoption stalled",
    nextAction: "1:1 training + success plan",
  },
];

// --- UI helpers ---
function Card({ title, value, icon }: { title: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/60 backdrop-blur shadow-sm border border-slate-200 px-5 py-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">{icon ?? "📊"}</div>
      <div>
        <div className="text-sm text-slate-500">{title}</div>
        <div className="text-2xl font-semibold text-slate-800">{value}</div>
      </div>
    </div>
  );
}

function Badge({ variant, children }: { variant: EntryType; children: React.ReactNode }) {
  const palette: Record<EntryType, string> = {
    "Referral": "bg-blue-100 text-blue-700",
    "Upsell": "bg-emerald-100 text-emerald-700",
    "Churn Risk": "bg-rose-100 text-rose-700",
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${palette[variant]}`}>{children}</span>;
}

// Simple sorter
function useSorter<T>(rows: T[], defaultKey: keyof T) {
  const [sortKey, setSortKey] = useState<keyof T>(defaultKey);
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    const clone = [...rows];
    clone.sort((a: any, b: any) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return dir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return clone;
  }, [rows, sortKey, dir]);

  function click(k: keyof T) {
    if (k === sortKey) setDir(d => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setDir("asc");
    }
  }
  return { sorted, sortKey, dir, click };
}

// --- Tables ---
function HeaderCell<T>({ label, k, sorter }: { label: string; k: keyof T; sorter: ReturnType<typeof useSorter<T>> }) {
  const active = sorter.sortKey === k;
  return (
    <th
      onClick={() => sorter.click(k)}
      className={`cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-600 ${active ? "underline" : ""}`}
      title="Click to sort"
    >
      {label} {active ? (sorter.dir === "asc" ? "↑" : "↓") : ""}
    </th>
  );
}

function ReferralsTable({ rows, onDelete }: { rows: ReferralRow[]; onDelete: (i: number) => void }) {
  const sorter = useSorter(rows, "company");
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/60 backdrop-blur">
      <table className="min-w-full">
        <thead className="bg-slate-50/60">
          <tr>
            <HeaderCell<ReferralRow> label="Company Name" k="company" sorter={sorter} />
            <HeaderCell<ReferralRow> label="Primary Contact" k="primaryContact" sorter={sorter} />
            <HeaderCell<ReferralRow> label="Phone Number" k="phone" sorter={sorter} />
            <HeaderCell<ReferralRow> label="Email" k="email" sorter={sorter} />
            <HeaderCell<ReferralRow> label="Last Touch Date" k="lastTouch" sorter={sorter} />
            <HeaderCell<ReferralRow> label="Last Contacted" k="lastContacted" sorter={sorter} />
            <HeaderCell<ReferralRow> label="Asked (Y/N)" k="asked" sorter={sorter} />
            <HeaderCell<ReferralRow> label="Response" k="response" sorter={sorter} />
            <HeaderCell<ReferralRow> label="# of Prospects" k="prospects" sorter={sorter} />
            <HeaderCell<ReferralRow> label="Notes" k="notes" sorter={sorter} />
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {sorter.sorted.map((r, i) => (
            <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/40">
              <td className="px-4 py-3 text-sm">{r.company}</td>
              <td className="px-4 py-3 text-sm">{r.primaryContact}</td>
              <td className="px-4 py-3 text-sm">{r.phone || "-"}</td>
              <td className="px-4 py-3 text-sm text-blue-700 underline"><a href={`mailto:${r.email}`}>{r.email}</a></td>
              <td className="px-4 py-3 text-sm">{r.lastTouch}</td>
              <td className="px-4 py-3 text-sm">{r.lastContacted}</td>
              <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded-md ${r.asked === "Yes" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>{r.asked}</span></td>
              <td className="px-4 py-3 text-sm">{r.response || "-"}</td>
              <td className="px-4 py-3 text-sm">{r.prospects ?? "-"}</td>
              <td className="px-4 py-3 text-sm">{r.notes || ""}</td>
              <td className="px-4 py-3 text-sm">
                <button onClick={() => onDelete(i)} className="rounded-xl bg-white border border-slate-200 px-3 py-1 shadow-sm hover:bg-slate-50">🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UpsellsTable({ rows, onDelete }: { rows: UpsellRow[]; onDelete: (i: number) => void }) {
  const sorter = useSorter(rows, "company");
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/60 backdrop-blur">
      <table className="min-w-full">
        <thead className="bg-slate-50/60">
          <tr>
            <HeaderCell<UpsellRow> label="Company Name" k="company" sorter={sorter} />
            <HeaderCell<UpsellRow> label="Primary Contact" k="primaryContact" sorter={sorter} />
            <HeaderCell<UpsellRow> label="Phone Number" k="phone" sorter={sorter} />
            <HeaderCell<UpsellRow> label="Email" k="email" sorter={sorter} />
            <HeaderCell<UpsellRow> label="Last Touch Date" k="lastTouch" sorter={sorter} />
            <HeaderCell<UpsellRow> label="Last Contacted" k="lastContacted" sorter={sorter} />
            <HeaderCell<UpsellRow> label="Upsell Opportunity" k="opportunity" sorter={sorter} />
            <HeaderCell<UpsellRow> label="Response" k="response" sorter={sorter} />
            <HeaderCell<UpsellRow> label="Notes" k="notes" sorter={sorter} />
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {sorter.sorted.map((r, i) => (
            <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/40">
              <td className="px-4 py-3 text-sm">{r.company}</td>
              <td className="px-4 py-3 text-sm">{r.primaryContact}</td>
              <td className="px-4 py-3 text-sm">{r.phone || "-"}</td>
              <td className="px-4 py-3 text-sm text-blue-700 underline"><a href={`mailto:${r.email}`}>{r.email}</a></td>
              <td className="px-4 py-3 text-sm">{r.lastTouch}</td>
              <td className="px-4 py-3 text-sm">{r.lastContacted}</td>
              <td className="px-4 py-3 text-sm">{r.opportunity}</td>
              <td className="px-4 py-3 text-sm">{r.response || "-"}</td>
              <td className="px-4 py-3 text-sm">{r.notes || ""}</td>
              <td className="px-4 py-3 text-sm">
                <button onClick={() => onDelete(i)} className="rounded-xl bg-white border border-slate-200 px-3 py-1 shadow-sm hover:bg-slate-50">🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChurnTable({ rows, onDelete }: { rows: ChurnRow[]; onDelete: (i: number) => void }) {
  const sorter = useSorter(rows, "company");
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/60 backdrop-blur">
      <table className="min-w-full">
        <thead className="bg-slate-50/60">
          <tr>
            <HeaderCell<ChurnRow> label="Company Name" k="company" sorter={sorter} />
            <HeaderCell<ChurnRow> label="Primary Contact" k="primaryContact" sorter={sorter} />
            <HeaderCell<ChurnRow> label="Phone Number" k="phone" sorter={sorter} />
            <HeaderCell<ChurnRow> label="Email" k="email" sorter={sorter} />
            <HeaderCell<ChurnRow> label="Last Touch Date" k="lastTouch" sorter={sorter} />
            <HeaderCell<ChurnRow> label="Last Contacted" k="lastContacted" sorter={sorter} />
            <HeaderCell<ChurnRow> label="Consecutive Meetings Missed" k="meetingsMissed" sorter={sorter} />
            <HeaderCell<ChurnRow> label="Usage Up or Down" k="usage" sorter={sorter} />
            <HeaderCell<ChurnRow> label="Risk Level" k="risk" sorter={sorter} />
            <HeaderCell<ChurnRow> label="Next Action" k="nextAction" sorter={sorter} />
            <HeaderCell<ChurnRow> label="Notes" k="notes" sorter={sorter} />
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {sorter.sorted.map((r, i) => (
            <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/40">
              <td className="px-4 py-3 text-sm">{r.company}</td>
              <td className="px-4 py-3 text-sm">{r.primaryContact}</td>
              <td className="px-4 py-3 text-sm">{r.phone || "-"}</td>
              <td className="px-4 py-3 text-sm text-blue-700 underline"><a href={`mailto:${r.email}`}>{r.email}</a></td>
              <td className="px-4 py-3 text-sm">{r.lastTouch}</td>
              <td className="px-4 py-3 text-sm">{r.lastContacted}</td>
              <td className="px-4 py-3 text-sm">{r.meetingsMissed}</td>
              <td className="px-4 py-3 text-sm">{r.usage}</td>
              <td className="px-4 py-3 text-sm">{r.risk}</td>
              <td className="px-4 py-3 text-sm">{r.nextAction || "-"}</td>
              <td className="px-4 py-3 text-sm">{r.notes || ""}</td>
              <td className="px-4 py-3 text-sm">
                <button onClick={() => onDelete(i)} className="rounded-xl bg-white border border-slate-200 px-3 py-1 shadow-sm hover:bg-slate-50">🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Screens ---
function Workflow() {
  const [tab, setTab] = useState<EntryType>("Referral");
  const [referrals, setReferrals] = useState(referralsSeed);
  const [upsells, setUpsells] = useState(upsellsSeed);
  const [churn, setChurn] = useState(churnSeed);

  const counts = {
    referrals: referrals.length,
    upsells: upsells.length,
    churn: churn.length,
  };

  return (
    <div className="space-y-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card title="Referrals" value={counts.referrals} icon={<span>👥</span>} />
        <Card title="Upsells" value={counts.upsells} icon={<span>📈</span>} />
        <Card title="Churn Risks" value={counts.churn} icon={<span>⚠️</span>} />
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-3">
        {(["Referral", "Upsell", "Churn Risk"] as EntryType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm shadow-sm border ${
              tab === t ? "bg-slate-900 text-white" : "bg-white text-slate-700 border-slate-200"
            }`}
          >
            {t}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => {
            // Quick add stub row to whichever tab is active
            if (tab === "Referral") setReferrals((r) => [{
              company: "New Co",
              primaryContact: "",
              email: "",
              asked: "No",
              lastTouch: new Date().toISOString().slice(0,10),
              lastContacted: new Date().toISOString().slice(0,10),
            } as ReferralRow, ...r]);
            if (tab === "Upsell") setUpsells((u) => [{
              company: "New Co",
              primaryContact: "",
              email: "",
              opportunity: "",
              lastTouch: new Date().toISOString().slice(0,10),
              lastContacted: new Date().toISOString().slice(0,10),
            } as UpsellRow, ...u]);
            if (tab === "Churn Risk") setChurn((c) => [{
              company: "New Co",
              primaryContact: "",
              email: "",
              meetingsMissed: 0,
              usage: "Flat",
              risk: "Low",
              lastTouch: new Date().toISOString().slice(0,10),
              lastContacted: new Date().toISOString().slice(0,10),
            } as ChurnRow, ...c]);
          }}
          className="rounded-xl bg-white border border-slate-200 px-4 py-2 shadow-sm hover:bg-slate-50"
        >
          + Add New
        </button>
      </div>

      {/* Tables */}
      {tab === "Referral" && (
        <ReferralsTable
          rows={referrals}
          onDelete={(i) => setReferrals((rows) => rows.filter((_, idx) => idx !== i))}
        />
      )}
      {tab === "Upsell" && (
        <UpsellsTable
          rows={upsells}
          onDelete={(i) => setUpsells((rows) => rows.filter((_, idx) => idx !== i))}
        />
      )}
      {tab === "Churn Risk" && (
        <ChurnTable
          rows={churn}
          onDelete={(i) => setChurn((rows) => rows.filter((_, idx) => idx !== i))}
        />
      )}
    </div>
  );
}

function MasterFlow() {
  const rows = [
    { type: "Churn Risk" as EntryType, company: "StartupXYZ", primary: "Alex Martinez", email: "alex@startupxyz.com", lastTouch: "2024-01-07", lastContacted: "2024-01-04" },
    { type: "Upsell" as EntryType, company: "Innovate Labs", primary: "Emily Davis", email: "emily@innovatelabs.com", lastTouch: "2024-01-10", lastContacted: "2024-01-08" },
    { type: "Churn Risk" as EntryType, company: "Beta Systems", primary: "Lisa Wong", email: "lisa@betasystems.com", lastTouch: "2024-01-12", lastContacted: "2024-01-10" },
    { type: "Upsell" as EntryType, company: "Global Enterprises", primary: "Michael Chen", email: "michael@globalent.com", lastTouch: "2024-01-13", lastContacted: "2024-01-11" },
    { type: "Referral" as EntryType, company: "Jamar Power", primary: "Phil Edwards", email: "phil@jamarpower.com", lastTouch: "2025-10-21", lastContacted: "2025-10-21" },
    { type: "Referral" as EntryType, company: "Stardust", primary: "Brennen Chaput", email: "brennen@stardustsolar.com", lastTouch: "2025-10-21", lastContacted: "2025-10-21" },
    { type: "Referral" as EntryType, company: "RME", primary: "Erick Justesen", email: "erick@rmeinnovations.com", lastTouch: "2025-10-21", lastContacted: "2025-10-21" },
    { type: "Referral" as EntryType, company: "Homepal", primary: "Jourdan Ochoa", email: "jourdan@custompro.us", lastTouch: "2025-10-22", lastContacted: "2025-10-22" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card title="Total Records" value={rows.length} />
        <Card title="Referrals" value={rows.filter(r => r.type === "Referral").length} />
        <Card title="Upsells" value={rows.filter(r => r.type === "Upsell").length} />
        <Card title="Churn Risks" value={rows.filter(r => r.type === "Churn Risk").length} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/60 backdrop-blur">
        <table className="min-w-full">
          <thead className="bg-slate-50/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Company</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Primary Contact</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Last Touch</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Last Contacted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/40">
                <td className="px-4 py-3 text-sm"><Badge variant={r.type}>{r.type}</Badge></td>
                <td className="px-4 py-3 text-sm">{r.company}</td>
                <td className="px-4 py-3 text-sm">{r.primary}</td>
                <td className="px-4 py-3 text-sm text-blue-700 underline"><a href={`mailto:${r.email}`}>{r.email}</a></td>
                <td className="px-4 py-3 text-sm">{r.lastTouch}</td>
                <td className="px-4 py-3 text-sm">{r.lastContacted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Reports() {
  // Minimal placeholder (hook up to real data later)
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800">Productivity Report</h2>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card title="Total Touches" value={4} />
        <Card title="Total Updates" value={8} />
        <Card title="Avg Touches/Day" value={0.6} />
        <Card title="Avg Updates/Day" value={1.1} />
      </div>
      <div className="rounded-2xl bg-white/60 backdrop-blur border border-slate-200 p-6 text-slate-600">
        <p>Chart placeholder. Wire up to your data (e.g., Recharts) to mirror Base44’s bar chart.</p>
      </div>
    </div>
  );
}

// --- Root ---
export default function CustomerSuccessApp() {
  const [screen, setScreen] = useState<"Workflow" | "Master Flow" | "Reports">("Workflow");

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
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

        {screen === "Workflow" && <WorkflowPro />}
        {screen === "Master Flow" && <MasterFlow />}
        {screen === "Reports" && <Reports />}
      </div>
    </main>
  );
}
/*** ===== CS Workflow Pro Addon =====
 * Drop-in component that adds:
 * - Book of Business master table
 * - Multi-tagging (Referral, Upsell, Churn Risk)
 * - Derived views that filter by tags
 * - Inline edit on double-click
 * - PipeDrive link column
 * - localStorage persistence
 ***/

type CSWTag = "Referral" | "Upsell" | "Churn Risk";

type CSWRow = {
  id: string;
  company: string;
  primaryContact: string;
  phone: string;
  email: string;
  lastTouch: string;      // YYYY-MM-DD
  lastContacted: string;  // YYYY-MM-DD
  asked?: "Yes" | "No";
  response?: string;
  prospects?: number | "";
  notes?: string;
  pipedriveUrl?: string;
  tags: CSWTag[];
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ---------- localStorage helper ---------- */
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

/* ---------- small UI helpers ---------- */
function TagBadge({ t }: { t: CSWTag }) {
  const map: Record<CSWTag, string> = {
    "Referral": "bg-sky-100 text-sky-700 border-sky-300",
    "Upsell": "bg-emerald-100 text-emerald-700 border-emerald-300",
    "Churn Risk": "bg-rose-100 text-rose-700 border-rose-300",
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full border ${map[t]}`}>{t}</span>
  );
}

function CheckboxTagPicker({
  value,
  onChange,
}: {
  value: CSWTag[];
  onChange: (next: CSWTag[]) => void;
}) {
  const all: CSWTag[] = ["Referral", "Upsell", "Churn Risk"];
  return (
    <div className="flex gap-3">
      {all.map((t) => {
        const checked = value.includes(t);
        return (
          <label key={t} className="flex items-center gap-2 text-sm">
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

/* ---------- inline editable cell ---------- */
function EditableCell({
  value,
  onCommit,
  placeholder,
  type = "text",
  className = "",
}: {
  value: string | number | "" | undefined;
  onCommit: (v: string) => void;
  placeholder?: string;
  type?: "text" | "date" | "number" | "url" | "textarea";
  className?: string;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value === undefined ? "" : String(value));
  React.useEffect(() => {
    setDraft(value === undefined ? "" : String(value));
  }, [value]);
  if (!editing) {
    const display =
      value === "" || value === undefined ? (
        <span className="text-slate-400 italic">{placeholder ?? "—"}</span>
      ) : type === "url" ? (
        <a
          className="text-sky-600 underline underline-offset-2"
          href={String(value)}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {String(value)}
        </a>
      ) : (
        String(value)
      );
    return (
      <div
        className={`px-2 py-1 cursor-text ${className}`}
        onDoubleClick={() => setEditing(true)}
        title="Double-click to edit"
      >
        {display}
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

/* ---------- table row component ---------- */
function CSRow({
  row,
  onUpdate,
  onDelete,
}: {
  row: CSWRow;
  onUpdate: (next: Partial<CSWRow>) => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-b last:border-0 border-slate-200 hover:bg-slate-50">
      <td className="whitespace-nowrap">
        <div className="flex gap-1 px-2 py-1 flex-wrap">
          {row.tags.length ? row.tags.map((t) => <TagBadge key={t} t={t} />) : <span className="text-slate-400 italic">none</span>}
        </div>
        <CheckboxTagPicker value={row.tags} onChange={(v) => onUpdate({ tags: v })} />
      </td>
      <td>
        <EditableCell value={row.company} onCommit={(v) => onUpdate({ company: v })} placeholder="Company" />
      </td>
      <td>
        <EditableCell value={row.primaryContact} onCommit={(v) => onUpdate({ primaryContact: v })} placeholder="Name" />
      </td>
      <td>
        <EditableCell value={row.phone} onCommit={(v) => onUpdate({ phone: v })} placeholder="Phone" />
      </td>
      <td>
        <EditableCell value={row.email} onCommit={(v) => onUpdate({ email: v })} placeholder="Email" />
      </td>
      <td>
        <EditableCell type="date" value={row.lastTouch} onCommit={(v) => onUpdate({ lastTouch: v })} placeholder="YYYY-MM-DD" />
      </td>
      <td>
        <EditableCell type="date" value={row.lastContacted} onCommit={(v) => onUpdate({ lastContacted: v })} placeholder="YYYY-MM-DD" />
      </td>
      <td className="text-center">
        <select
          className="px-2 py-1 rounded border border-slate-300 bg-white"
          value={row.asked ?? "No"}
          onChange={(e) => onUpdate({ asked: e.target.value as "Yes" | "No" })}
        >
          <option>No</option>
          <option>Yes</option>
        </select>
      </td>
      <td>
        <EditableCell value={row.response ?? ""} onCommit={(v) => onUpdate({ response: v })} placeholder="Response" />
      </td>
      <td className="w-24">
        <EditableCell
          type="number"
          value={row.prospects ?? ""}
          onCommit={(v) => onUpdate({ prospects: v === "" ? "" : Number(v) })}
          placeholder="#"
          className="text-right"
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
      <td className="min-w-64">
        <EditableCell
          type="textarea"
          value={row.notes ?? ""}
          onCommit={(v) => onUpdate({ notes: v })}
          placeholder="Notes…"
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

/* ---------- reusable table ---------- */
function CSWTable({
  rows,
  setRows,
  headerTitle,
  filter,
}: {
  rows: CSWRow[];
  setRows: React.Dispatch<React.SetStateAction<CSWRow[]>>;
  headerTitle: string;
  filter?: (r: CSWRow) => boolean;
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
        asked: "No",
        response: "",
        prospects: "",
        notes: "",
        pipedriveUrl: "",
        tags: [],
      },
      ...cur,
    ]);

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
              <th className="px-2 py-2">Tags</th>
              <th className="px-2 py-2">Company</th>
              <th className="px-2 py-2">Primary Contact</th>
              <th className="px-2 py-2">Phone</th>
              <th className="px-2 py-2">Email</th>
              <th className="px-2 py-2">Last Touch</th>
              <th className="px-2 py-2">Last Contacted</th>
              <th className="px-2 py-2">Asked (Y/N)</th>
              <th className="px-2 py-2">Response</th>
              <th className="px-2 py-2 text-right"># of Prospects</th>
              <th className="px-2 py-2">PipeDrive Link</th>
              <th className="px-2 py-2">Notes</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-4 py-10 text-center text-slate-400">
                  No rows yet. Click <b>+ Add New</b> to create your first record.
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <CSRow
                  key={r.id}
                  row={r}
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

/* ---------- MASTER component with tabs ---------- */
function WorkflowPro() {
  const [rows, setRows] = useLocalStorageState<CSWRow[]>("csw.book", [
    // seed with your four examples; you can delete/modify inline
    {
      id: uid(),
      company: "Jamar Power",
      primaryContact: "Phil Edwards",
      phone: "619-261-2262",
      email: "phil@jamarpower.com",
      lastTouch: "2025-10-21",
      lastContacted: "2025-10-21",
      asked: "Yes",
      response: "Receptive, no specifics",
      prospects: "",
      notes: "Asked about investing",
      pipedriveUrl: "",
      tags: ["Referral"],
    },
    {
      id: uid(),
      company: "Stardust",
      primaryContact: "Brennen Chaput",
      phone: "705-507-0867",
      email: "brennen@stardustsolar.com",
      lastTouch: "2025-10-21",
      lastContacted: "2025-10-21",
      asked: "Yes",
      response: "Receptive, no specifics",
      prospects: "",
      notes: "",
      pipedriveUrl: "",
      tags: ["Referral"],
    },
    {
      id: uid(),
      company: "RME",
      primaryContact: "Erick Justesen",
      phone: "",
      email: "erick@rmeinnovations.com",
      lastTouch: "2025-10-21",
      lastContacted: "2025-10-21",
      asked: "Yes",
      response: "Receptive, no specifics",
      prospects: "",
      notes: "",
      pipedriveUrl: "",
      tags: ["Referral"],
    },
    {
      id: uid(),
      company: "Homepal",
      primaryContact: "Jourdan Ochoa",
      phone: "480-466-9773",
      email: "jourdan@custompro.us",
      lastTouch: "2025-10-22",
      lastContacted: "2025-10-22",
      asked: "Yes",
      response: "Has someone in mind",
      prospects: 1,
      notes:
        "Great convo; she seemed excited. Told her to email intro to me and Walid.",
      pipedriveUrl: "",
      tags: ["Referral"],
    },
  ]);

  type View = "Book of Business" | "Referrals" | "Upsells" | "Churn Risks";
  const [view, setView] = React.useState<View>("Book of Business");

  const counts = React.useMemo(() => {
    const has = (t: CSWTag) => rows.filter((r) => r.tags.includes(t)).length;
    return {
      all: rows.length,
      ref: has("Referral"),
      ups: has("Upsell"),
      churn: has("Churn Risk"),
    };
  }, [rows]);

  return (
    <section className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(["Book of Business", "Referrals", "Upsells", "Churn Risks"] as View[]).map((t) => (
          <button
            key={t}
            onClick={() => setView(t)}
            className={`rounded-xl px-3 py-1.5 text-sm border ${
              view === t ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300"
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
          filter={(r) => r.tags.includes("Referral")}
        />
      )}
      {view === "Upsells" && (
        <CSWTable
          rows={rows}
          setRows={setRows}
          headerTitle="Upsells"
          filter={(r) => r.tags.includes("Upsell")}
        />
      )}
      {view === "Churn Risks" && (
        <CSWTable
          rows={rows}
          setRows={setRows}
          headerTitle="Churn Risks"
          filter={(r) => r.tags.includes("Churn Risk")}
        />
      )}
    </section>
  );
}
