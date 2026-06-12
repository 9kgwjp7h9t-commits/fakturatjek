import Link from "next/link";

type OrderRow = {
  opgave_id: string;
  kunde: string;
  projekt: string;
  status: string;
  timer: number;
  materialer_beloeb: number;
  dato: string;
};

type InvoiceRow = {
  faktura_id: string;
  kunde: string;
  projekt: string;
  status: string;
  timer_faktureret: number;
  materialer_faktureret: number;
  beloeb: number;
  dato: string;
};

type Problem = {
  type: "opgave" | "timer" | "materialer" | "faktura";
  kunde: string;
  projekt: string;
  status: string;
  dato: string;
  amount: number;
  title: string;
  explanation: string;
  action: string;
};

const HOURLY_RATE = 550;

const demoOrders: OrderRow[] = [
  {
    opgave_id: "2001",
    kunde: "Søndergaard Ejendomme",
    projekt: "Udskiftning af relæer",
    status: "afsluttet",
    timer: 6,
    materialer_beloeb: 1800,
    dato: "2026-06-03",
  },
  {
    opgave_id: "2002",
    kunde: "Fjordens VVS",
    projekt: "El til teknikskab",
    status: "afsluttet",
    timer: 9,
    materialer_beloeb: 2600,
    dato: "2026-06-04",
  },
  {
    opgave_id: "2003",
    kunde: "Madsen Boligservice",
    projekt: "Kælderbelysning",
    status: "afsluttet",
    timer: 4,
    materialer_beloeb: 950,
    dato: "2026-06-04",
  },
  {
    opgave_id: "2004",
    kunde: "Nørregade Kontorhus",
    projekt: "Netværkskab og kabling",
    status: "afsluttet",
    timer: 11,
    materialer_beloeb: 4200,
    dato: "2026-06-05",
  },
  {
    opgave_id: "2005",
    kunde: "Dalum Maskinværksted",
    projekt: "Service på tavle",
    status: "afsluttet",
    timer: 5,
    materialer_beloeb: 700,
    dato: "2026-06-06",
  },
  {
    opgave_id: "2006",
    kunde: "Birk & Co Byg",
    projekt: "Byggestrøm uge 23",
    status: "afsluttet",
    timer: 7,
    materialer_beloeb: 1500,
    dato: "2026-06-07",
  },
  {
    opgave_id: "2007",
    kunde: "Havnens Montage",
    projekt: "Portstyring service",
    status: "afsluttet",
    timer: 3,
    materialer_beloeb: 0,
    dato: "2026-06-07",
  },
  {
    opgave_id: "2008",
    kunde: "Ringe Erhvervspark",
    projekt: "LED-armaturer lagerhal",
    status: "afsluttet",
    timer: 13,
    materialer_beloeb: 6800,
    dato: "2026-06-08",
  },
  {
    opgave_id: "2009",
    kunde: "Skovvejens Andelsbolig",
    projekt: "Dørtelefon fejlfinding",
    status: "afsluttet",
    timer: 4,
    materialer_beloeb: 400,
    dato: "2026-06-09",
  },
  {
    opgave_id: "2010",
    kunde: "Fyns Produktionsservice",
    projekt: "Nødstop kontrol",
    status: "afsluttet",
    timer: 2,
    materialer_beloeb: 0,
    dato: "2026-06-09",
  },
  {
    opgave_id: "2011",
    kunde: "Odense Klinikfællesskab",
    projekt: "Ekstra stikkontakter",
    status: "afsluttet",
    timer: 6,
    materialer_beloeb: 1250,
    dato: "2026-06-10",
  },
  {
    opgave_id: "2012",
    kunde: "Vestfyn Ejendomsdrift",
    projekt: "Udendørs sensorlys",
    status: "afsluttet",
    timer: 5,
    materialer_beloeb: 2200,
    dato: "2026-06-10",
  },
];

