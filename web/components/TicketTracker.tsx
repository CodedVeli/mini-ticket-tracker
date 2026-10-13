"use client";

import { useEffect, useState } from "react";
import { api, type Stats, type Status, type TicketPage } from "@/lib/api";
import NewTicketForm from "./NewTicketForm";
import StatsBar from "./StatsBar";
import TicketList from "./TicketList";

const PAGE_SIZE = 10;

export default function TicketTracker() {
  const [filter, setFilter] = useState<Status | "">("");
  const [page, setPage] = useState(1);
  const [tickets, setTickets] = useState<TicketPage | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = () => setVersion((v) => v + 1);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listTickets({ status: filter || undefined, page, limit: PAGE_SIZE }), api.getStats()])
      .then(([ticketPage, counts]) => {
        if (cancelled) return;
        setTickets(ticketPage);
        setStats(counts);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, page, version]);

  async function handleStatusChange(id: string, status: Status) {
    setError(null);
    try {
      await api.updateTicket(id, { status });
    } catch (err) {
      setError((err as Error).message);
    }
    refresh();
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Mini Ticket Tracker</h1>
      {error && (
        <div role="alert" className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <StatsBar stats={stats} />
      <NewTicketForm
        onCreated={() => {
          setPage(1);
          refresh();
        }}
      />
      <TicketList
        tickets={tickets}
        filter={filter}
        onFilterChange={(f) => {
          setFilter(f);
          setPage(1);
        }}
        onPageChange={setPage}
        onStatusChange={handleStatusChange}
      />
    </main>
  );
}
