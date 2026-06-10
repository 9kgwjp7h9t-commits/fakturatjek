import Link from "next/link";

const demoRows = [
  {
    type: "opgave",
    kunde: "Munkebo Maskinservice",
    projekt: "Tavlegennemgang",
    status: "afsluttet",
    beloeb: "31200",
    dato: "2026-06-07",
  },
  {
    type: "time",
    kunde: "Odense Boligservice",
    projekt: "Fejlfinding kælder",
    status: "ikke faktureret",
    beloeb: "9200",
    dato: "2026-06-05",
  },
  {
    type: "materiale",
    kunde: "Nordic Bolig",
    projekt: "Køkkeninstallation",
    status: "ikke faktureret",
    beloeb: "7450",
    dato: "2026-06-03",
  },
  {
    type: "faktura",
    kunde: "Nordhavn Montage",
    projekt: "Varmepumpe service",
    status: "forfalden",
    beloeb: "14500",
    dato: "2026-05-28",
  },
  {
    type: "opgave",
    kunde: "Larsen Byg",
    projekt: "Ny eltavle",
    status: "åben",
    beloeb: "28400",
    dato: "2026-06-04",
  },
];

type DemoRow = {
  type: string;
  kunde: string;
  projekt: string;
  status: string;
  beloeb: string;
  dato: string;
};

function formatCurrency(value: string | number | undefined) {
  const numberValue =
    typeof value === "number"
      ? value
      : Number(String(value || "0").replace(",", "."));

  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(Number.isNaN(numberValue) ? 0 : numberValue);
}

function isProblem(row: DemoRow) {
  const status = row.status.toLowerCase();

  return (
    status.includes("afsluttet") ||
    status.includes("ikke faktureret") ||
    status.includes("forfalden")
  );
}

function getProblemExplanation(row: DemoRow) {
  const type = row.type.toLowerCase();
  const status = row.status.toLowerCase();
  const kunde = row.kunde || "kunden";
  const projekt = row.projekt || "projektet";
  const beloeb = formatCurrency(row.beloeb);

  if (type.includes("opgave") && status.includes("afsluttet")) {
    return {
      title: "Afsluttet opgave uden tydelig fakturering",
      explanation: `Opgaven "${projekt}" hos ${kunde} er markeret som afsluttet. Den bør kontrolleres, fordi afsluttede opgaver normalt skal matches med en faktura.`,
      action: `Tjek om der er oprettet en faktura på ca. ${beloeb}. Hvis ikke, bør opgaven faktureres eller markeres som ikke-fakturerbar.`,
    };
  }

  if (type.includes("time") && status.includes("ikke faktureret")) {
    return {
      title: "Registrerede timer er ikke faktureret",
      explanation: `Der er registreret timer på "${projekt}" hos ${kunde}, men posten står som ikke faktureret. Det kan betyde, at arbejdstid ikke er overført til faktura.`,
      action: `Tjek timesedlerne og sammenlign dem med fakturaen. Estimeret værdi: ${beloeb}.`,
    };
  }

  if (type.includes("materiale") && status.includes("ikke faktureret")) {
    return {
      title: "Materialer mangler muligvis på faktura",
      explanation: `Der er registreret materialeforbrug på "${projekt}" hos ${kunde}, men materialerne står som ikke faktureret. Det bør sammenlignes med fakturaen.`,
      action: `Sammenlign materialelisten med fakturaen. Hvis materialerne mangler, bør de tilføjes. Estimeret værdi: ${beloeb}.`,
    };
  }

  if (type.includes("faktura") && status.includes("forfalden")) {
    return {
      title: "Faktura er forfalden",
      explanation: `Fakturaen til ${kunde} på "${projekt}" er markeret som forfalden. Det betyder, at betalingen bør følges op.`,
      action: `Send betalingspåmindelse eller ring til kunden. Beløb til opfølgning: ${beloeb}.`,
    };
  }

  return {
    title: "Post bør kontrolleres",
    explanation:
      "Denne post har en status, der indikerer, at der kan være behov for manuel kontrol.",
    action:
      "Gennemgå posten og vurder, om der skal faktureres, rykkes eller rettes.",
  };
}

export default function DemoPage() {
  const problems = demoRows.filter(isProblem);

  const totalValue = problems.reduce((sum, row) => {
    const value = Number(String(row.beloeb || "0").replace(",", "."));
    return sum + (Number.isNaN(value) ? 0 : value);
  }, 0);

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
            Forudfyldt analyse
          </h1>

          <p className="mt-3 max-w-3xl text-slate-400">
            Her ser du et eksempel på, hvordan FakturaTjek sammenligner
            registrerede opgaver, timer, materialer og forfaldne fakturaer med
            fakturaer og viser, hvad der bør kontrolleres.
          </p>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/upload"
              className="rounded-xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-center font-semibold text-red-200 hover:bg-red-500/20"
            >
              Prøv CSV-import
            </Link>

            <a
              href="mailto:kontakt@fakturatjek.dk"
              className="rounded-xl border border-slate-700 px-6 py-4 text-center font-semibold text-white hover:bg-slate-900"
            >
              Book gennemgang
            </a>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Rækker analyseret" value={demoRows.length.toString()} />
          <StatCard label="Fundne problemer" value={problems.length.toString()} />
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
            {problems.map((row, index) => {
              const problem = getProblemExplanation(row);

              return (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-4 p-6 md:grid-cols-12 md:items-start"
                >
                  <div className="md:col-span-2">
                    <p className="font-semibold uppercase tracking-wide">
                      {row.type}
                    </p>
                    <p className="text-sm uppercase tracking-wide text-red-200/70">
                      {row.status}
                    </p>
                  </div>

                  <div className="md:col-span-3">
                    <p>{row.kunde}</p>
                    <p className="text-sm text-red-200/70">{row.projekt}</p>
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
                    <p className="text-sm text-red-200/70">{row.dato}</p>
                  </div>

                  <div className="font-bold md:col-span-1 md:text-right">
                    {formatCurrency(row.beloeb)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-6">
            <h2 className="text-2xl font-bold">Alle poster i eksemplet</h2>
            <p className="mt-1 text-sm text-slate-400">
              Samme type data som kan komme fra en CSV-eksport.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-4">Type</th>
                  <th className="p-4">Kunde</th>
                  <th className="p-4">Projekt</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Beløb</th>
                  <th className="p-4">Dato</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {demoRows.map((row, index) => (
                  <tr key={index}>
                    <td className="p-4 uppercase tracking-wide">{row.type}</td>
                    <td className="p-4">{row.kunde}</td>
                    <td className="p-4">{row.projekt}</td>
                    <td className="p-4 uppercase tracking-wide">{row.status}</td>
                    <td className="p-4">{formatCurrency(row.beloeb)}</td>
                    <td className="p-4">{row.dato}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-2xl font-bold">Sådan bruges demoen</h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <InfoBox
              title="1. Se resultatet"
              text="Demoen viser, hvordan en færdig analyse kan se ud."
            />
            <InfoBox
              title="2. Prøv egne data"
              text="CSV-importen gør det muligt at teste flowet med en eksportfil."
            />
            <InfoBox
              title="3. Få en handleliste"
              text="Systemet viser, hvilke poster der bør kontrolleres først."
            />
          </div>
        </section>
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

function InfoBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-800 p-4">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  );
}