"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type OrderRow = {
  opgave_id?: string;
  kunde?: string;
  projekt?: string;
  status?: string;
  timer?: string;
  materialer_beloeb?: string;
  dato?: string;
  [key: string]: string | undefined;
};

type InvoiceRow = {
  faktura_id?: string;
  kunde?: string;
  projekt?: string;
  status?: string;
  beloeb?: string;
  dato?: string;
  [key: string]: string | undefined;
};

type Problem = {
  type: "opgave" | "timer" | "materialer" | "faktura";
  kunde: string;
  projekt: string;
  status: string;
  dato?: string;
  amount: number;
  title: string;
  explanation: string;
  action: string;
};

function parseCsv<T extends Record<string, string | undefined>>(text: string): T[] {
  const lines = text
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row as T;
  });
}

function toNumber(value: string | number | undefined) {
  const numberValue =
    typeof value === "number"
      ? value
      : Number(String(value || "0").replace(",", "."));

  return Number.isNaN(numberValue) ? 0 : numberValue;
}

function formatCurrency(value: string | number | undefined) {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function normalize(value: string | undefined) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function getMatchKey(kunde?: string, projekt?: string) {
  return `${normalize(kunde)}|${normalize(projekt)}`;
}

function isPaidInvoice(invoice: InvoiceRow) {
  const status = normalize(invoice.status);

  return (
    status.includes("betalt") ||
    status.includes("sendt") ||
    status.includes("faktureret")
  );
}

function findProblems(orderRows: OrderRow[], invoiceRows: InvoiceRow[]): Problem[] {
  const problems: Problem[] = [];

  const invoiceMap = new Map<string, InvoiceRow[]>();

  invoiceRows.forEach((invoice) => {
    const key = getMatchKey(invoice.kunde, invoice.projekt);
    const existing = invoiceMap.get(key) || [];
    existing.push(invoice);
    invoiceMap.set(key, existing);
  });

  orderRows.forEach((order) => {
    const kunde = order.kunde || "Ukendt kunde";
    const projekt = order.projekt || "Ukendt projekt";
    const status = normalize(order.status);
    const key = getMatchKey(order.kunde, order.projekt);
    const matchingInvoices = invoiceMap.get(key) || [];
    const hasInvoice = matchingInvoices.some(isPaidInvoice);

    const timer = toNumber(order.timer);
    const materialer = toNumber(order.materialer_beloeb);
    const estimatedValue = timer * 550 + materialer;

    if (status.includes("afsluttet") && !hasInvoice) {
      problems.push({
        type: "opgave",
        kunde,
        projekt,
        status: order.status || "afsluttet",
        dato: order.dato,
        amount: estimatedValue,
        title: "Afsluttet opgave uden matchende faktura",
        explanation: `Opgaven "${projekt}" hos ${kunde} er markeret som afsluttet i ordrestyringen, men der findes ingen matchende faktura i faktura-filen.`,
        action:
          "Tjek om opgaven allerede er faktureret under et andet navn. Hvis ikke, bør den gøres klar til fakturering eller markeres som ikke-fakturerbar.",
      });
    }

    if (timer > 0 && !hasInvoice) {
      problems.push({
        type: "timer",
        kunde,
        projekt,
        status: "timer uden matchende faktura",
        dato: order.dato,
        amount: timer * 550,
        title: "Registrerede timer uden matchende faktura",
        explanation: `Der er registreret ${timer} timer på "${projekt}" hos ${kunde}, men der findes ingen matchende faktura i faktura-filen.`,
        action:
          "Sammenlign timesedlerne med fakturaen. Hvis timerne ikke er medtaget, bør de kontrolleres før fakturering.",
      });
    }

    if (materialer > 0 && !hasInvoice) {
      problems.push({
        type: "materialer",
        kunde,
        projekt,
        status: "materialer uden matchende faktura",
        dato: order.dato,
        amount: materialer,
        title: "Materialer uden matchende faktura",
        explanation: `Der er registreret materialer for ${formatCurrency(
          materialer
        )} på "${projekt}" hos ${kunde}, men der findes ingen matchende faktura.`,
        action:
          "Sammenlign materialelisten med fakturaen. Hvis materialerne mangler, bør de tilføjes eller kontrolleres manuelt.",
      });
    }
  });

  invoiceRows.forEach((invoice) => {
    const status = normalize(invoice.status);

    if (status.includes("forfalden")) {
      const kunde = invoice.kunde || "Ukendt kunde";
      const projekt = invoice.projekt || "Ukendt projekt";

      problems.push({
        type: "faktura",
        kunde,
        projekt,
        status: invoice.status || "forfalden",
        dato: invoice.dato,
        amount: toNumber(invoice.beloeb),
        title: "Forfalden faktura kræver opfølgning",
        explanation: `Fakturaen til ${kunde} på "${projekt}" er markeret som forfalden i faktura-filen.`,
        action:
          "Send betalingspåmindelse eller ring til kunden. Fakturaen bør følges op, indtil den er betalt eller afklaret.",
      });
    }
  });

  return problems;
}

export default function UploadPage() {
  const [orderRows, setOrderRows] = useState<OrderRow[]>([]);
  const [invoiceRows, setInvoiceRows] = useState<InvoiceRow[]>([]);
  const [orderFileName, setOrderFileName] = useState("");
  const [invoiceFileName, setInvoiceFileName] = useState("");

  const hasBothFiles = orderRows.length > 0 && invoiceRows.length > 0;

  const problems = useMemo(() => {
    if (!hasBothFiles) return [];
    return findProblems(orderRows, invoiceRows);
 }, [orderRows, invoiceRows, hasBothFiles]);

  const totalValue = useMemo(() => {
    return problems.reduce((sum, problem) => sum + problem.amount, 0);
  }, [problems]);

  async function handleOrderUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setOrderFileName(file.name);

    const text = await file.text();
    const parsedRows = parseCsv<OrderRow>(text);

    setOrderRows(parsedRows);
  }

  async function handleInvoiceUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setInvoiceFileName(file.name);

    const text = await file.text();
    const parsedRows = parseCsv<InvoiceRow>(text);

    setInvoiceRows(parsedRows);
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <Link href="/" className="text-sm text-slate-400 hover:text-white">
            ← Tilbage
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-red-400">
            CSV Import
          </p>

          <h1 className="mt-2 text-4xl font-bold md:text-5xl">
            Sammenlign ordrestyring med fakturaer
          </h1>

          <p className="mt-3 max-w-3xl text-slate-400">
            Upload én CSV fra ordrestyring og én CSV fra fakturaprogrammet.
            FakturaTjek sammenligner opgaver, timer og materialer med fakturaer
            og viser, hvad der mangler opfølgning eller manuel kontrol.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <UploadBox
            title="1. Upload ordrestyring.csv"
            description="Skal indeholde: opgave_id, kunde, projekt, status, timer, materialer_beloeb, dato."
            fileName={orderFileName}
            onChange={handleOrderUpload}
          />

          <UploadBox
            title="2. Upload fakturaer.csv"
            description="Skal indeholde: faktura_id, kunde, projekt, status, beloeb, dato."
            fileName={invoiceFileName}
            onChange={handleInvoiceUpload}
          />
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="Opgaver læst" value={orderRows.length.toString()} />
          <StatCard label="Fakturaer læst" value={invoiceRows.length.toString()} />
          <StatCard label="Fundne problemer" value={problems.length.toString()} />
          <StatCard label="Potentiel værdi" value={formatCurrency(totalValue)} />
        </section>

        {problems.length > 0 && (
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
              {problems.map((problem, index) => (
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
                    <p className="text-sm text-red-200/70">
                      {problem.projekt}
                    </p>
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
        )}

        {orderRows.length > 0 && (
          <DataTable
            title="Ordrestyring data"
            description="Rå data fra ordrestyring CSV."
            headers={[
              "Opgave ID",
              "Kunde",
              "Projekt",
              "Status",
              "Timer",
              "Materialer",
              "Dato",
            ]}
            rows={orderRows.map((row) => [
              row.opgave_id,
              row.kunde,
              row.projekt,
              row.status,
              row.timer,
              formatCurrency(row.materialer_beloeb),
              row.dato,
            ])}
          />
        )}

        {invoiceRows.length > 0 && (
          <DataTable
            title="Faktura data"
            description="Rå data fra faktura CSV."
            headers={["Faktura ID", "Kunde", "Projekt", "Status", "Beløb", "Dato"]}
            rows={invoiceRows.map((row) => [
              row.faktura_id,
              row.kunde,
              row.projekt,
              row.status,
              formatCurrency(row.beloeb),
              row.dato,
            ])}
          />
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TestDataBox
            title="Testdata: ordrestyring.csv"
            fileName="ordrestyring.csv"
            content={`opgave_id,kunde,projekt,status,timer,materialer_beloeb,dato
1001,Andersen Ejendomme,El-installation,afsluttet,12,5200,2026-06-01
1002,Fyns VVS Center,Tavlearbejde,afsluttet,31,0,2026-06-02
1003,Nordic Bolig,Køkkeninstallation,afsluttet,0,7450,2026-06-03
1004,Larsen Byg,Ny eltavle,åben,8,1200,2026-06-04
1005,Munkebo Maskinservice,Tavlegennemgang,afsluttet,18,3100,2026-06-07`}
          />

          <TestDataBox
            title="Testdata: fakturaer.csv"
            fileName="fakturaer.csv"
            content={`faktura_id,kunde,projekt,status,beloeb,dato
F-1001,Andersen Ejendomme,El-installation,betalt,38500,2026-06-03
F-1004,Larsen Byg,Ny eltavle,kladde,0,2026-06-04
F-2001,Nordhavn Montage,Varmepumpe service,forfalden,14500,2026-05-28`}
          />
        </section>
      </div>
    </main>
  );
}

function UploadBox({
  title,
  description,
  fileName,
  onChange,
}: {
  title: string;
  description: string;
  fileName: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-2xl font-bold">{title}</h2>

      <p className="mt-2 text-sm text-slate-400">{description}</p>

      <div className="mt-6">
        <input
          type="file"
          accept=".csv"
          onChange={onChange}
          className="block w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-red-500 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-red-600"
        />
      </div>

      {fileName && (
        <p className="mt-4 text-sm text-slate-400">
          Valgt fil: <span className="text-white">{fileName}</span>
        </p>
      )}
    </section>
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
  rows: (string | undefined)[][];
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

function TestDataBox({
  title,
  fileName,
  content,
}: {
  title: string;
  fileName: string;
  content: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-2xl font-bold">{title}</h2>

      <p className="mt-2 text-sm text-slate-400">
        Kopiér dette ind i en fil kaldet{" "}
        <span className="text-white">{fileName}</span> og upload den.
      </p>

      <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-300">
        {content}
      </pre>
    </section>
  );
}