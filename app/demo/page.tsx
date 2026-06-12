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
  opgave_id?: string;
  faktura_id?: string;
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

function getProblemMeta(type: Problem["type"]) {
  const meta = {
    opgave: {
      label: "Opgave",
    },
    timer: {
      label: "Timer",
    },
    materialer: {
      label: "Materialer",
    },
    faktura: {
      label: "Faktura",
    },
  };

  return meta[type];
}

function getInvoiceNumbers(invoices: InvoiceRow[]) {
  return invoices.map((invoice) => invoice.faktura_id).join(", ");
}

function findMatchingOrder(invoice: InvoiceRow) {
  const invoiceKey = getMatchKey(invoice.kunde, invoice.projekt);

  return demoOrders.find((order) => {
    return getMatchKey(order.kunde, order.projekt) === invoiceKey;
  });
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
    const invoiceNumbers = getInvoiceNumbers(matchingInvoices);

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
        opgave_id: order.opgave_id,
        faktura_id: "",
        kunde: order.kunde,
        projekt: order.projekt,
        status: "afsluttet",
        dato: order.dato,
        amount: order.timer * HOURLY_RATE + order.materialer_beloeb,
        title: "Afsluttet opgave uden matchende faktura",
        explanation: `Opgaven "${order.projekt}" hos ${order.kunde} er afsluttet, men der findes ingen matchende faktura.`,
        action:
          "Kontroller om opgaven er faktureret under et andet navn. Hvis ikke, bør opgaven faktureres eller markeres som ikke-fakturerbar.",
      });

      return;
    }

    if (order.timer > invoicedHours) {
      const missingHours = order.timer - invoicedHours;

      problems.push({
        type: "timer",
        opgave_id: order.opgave_id,
        faktura_id: invoiceNumbers,
        kunde: order.kunde,
        projekt: order.projekt,
        status: "timer mangler på faktura",
        dato: order.dato,
        amount: missingHours * HOURLY_RATE,
        title: "Registrerede timer matcher ikke faktura",
        explanation: `Der er registreret ${order.timer} timer på "${order.projekt}" hos ${order.kunde}, men kun ${invoicedHours} timer er fundet på matchende fakturaer.`,
        action: `Kontroller om ${missingHours} timer mangler på fakturaen eller er registreret forkert.`,
      });
    }

    if (order.materialer_beloeb > invoicedMaterials) {
      const missingMaterials = order.materialer_beloeb - invoicedMaterials;

      problems.push({
        type: "materialer",
        opgave_id: order.opgave_id,
        faktura_id: invoiceNumbers,
        kunde: order.kunde,
        projekt: order.projekt,
        status: "materialer mangler på faktura",
        dato: order.dato,
        amount: missingMaterials,
        title: "Materialer matcher ikke faktura",
        explanation: `Der er registreret materialer for ${formatCurrency(
          order.materialer_beloeb
        )} på "${order.projekt}" hos ${order.kunde}, men kun ${formatCurrency(
          invoicedMaterials
        )} er fundet på matchende fakturaer.`,
        action: `Kontroller om materialer for ${formatCurrency(
          missingMaterials
        )} mangler på fakturaen eller er registreret forkert.`,
      });
    }
  });

  demoInvoices.forEach((invoice) => {
    if (invoice.status.includes("forfalden")) {
      const matchingOrder = findMatchingOrder(invoice);

      problems.push({
        type: "faktura",
        opgave_id: matchingOrder?.opgave_id,
        faktura_id: invoice.faktura_id,
        kunde: invoice.kunde,
        projekt: invoice.projekt,
        status: "forfalden",
        dato: invoice.dato,
        amount: invoice.beloeb,
        title: "Forfalden faktura kræver opfølgning",
        explanation: `Fakturaen til ${invoice.kunde} på "${invoice.projekt}" er markeret som forfalden i faktura-filen.`,
        action:
          "Send betalingspåmindelse eller ring til kunden. Fakturaen bør følges op, indtil den er betalt eller afklaret.",
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
            Her vises et realistisk eksempel på, hvordan FakturaTjek
            sammenligner data fra ordrestyring og fakturaer. Demoen viser
            afsluttede opgaver, timer, materialer og forfaldne fakturaer, der
            bør kontrolleres manuelt.
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

        <ProblemResults problems={demoProblems} totalValue={totalValue} />

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

function ProblemResults({
  problems,
  totalValue,
}: {
  problems: Problem[];
  totalValue: number;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-900/70">
      <div className="border-b border-slate-700/60 p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-300">
              Analyse
            </p>

            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
              Fundne problemer
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Disse poster bør kontrolleres manuelt. Start med de største beløb
              og derefter de poster, der kræver hurtig opfølgning.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-700 bg-slate-950/30 p-4 md:min-w-36">
              <p className="text-xs uppercase tracking-widest text-slate-400">
                Problemer
              </p>
              <p className="mt-2 text-2xl font-bold text-white">
                {problems.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-950/30 p-4 md:min-w-44">
              <p className="text-xs uppercase tracking-widest text-red-300">
                Potentiel værdi
              </p>
              <p className="mt-2 text-2xl font-bold text-white">
                {formatCurrency(totalValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 p-4 md:p-6">
        {problems.map((problem, index) => (
          <ProblemCard key={index} problem={problem} index={index} />
        ))}
      </div>
    </section>
  );
}

function ProblemCard({
  problem,
  index,
}: {
  problem: Problem;
  index: number;
}) {
  const meta = getProblemMeta(problem.type);
  const invoiceNumber =
    problem.faktura_id && problem.faktura_id.trim().length > 0
      ? problem.faktura_id
      : problem.type === "opgave"
        ? "Ikke fundet"
        : "-";

  return (
    <article className="rounded-xl border border-slate-700/70 bg-slate-900/75 p-5">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-2">
          <div className="border-l-4 border-red-400 pl-5">
            <p className="text-xs uppercase tracking-widest text-slate-400">
              Problem {index + 1}
            </p>

            <p className="mt-3 text-2xl font-bold text-white">{meta.label}</p>

            <div className="mt-5 inline-flex rounded-xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-red-300">
              {problem.status}
            </div>
          </div>
        </div>

        <div className="border-slate-700/70 lg:col-span-3 lg:border-l lg:pl-8">
          <p className="text-xs uppercase tracking-widest text-slate-400">
            Kunde og projekt
          </p>

          <p className="mt-3 text-xl font-semibold text-white">
            {problem.kunde}
          </p>

          <p className="mt-2 text-sm text-slate-300">{problem.projekt}</p>

          <div className="mt-5 space-y-1 text-sm text-slate-400">
            <p>
              Opgave ID.:{" "}
              <span className="text-slate-200">{problem.opgave_id || "-"}</span>
            </p>

            <p>
              Faktura ID.:{" "}
              <span className="text-slate-200">{invoiceNumber}</span>
            </p>

            {problem.dato && <p>Dato: {problem.dato}</p>}
          </div>
        </div>

        <div className="lg:col-span-5">
          <p className="text-xl font-bold text-white">{problem.title}</p>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            {problem.explanation}
          </p>

          <div className="mt-5 max-w-2xl rounded-lg border border-red-500/25 bg-red-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
              Anbefalet handling
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-100">
              {problem.action}
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 lg:text-right">
          <p className="text-xs uppercase tracking-widest text-slate-400">
            Værdi
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {formatCurrency(problem.amount)}
          </p>
        </div>
      </div>
    </article>
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
                  <td key={`${rowIndex}-${cellIndex}`} className="p-4">
                    {cell || "-"}
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