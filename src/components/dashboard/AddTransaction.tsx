"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useState } from "react";
import { CATEGORY_NAMES, categorizeByRules } from "@/lib/categories";
import { btn, btnPrimary, input } from "./primitives";

export interface ManualInput {
  date: string;
  description: string;
  amount: number;
  category: string;
}

const today = () => new Date().toISOString().slice(0, 10);

type Props = { open: boolean; onClose: () => void; onAdd: (t: ManualInput) => boolean };

export function AddTransaction({ open, onClose, onAdd }: Props) {
  return <AnimatePresence>{open && <AddForm onClose={onClose} onAdd={onAdd} />}</AnimatePresence>;
}

/** Mounted only while open, so "today" is read on the client at open time. */
function AddForm({ onClose, onAdd }: Omit<Props, "open">) {
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState("auto");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!description.trim()) return setError("Add a description.");
    if (!Number.isFinite(value) || value <= 0) return setError("Enter an amount greater than 0.");
    const signed = kind === "expense" ? -Math.abs(value) : Math.abs(value);
    const cat = category === "auto" ? (categorizeByRules(description, signed) ?? (signed > 0 ? "Income" : "Other")) : category;
    if (onAdd({ date, description: description.trim(), amount: Math.round(signed * 100) / 100, category: cat })) {
      setDescription("");
      setAmount("");
      setCategory("auto");
      setError(null);
      onClose();
    }
  };

  return (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.form
            role="dialog"
            aria-label="Add transaction"
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
            className="glass w-full max-w-md space-y-4 rounded-3xl bg-slate-950/80 p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">Add transaction</h2>
              <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/30 p-1 text-sm">
              {(["expense", "income"] as const).map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setKind(k)}
                  className={`rounded-lg py-1.5 capitalize transition ${kind === k ? "bg-white/10 text-white" : "text-[var(--color-muted)]"}`}
                >
                  {k}
                </button>
              ))}
            </div>
            <label className="block text-xs text-[var(--color-muted)]">
              Description
              <input className={`${input} mt-1`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Uber Eats order" autoFocus />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-[var(--color-muted)]">
                Amount
                <input className={`${input} mt-1`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              </label>
              <label className="block text-xs text-[var(--color-muted)]">
                Date
                <input type="date" className={`${input} mt-1 [color-scheme:dark]`} value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>
            </div>
            <label className="block text-xs text-[var(--color-muted)]">
              Category
              <select className={`${input} mt-1 [&>option]:bg-slate-900`} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="auto">✨ Auto-detect</option>
                {CATEGORY_NAMES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            {error && <p className="text-xs text-rose-300">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className={btn} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className={btnPrimary}>
                Add
              </button>
            </div>
          </motion.form>
        </motion.div>
  );
}