const demoInvoices: InvoiceRow[] = [
  {
    faktura_id: "D-2001",
    kunde: "Søndergaard Ejendomme",
    projekt: "Udskiftning af relæer",
    status: "betalt",
    timer_faktureret: 6,
    materialer_faktureret: 1800,
    beloeb: 5100,
    dato: "2026-06-05",
  },
  {
    faktura_id: "D-2002",
    kunde: "Fjordens VVS",
    projekt: "El til teknikskab",
    status: "sendt",
    timer_faktureret: 9,
    materialer_faktureret: 2600,
    beloeb: 7550,
    dato: "2026-06-06",
  },
  {
    faktura_id: "D-2003",
    kunde: "Madsen Boligservice",
    projekt: "Kælderbelysning",
    status: "betalt",
    timer_faktureret: 4,
    materialer_faktureret: 950,
    beloeb: 3150,
    dato: "2026-06-06",
  },
  {
    faktura_id: "D-2004",
    kunde: "Nørregade Kontorhus",
    projekt: "Netværkskab og kabling",
    status: "sendt",
    timer_faktureret: 11,
    materialer_faktureret: 4200,
    beloeb: 10250,
    dato: "2026-06-07",
  },
  {
    faktura_id: "D-2005",
    kunde: "Dalum Maskinværksted",
    projekt: "Service på tavle",
    status: "sendt",
    timer_faktureret: 3,
    materialer_faktureret: 700,
    beloeb: 2350,
    dato: "2026-06-08",
  },
  {
    faktura_id: "D-2006",
    kunde: "Birk & Co Byg",
    projekt: "Byggestrøm uge 23",
    status: "betalt",
    timer_faktureret: 7,
    materialer_faktureret: 1500,
    beloeb: 5350,
    dato: "2026-06-09",
  },
  {
    faktura_id: "D-2007",
    kunde: "Havnens Montage",
    projekt: "Portstyring service",
    status: "betalt",
    timer_faktureret: 3,
    materialer_faktureret: 0,
    beloeb: 1650,
    dato: "2026-06-09",
  },
  {
    faktura_id: "D-2008",
    kunde: "Ringe Erhvervspark",
    projekt: "LED-armaturer lagerhal",
    status: "sendt",
    timer_faktureret: 13,
    materialer_faktureret: 5000,
    beloeb: 12150,
    dato: "2026-06-10",
  },
  {
    faktura_id: "D-2009",
    kunde: "Skovvejens Andelsbolig",
    projekt: "Dørtelefon fejlfinding",
    status: "betalt",
    timer_faktureret: 4,
    materialer_faktureret: 400,
    beloeb: 2600,
    dato: "2026-06-11",
  },
  {
    faktura_id: "D-2010",
    kunde: "Fyns Produktionsservice",
    projekt: "Nødstop kontrol",
    status: "forfalden",
    timer_faktureret: 2,
    materialer_faktureret: 0,
    beloeb: 1100,
    dato: "2026-05-28",
  },
  {
    faktura_id: "D-2011",
    kunde: "Odense Klinikfællesskab",
    projekt: "Ekstra stikkontakter",
    status: "sendt",
    timer_faktureret: 6,
    materialer_faktureret: 1250,
    beloeb: 4550,
    dato: "2026-06-12",
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalize(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function getMatchKey(kunde: string, projekt: string) {
  return `${normalize(kunde)}|${normalize(projekt)}`;
}

function findDemoProblems() {
  const problems: Problem[] = [];
  const invoiceMap = new Map<string, InvoiceRow[]>();

  demoInvoices.forEach((invoice) => {
    const key = getMatchKey(invoice.kunde, invoice.projekt);
    const existing = invoiceMap.get(key) || [];
    existing.push(invoice);
    invoiceMap.set(key, existing);
  });

  demoOrders.forEach((order) => {
    const key = getMatchKey(order.kunde, order.projekt);
    const matchingInvoices = invoiceMap.get(key) || [];

    const invoicedHours = matchingInvoices.reduce(
      (sum, invoice) => sum + invoice.timer_faktureret,
      0
    );

    const invoicedMaterials = matchingInvoices.reduce(
      (sum, invoice) => sum + invoice.materialer_faktureret,
      0
    );

    if (order.status.includes("afsluttet") && matchingInvoices.length === 0) {
      problems.push({
        type: "opgave",
        kunde: order.kunde,
        projekt: order.projekt,
        status: "afsluttet",
        dato: order.dato,
        amount: order.timer * HOURLY_RATE + order.materialer_beloeb,
        title: "Afsluttet opgave uden matchende faktura",
        explanation: `Opgaven "${order.projekt}" er afsluttet, men der findes ingen matchende faktura.`,
        action: "Kontroller om opgaven skal faktureres eller er registreret under et andet projektnavn.",
      });

      return;
    }

    if (order.timer > invoicedHours) {
      const missingHours = order.timer - invoicedHours;

      problems.push({
        type: "timer",
        kunde: order.kunde,
        projekt: order.projekt,
        status: "timer mangler på faktura",
        dato: order.dato,
        amount: missingHours * HOURLY_RATE,
        title: "Registrerede timer matcher ikke faktura",
        explanation: `${order.timer} timer er registreret, men kun ${invoicedHours} timer er faktureret.`,
        action: `Kontroller om ${missingHours} timer mangler på fakturaen.`,
      });
    }

    if (order.materialer_beloeb > invoicedMaterials) {
      const missingMaterials = order.materialer_beloeb - invoicedMaterials;

      problems.push({
        type: "materialer",
        kunde: order.kunde,
        projekt: order.projekt,
        status: "materialer mangler på faktura",
        dato: order.dato,
        amount: missingMaterials,
        title: "Materialer matcher ikke faktura",
        explanation: `${formatCurrency(
          order.materialer_beloeb
        )} er registreret som materialer, men kun ${formatCurrency(
          invoicedMaterials
        )} er faktureret.`,
        action: `Kontroller om ${formatCurrency(
          missingMaterials
        )} i materialer mangler på fakturaen.`,
      });
    }
  });

  demoInvoices.forEach((invoice) => {
    if (invoice.status.includes("forfalden")) {
      problems.push({
        type: "faktura",
        kunde: invoice.kunde,
        projekt: invoice.projekt,
        status: "forfalden",
        dato: invoice.dato,
        amount: invoice.beloeb,
        title: "Forfalden faktura kræver opfølgning",
        explanation: `Faktura ${invoice.faktura_id} er forfalden og bør følges op.`,
        action: "Send betalingspåmindelse eller kontakt kunden.",
      });
    }
  });

  return problems;
}

const demoProblems = findDemoProblems();
const totalValue = demoProblems.reduce((sum, problem) => sum + problem.amount, 0);

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <Link href="/" className="text-sm text-slate-400 hover:text-white">
            ← Tilbage
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-red-400">
            FakturaTjek demo
          </p>

          <h1 className="mt-2 text-4xl font-bold md:text-5xl">
            Eksempel på automatisk fakturatjek
          </h1>

          <p className="mt-3 max-w-3xl text-slate-400">
              Her vises et realistisk eksempel på, hvordan FakturaTjek sammenligner data
              fra ordrestyring og fakturaer. Demoen viser afsluttede opgaver, timer,
              materialer og forfaldne fakturaer, der bør kontrolleres manuelt.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="Opgaver læst" value={demoOrders.length.toString()} />
          <StatCard
            label="Fakturaer læst"
            value={demoInvoices.length.toString()}
          />
          <StatCard
            label="Fundne problemer"
            value={demoProblems.length.toString()}
          />
          <StatCard label="Potentiel værdi" value={formatCurrency(totalValue)} />
        </section>

        <section className="overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/10">
          <div className="border-b border-red-500/20 p-6">
            <h2 className="text-2xl font-bold text-red-300">
              Fundne problemer
            </h2>
            <p className="mt-1 text-sm text-red-200/80">
              Disse poster bør kontrolleres manuelt.
            </p>
          </div>

          <div className="divide-y divide-red-500/20">
            {demoProblems.map((problem, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-4 p-6 md:grid-cols-12 md:items-start"
              >
                <div className="md:col-span-2">
                  <p className="font-semibold uppercase tracking-wide">
                    {problem.type}
                  </p>
                  <p className="text-sm uppercase tracking-wide text-red-200/70">
                    {problem.status}
                  </p>
                </div>

                <div className="md:col-span-3">
                  <p>{problem.kunde}</p>
                  <p className="text-sm text-red-200/70">{problem.projekt}</p>
                </div>

                <div className="md:col-span-5">
                  <p className="font-semibold text-red-100">
                    {problem.title}
                  </p>
                  <p className="mt-1 text-sm text-red-200/80">
                    {problem.explanation}
                  </p>
                  <p className="mt-2 text-sm font-medium text-red-100">
                    Handling: {problem.action}
                  </p>
                </div>

                <div className="md:col-span-1">
                  <p className="text-sm text-red-200/70">{problem.dato}</p>
                </div>

                <div className="font-bold md:col-span-1 md:text-right">
                  {formatCurrency(problem.amount)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/upload"
            className="rounded-2xl bg-red-500 p-6 font-semibold text-white hover:bg-red-600"
          >
            Prøv selv upload og analyse →
          </Link>

          <a
            href="mailto:kontakt@fakturatjek.net"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 font-semibold text-white hover:bg-slate-800"
          >
            Book en gennemgang →
          </a>
        </section>

        <DataTable
          title="Data fra ordrestyring"
          description="Eksempeldata fra et ordrestyringssystem."
          headers={[
            "Opgave ID",
            "Kunde",
            "Projekt",
            "Status",
            "Timer",
            "Materialer",
            "Dato",
          ]}
          rows={demoOrders.map((row) => [
            row.opgave_id,
            row.kunde,
            row.projekt,
            row.status,
            row.timer.toString(),
            formatCurrency(row.materialer_beloeb),
            row.dato,
          ])}
        />

        <DataTable
          title="Data fra fakturaprogram"
          description="Eksempeldata fra et fakturaprogram."
          headers={[
            "Faktura ID",
            "Kunde",
            "Projekt",
            "Status",
            "Timer faktureret",
            "Materialer faktureret",
            "Beløb",
            "Dato",
          ]}
          rows={demoInvoices.map((row) => [
            row.faktura_id,
            row.kunde,
            row.projekt,
            row.status,
            row.timer_faktureret.toString(),
            formatCurrency(row.materialer_faktureret),
            formatCurrency(row.beloeb),
            row.dato,
          ])}
        />
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function DataTable({
  title,
  description,
  headers,
  rows,
}: {
  title: string;
  description: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 p-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-400">
            <tr>
              {headers.map((header) => (
                <th key={header} className="p-4">
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="p-4">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}