import Link from "next/link";
import { demoData } from "@/data/demoData";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DemoPage() {
  const { company, summary, issues } = demoData;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <Link href="/" className="text-sm text-slate-400 hover:text-white">
              ← Tilbage
            </Link>

            <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-red-400">
              FakturaTjek demo
            </p>

            <h1 className="mt-2 text-4xl font-bold md:text-5xl">{company}</h1>

            <p className="mt-3 max-w-2xl text-slate-400">
              Automatisk kontrol af afsluttede opgaver, timer, materialer og
              forfaldne fakturaer.
            </p>
          </div>

          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 md:text-right">
            <p className="text-sm text-red-300">Potentiel værdi fundet</p>
            <p className="mt-2 text-4xl font-bold text-red-400">
              {formatCurrency(summary.missedRevenue)}
            </p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card
            label="Afsluttede ej faktureret"
            value={summary.completedNotInvoiced.toString()}
          />
          <Card
            label="Timer ikke faktureret"
            value={summary.unbilledHours.toString()}
          />
          <Card
            label="Materialer mangler"
            value={formatCurrency(summary.unbilledMaterials)}
          />
          <Card
            label="Forfaldne fakturaer"
            value={formatCurrency(summary.overdueInvoices)}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-6">
            <h2 className="text-2xl font-bold">Fundne problemer</h2>
            <p className="mt-1 text-sm text-slate-400">
              Prioriteret liste over ting virksomheden bør tjekke i dag.
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="grid grid-cols-1 gap-4 p-6 md:grid-cols-12 md:items-center"
              >
                <div className="md:col-span-3">
                  <p className="font-semibold">{issue.type}</p>
                  <p className="text-sm text-slate-400">{issue.customer}</p>
                </div>

                <div className="md:col-span-3">
                  <p className="text-slate-300">{issue.project}</p>
                </div>

                <div className="md:col-span-4">
                  <p className="text-sm text-slate-400">{issue.reason}</p>
                </div>

                <div className="md:col-span-1">
                  <span
                    className={
                      issue.severity === "Høj"
                        ? "rounded-full border border-red-500/30 bg-red-500/20 px-3 py-1 text-sm text-red-300"
                        : "rounded-full border border-yellow-500/30 bg-yellow-500/20 px-3 py-1 text-sm text-yellow-300"
                    }
                  >
                    {issue.severity}
                  </span>
                </div>

                <div className="font-bold md:col-span-1 md:text-right">
                  {formatCurrency(issue.amount)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-2xl font-bold">Sådan virker det</h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <InfoBox
              title="1. Henter data"
              text="Første version bruger CSV-eksport fra kundens nuværende system."
            />
            <InfoBox
              title="2. Finder afvigelser"
              text="Systemet sammenligner opgaver, timer, materialer og fakturaer."
            />
            <InfoBox
              title="3. Laver handleliste"
              text="Ejeren får en konkret liste over penge, der bør faktureres eller rykkes."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function InfoBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-800 p-4">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  );
}