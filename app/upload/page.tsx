"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type CsvRow = {
  type?: string;
  kunde?: string;
  projekt?: string;
  status?: string;
  beloeb?: string;
  dato?: string;
  [key: string]: string | undefined;
};

function parseCsv(text: string): CsvRow[] {
  const lines = text
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: CsvRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row;
  });
}

function formatCurrency(value: string | number | undefined) {
  const numberValue =
    typeof value === "number" ? value : Number(String(value || "0").replace(",", "."));

  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(Number.isNaN(numberValue) ? 0 : numberValue);
}

function isProblem(row: CsvRow) {
  const status = (row.status || "").toLowerCase();

  return (
    status.includes("afsluttet") ||
    status.includes("ikke faktureret") ||
    status.includes("forfalden")
  );
}
function getProblemExplanation(row: CsvRow) {
  const type = (row.type || "").toLowerCase();
  const status = (row.status || "").toLowerCase();
  const kunde = row.kunde || "kunden";
  const projekt = row.projekt || "projektet";
  const beloeb = formatCurrency(row.beloeb);

  if (type.includes("opgave") && status.includes("afsluttet")) {
    return {
      title: "Afsluttet opgave uden tydelig fakturering",
      explanation: `Opgaven "${projekt}" hos ${kunde} er markeret som afsluttet. Den bør kontrolleres, fordi afsluttede opgaver normalt skal faktureres kort tid efter færdiggørelse.`,
      action: `Tjek om der er oprettet en faktura på ca. ${beloeb}. Hvis ikke, bør opgaven faktureres eller markeres som ikke-fakturerbar.`,
    };
  }

  if (type.includes("time") && status.includes("ikke faktureret")) {
    return {
      title: "Registrerede timer er ikke faktureret",
      explanation: `Der er registreret timer på "${projekt}" hos ${kunde}, men posten står som ikke faktureret. Det kan betyde, at arbejdstid er leveret uden at blive sendt videre til kunden.`,
      action: `Tjek timesedlerne og overfør timerne til faktura, hvis arbejdet skal betales. Estimeret værdi: ${beloeb}.`,
    };
  }

  if (type.includes("materiale") && status.includes("ikke faktureret")) {
    return {
      title: "Materialer mangler muligvis på faktura",
      explanation: `Der er registreret materialeforbrug på "${projekt}" hos ${kunde}, men materialerne står som ikke faktureret. Det kan betyde, at virksomheden selv betaler for materialer, som kunden burde betale for.`,
      action: `Sammenlign materialelisten med fakturaen. Hvis materialerne mangler, bør de tilføjes. Estimeret værdi: ${beloeb}.`,
    };
  }

  if (type.includes("faktura") && status.includes("forfalden")) {
    return {
      title: "Faktura er forfalden",
      explanation: `Fakturaen til ${kunde} på "${projekt}" er markeret som forfalden. Det betyder, at betalingen sandsynligvis ikke er kommet ind til tiden.`,
      action: `Send betalingspåmindelse eller ring til kunden. Beløb til opfølgning: ${beloeb}.`,
    };
  }

  if (status.includes("ikke faktureret")) {
    return {
      title: "Posten er ikke faktureret",
      explanation: `Denne post hos ${kunde} står som ikke faktureret. Den bør kontrolleres, fordi der kan ligge omsætning, som endnu ikke er sendt til kunden.`,
      action: `Tjek om posten skal med på en eksisterende eller ny faktura. Estimeret værdi: ${beloeb}.`,
    };
  }

  return {
    title: "Post bør kontrolleres",
    explanation: `Denne post har en status, der indikerer, at der kan være et økonomisk problem.`,
    action: `Gennemgå posten manuelt og vurder, om der skal faktureres eller følges op.`,
  };
}
export default function UploadPage() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState("");

  const problems = useMemo(() => rows.filter(isProblem), [rows]);

  const totalValue = useMemo(() => {
    return problems.reduce((sum, row) => {
      const value = Number(String(row.beloeb || "0").replace(",", "."));
      return sum + (Number.isNaN(value) ? 0 : value);
    }, 0);
  }, [problems]);

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);

    const text = await file.text();
    const parsedRows = parseCsv(text);

    setRows(parsedRows);
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <Link href="/" className="text-sm text-slate-400 hover:text-white">
            ← Tilbage
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-red-400">
            CSV Upload
          </p>

          <h1 className="mt-2 text-4xl font-bold md:text-5xl">
            Test FakturaTjek med en CSV-fil
          </h1>

          <p className="mt-3 max-w-3xl text-slate-400">
            Upload en simpel eksportfil. Systemet markerer rækker med status som
            afsluttet, ikke faktureret eller forfalden.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-2xl font-bold">Upload fil</h2>

          <p className="mt-2 text-sm text-slate-400">
            Brug en CSV med kolonnerne: type, kunde, projekt, status, beloeb, dato.
          </p>

          <div className="mt-6">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-red-500 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-red-600"
            />
          </div>

          {fileName && (
            <p className="mt-4 text-sm text-slate-400">
              Valgt fil: <span className="text-white">{fileName}</span>
            </p>
          )}
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Rækker læst" value={rows.length.toString()} />
          <StatCard label="Fundne problemer" value={problems.length.toString()} />
          <StatCard label="Potentiel værdi" value={formatCurrency(totalValue)} />
        </section>

        {problems.length > 0 && (
  <section className="overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/10">
    <div className="border-b border-red-500/20 p-6">
      <h2 className="text-2xl font-bold text-red-300">Fundne problemer</h2>
      <p className="mt-1 text-sm text-red-200/80">
        Disse rækker bør kontrolleres manuelt.
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
              {row.type || "Ukendt"}
              </p>
              <p className="text-sm uppercase tracking-wide text-red-200/70">
             {row.status}
              </p>
            </div>

            <div className="md:col-span-3">
              <p>{row.kunde || "Ingen kunde"}</p>
              <p className="text-sm text-red-200/70">{row.projekt}</p>
            </div>

            <div className="md:col-span-5">
              <p className="font-semibold text-red-100">{problem.title}</p>
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
)}

        {rows.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 p-6">
              <h2 className="text-2xl font-bold">Alle rækker</h2>
              <p className="mt-1 text-sm text-slate-400">
                Rå data fra den uploadede CSV.
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
                  {rows.map((row, index) => (
                    <tr key={index}>
                      <td className="p-4">{row.type}</td>
                      <td className="p-4">{row.kunde}</td>
                      <td className="p-4">{row.projekt}</td>
                      <td className="p-4">{row.status}</td>
                      <td className="p-4">{formatCurrency(row.beloeb)}</td>
                      <td className="p-4">{row.dato}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-2xl font-bold">Testdata</h2>

          <p className="mt-2 text-sm text-slate-400">
            Kopiér dette ind i en fil kaldet <span className="text-white">test.csv</span> og upload den.
          </p>

          <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-300">
{`type,kunde,projekt,status,beloeb,dato
opgave,Andersen Ejendomme,El-installation,afsluttet,38500,2026-06-01
time,Fyns VVS Center,Tavlearbejde,ikke faktureret,18600,2026-06-02
materiale,Nordic Bolig,Køkkeninstallation,ikke faktureret,17450,2026-06-03
faktura,Munkebo Maskinservice,Serviceaftale,forfalden,24000,2026-05-01
opgave,Larsen Byg,Ny eltavle,åben,28400,2026-06-04`}
          </pre>
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