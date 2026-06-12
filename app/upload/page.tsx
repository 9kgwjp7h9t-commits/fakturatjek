"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

type RawRow = Record<string, string | undefined>;

type ParsedCsv = {
  headers: string[];
  rows: RawRow[];
};

type OrderRow = {
  opgave_id?: string;
  kunde?: string;
  projekt?: string;
  status?: string;
  timer?: string;
  materialer_beloeb?: string;
  dato?: string;
};

type InvoiceRow = {
  faktura_id?: string;
  kunde?: string;
  projekt?: string;
  status?: string;
  timer_faktureret?: string;
  materialer_faktureret?: string;
  beloeb?: string;
  dato?: string;
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

type OrderField =
  | "opgave_id"
  | "kunde"
  | "projekt"
  | "status"
  | "timer"
  | "materialer_beloeb"
  | "dato";

type InvoiceField =
  | "faktura_id"
  | "kunde"
  | "projekt"
  | "status"
  | "timer_faktureret"
  | "materialer_faktureret"
  | "beloeb"
  | "dato";

type FieldConfig<T extends string> = {
  key: T;
  label: string;
  aliases: string[];
  required: boolean;
};

type Mapping<T extends string> = Record<T, string>;

const HOURLY_RATE = 550;

const ORDER_FIELDS: FieldConfig<OrderField>[] = [
  {
    key: "opgave_id",
    label: "Opgave ID",
    aliases: [
      "opgave_id",
      "opgave id",
      "opgaveid",
      "sagsnummer",
      "sag nr",
      "sag nummer",
      "job id",
      "ordre id",
      "ordrenummer",
      "task id",
      "case id",
    ],
    required: false,
  },
  {
    key: "kunde",
    label: "Kunde",
    aliases: [
      "kunde",
      "kundenavn",
      "kundens navn",
      "navn",
      "debitor",
      "debitor navn",
      "firma",
      "firmanavn",
      "virksomhed",
      "kunde nr",
      "kundenummer",
      "customer",
      "client",
      "company",
    ],
    required: true,
  },
  {
    key: "projekt",
    label: "Projekt / sag",
    aliases: [
      "projekt",
      "projektnavn",
      "sag",
      "sagsnavn",
      "sagsnummer",
      "opgave",
      "opgavenavn",
      "arbejde",
      "job",
      "jobnavn",
      "ordre",
      "ordrenavn",
      "project",
      "case",
      "task",
      "order",
    ],
    required: true,
  },
  {
    key: "status",
    label: "Status",
    aliases: [
      "status",
      "tilstand",
      "fase",
      "opgavestatus",
      "sagsstatus",
      "afsluttet",
      "færdig",
      "completed",
      "state",
    ],
    required: false,
  },
  {
    key: "timer",
    label: "Registrerede timer",
    aliases: [
      "timer",
      "antal timer",
      "arbejdstid",
      "tid",
      "registreret tid",
      "timeforbrug",
      "mandetimer",
      "hours",
      "time",
      "time spent",
      "work hours",
    ],
    required: false,
  },
  {
    key: "materialer_beloeb",
    label: "Registrerede materialer",
    aliases: [
      "materialer",
      "materialer_beloeb",
      "materialer beløb",
      "materialebeløb",
      "materiale beløb",
      "vareforbrug",
      "varer",
      "material costs",
      "materials",
      "material amount",
    ],
    required: false,
  },
  {
    key: "dato",
    label: "Dato",
    aliases: [
      "dato",
      "oprettet",
      "afsluttet dato",
      "udført dato",
      "udfoert dato",
      "date",
      "created",
      "completed date",
    ],
    required: false,
  },
];

const INVOICE_FIELDS: FieldConfig<InvoiceField>[] = [
  {
    key: "faktura_id",
    label: "Faktura ID",
    aliases: [
      "faktura_id",
      "faktura id",
      "fakturanummer",
      "faktura nr",
      "faktura nummer",
      "invoice id",
      "invoice number",
      "invoice no",
    ],
    required: false,
  },
  {
    key: "kunde",
    label: "Kunde",
    aliases: [
      "kunde",
      "kundenavn",
      "kundens navn",
      "navn",
      "debitor",
      "debitor navn",
      "firma",
      "firmanavn",
      "virksomhed",
      "kunde nr",
      "kundenummer",
      "customer",
      "client",
      "company",
    ],
    required: true,
  },
  {
    key: "projekt",
    label: "Projekt / sag",
    aliases: [
      "projekt",
      "projektnavn",
      "sag",
      "sagsnavn",
      "sagsnummer",
      "opgave",
      "opgavenavn",
      "arbejde",
      "job",
      "jobnavn",
      "ordre",
      "ordrenavn",
      "project",
      "case",
      "task",
      "order",
    ],
    required: true,
  },
  {
    key: "status",
    label: "Status",
    aliases: [
      "status",
      "betalingsstatus",
      "fakturastatus",
      "tilstand",
      "fase",
      "betalt",
      "sendt",
      "forfalden",
      "payment status",
      "invoice status",
    ],
    required: false,
  },
  {
    key: "timer_faktureret",
    label: "Fakturerede timer",
    aliases: [
      "timer_faktureret",
      "timer faktureret",
      "fakturerede timer",
      "timer",
      "antal timer",
      "arbejdstid",
      "hours",
      "hours invoiced",
      "invoiced hours",
    ],
    required: false,
  },
  {
    key: "materialer_faktureret",
    label: "Fakturerede materialer",
    aliases: [
      "materialer_faktureret",
      "materialer faktureret",
      "fakturerede materialer",
      "materialer",
      "varer",
      "varelinjer",
      "material costs",
      "materials",
      "invoiced materials",
    ],
    required: false,
  },
  {
    key: "beloeb",
    label: "Fakturabeløb",
    aliases: [
      "beloeb",
      "beløb",
      "fakturabeløb",
      "faktura beløb",
      "total",
      "sum",
      "amount",
      "pris",
      "price",
    ],
    required: false,
  },
  {
    key: "dato",
    label: "Dato",
    aliases: [
      "dato",
      "fakturadato",
      "oprettet",
      "date",
      "invoice date",
      "created",
    ],
    required: false,
  },
];

function createEmptyMapping<T extends string>(fields: FieldConfig<T>[]) {
  return fields.reduce((acc, field) => {
    acc[field.key] = "";
    return acc;
  }, {} as Mapping<T>);
}

function parseCsv(text: string): ParsedCsv {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      headers: [],
      rows: [],
    };
  }

  const headers = lines[0].split(",").map((header) => header.trim());

  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    const row: RawRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row;
  });

  return {
    headers,
    rows,
  };
}

function normalizeText(value: string | undefined) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
}

function formatHeaderLabel(header: string) {
  const labels: Record<string, string> = {
    opgave_id: "Opgave ID",
    faktura_id: "Faktura ID",
    kunde: "Kunde",
    projekt: "Projekt",
    status: "Status",
    timer: "Timer",
    materialer_beloeb: "Materialer",
    timer_faktureret: "Timer faktureret",
    materialer_faktureret: "Materialer faktureret",
    beloeb: "Beløb",
    beløb: "Beløb",
    dato: "Dato",
  };

  return labels[header] || header;
}

function guessMapping<T extends string>(
  headers: string[],
  fields: FieldConfig<T>[]
): Mapping<T> {
  const mapping = createEmptyMapping(fields);
  const usedHeaders = new Set<string>();

  fields.forEach((field) => {
    let bestHeader = "";
    let bestScore = 0;

    headers.forEach((header) => {
      if (usedHeaders.has(header)) return;

      const normalizedHeader = normalizeText(header);

      field.aliases.forEach((alias) => {
        const normalizedAlias = normalizeText(alias);

        let score = 0;

        if (normalizedHeader === normalizedAlias) {
          score = 100;
        } else if (normalizedHeader.includes(normalizedAlias)) {
          score = 70;
        } else if (normalizedAlias.includes(normalizedHeader)) {
          score = 50;
        }

        if (score > bestScore) {
          bestScore = score;
          bestHeader = header;
        }
      });
    });

    if (bestHeader) {
      mapping[field.key] = bestHeader;
      usedHeaders.add(bestHeader);
    }
  });

  return mapping;
}

function getMissingRequiredFields<T extends string>(
  fields: FieldConfig<T>[],
  mapping: Mapping<T>
) {
  return fields.filter((field) => field.required && !mapping[field.key]);
}

function getMappedFields<T extends string>(
  fields: FieldConfig<T>[],
  mapping: Mapping<T>
) {
  return fields.filter((field) => Boolean(mapping[field.key]));
}

function getMissingOptionalFields<T extends string>(
  fields: FieldConfig<T>[],
  mapping: Mapping<T>
) {
  return fields.filter((field) => !field.required && !mapping[field.key]);
}

function hasRequiredMapping<T extends string>(
  fields: FieldConfig<T>[],
  mapping: Mapping<T>
) {
  return getMissingRequiredFields(fields, mapping).length === 0;
}

function mapOrderRows(rows: RawRow[], mapping: Mapping<OrderField>): OrderRow[] {
  return rows.map((row) => ({
    opgave_id: row[mapping.opgave_id],
    kunde: row[mapping.kunde],
    projekt: row[mapping.projekt],
    status: row[mapping.status],
    timer: row[mapping.timer],
    materialer_beloeb: row[mapping.materialer_beloeb],
    dato: row[mapping.dato],
  }));
}

function mapInvoiceRows(
  rows: RawRow[],
  mapping: Mapping<InvoiceField>
): InvoiceRow[] {
  return rows.map((row) => ({
    faktura_id: row[mapping.faktura_id],
    kunde: row[mapping.kunde],
    projekt: row[mapping.projekt],
    status: row[mapping.status],
    timer_faktureret: row[mapping.timer_faktureret],
    materialer_faktureret: row[mapping.materialer_faktureret],
    beloeb: row[mapping.beloeb],
    dato: row[mapping.dato],
  }));
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

function getMatchKey(kunde?: string, projekt?: string) {
  return `${normalizeText(kunde)}|${normalizeText(projekt)}`;
}

function isInvoiceUsable(invoice: InvoiceRow) {
  const status = normalizeText(invoice.status);

  if (!status) return true;

  return (
    status.includes("betalt") ||
    status.includes("sendt") ||
    status.includes("faktureret") ||
    status.includes("forfalden")
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
    const status = normalizeText(order.status);
    const hasStatus = Boolean(status);
    const shouldCheckOrder = hasStatus ? status.includes("afsluttet") : true;
    const key = getMatchKey(order.kunde, order.projekt);

    const matchingInvoices = (invoiceMap.get(key) || []).filter(isInvoiceUsable);

    const registeredHours = toNumber(order.timer);
    const invoicedHours = matchingInvoices.reduce(
      (sum, invoice) => sum + toNumber(invoice.timer_faktureret),
      0
    );

    const registeredMaterials = toNumber(order.materialer_beloeb);
    const invoicedMaterials = matchingInvoices.reduce(
      (sum, invoice) => sum + toNumber(invoice.materialer_faktureret),
      0
    );

    const hasInvoice = matchingInvoices.length > 0;

    if (shouldCheckOrder && !hasInvoice) {
      const estimatedValue = registeredHours * HOURLY_RATE + registeredMaterials;

      problems.push({
        type: "opgave",
        kunde,
        projekt,
        status: hasStatus ? order.status || "afsluttet" : "status mangler",
        dato: order.dato,
        amount: estimatedValue,
        title: hasStatus
          ? "Afsluttet opgave uden matchende faktura"
          : "Opgave uden matchende faktura — status mangler",
        explanation: hasStatus
          ? `Opgaven "${projekt}" hos ${kunde} er markeret som afsluttet i ordrestyringen, men der findes ingen matchende faktura i faktura-filen.`
          : `Status-kolonnen mangler i ordrestyringsfilen. Derfor kan FakturaTjek ikke se, om opgaven er afsluttet. Der findes dog ingen matchende faktura på "${projekt}" hos ${kunde}, så posten bør kontrolleres manuelt.`,
        action: hasStatus
          ? "Tjek om opgaven er faktureret under et andet navn. Hvis ikke, bør opgaven faktureres eller markeres som ikke-fakturerbar."
          : "Kontroller først om opgaven faktisk er afsluttet. Hvis den er afsluttet, bør du tjekke om den er faktureret under et andet navn eller mangler at blive faktureret.",
      });

      return;
    }

    if (hasInvoice && registeredHours > invoicedHours) {
      const missingHours = registeredHours - invoicedHours;

      problems.push({
        type: "timer",
        kunde,
        projekt,
        status: "timer mangler på faktura",
        dato: order.dato,
        amount: missingHours * HOURLY_RATE,
        title: "Registrerede timer matcher ikke faktura",
        explanation: `Der er registreret ${registeredHours} timer på "${projekt}" hos ${kunde}, men kun ${invoicedHours} timer er fundet på matchende fakturaer.`,
        action: `Kontroller om ${missingHours} timer mangler på fakturaen eller er registreret forkert.`,
      });
    }

    if (hasInvoice && registeredMaterials > invoicedMaterials) {
      const missingMaterials = registeredMaterials - invoicedMaterials;

      problems.push({
        type: "materialer",
        kunde,
        projekt,
        status: "materialer mangler på faktura",
        dato: order.dato,
        amount: missingMaterials,
        title: "Materialer matcher ikke faktura",
        explanation: `Der er registreret materialer for ${formatCurrency(
          registeredMaterials
        )} på "${projekt}" hos ${kunde}, men kun ${formatCurrency(
          invoicedMaterials
        )} er fundet på matchende fakturaer.`,
        action: `Kontroller om materialer for ${formatCurrency(
          missingMaterials
        )} mangler på fakturaen eller er registreret forkert.`,
      });
    }
  });

  invoiceRows.forEach((invoice) => {
    const status = normalizeText(invoice.status);

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
  const analysisRef = useRef<HTMLDivElement | null>(null);

  const [orderFile, setOrderFile] = useState<ParsedCsv>({
    headers: [],
    rows: [],
  });

  const [invoiceFile, setInvoiceFile] = useState<ParsedCsv>({
    headers: [],
    rows: [],
  });

  const [orderMapping, setOrderMapping] = useState<Mapping<OrderField>>(
    createEmptyMapping(ORDER_FIELDS)
  );

  const [invoiceMapping, setInvoiceMapping] = useState<Mapping<InvoiceField>>(
    createEmptyMapping(INVOICE_FIELDS)
  );

  const [orderFileName, setOrderFileName] = useState("");
  const [invoiceFileName, setInvoiceFileName] = useState("");
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [showAllOrderMapping, setShowAllOrderMapping] = useState(false);
  const [showAllInvoiceMapping, setShowAllInvoiceMapping] = useState(false);

  const missingOrderRequiredFields = getMissingRequiredFields(
    ORDER_FIELDS,
    orderMapping
  );

  const missingInvoiceRequiredFields = getMissingRequiredFields(
    INVOICE_FIELDS,
    invoiceMapping
  );

  const orderMappingReady = hasRequiredMapping(ORDER_FIELDS, orderMapping);
  const invoiceMappingReady = hasRequiredMapping(INVOICE_FIELDS, invoiceMapping);

  const orderRows = useMemo(() => {
    if (!orderMappingReady) return [];
    return mapOrderRows(orderFile.rows, orderMapping);
  }, [orderFile.rows, orderMapping, orderMappingReady]);

  const invoiceRows = useMemo(() => {
    if (!invoiceMappingReady) return [];
    return mapInvoiceRows(invoiceFile.rows, invoiceMapping);
  }, [invoiceFile.rows, invoiceMapping, invoiceMappingReady]);

  const hasBothFiles = orderFile.rows.length > 0 && invoiceFile.rows.length > 0;
  const canAnalyze = hasBothFiles && orderMappingReady && invoiceMappingReady;

  const problems = useMemo(() => {
    if (!hasAnalyzed || !canAnalyze) return [];
    return findProblems(orderRows, invoiceRows);
  }, [orderRows, invoiceRows, canAnalyze, hasAnalyzed]);

  const totalValue = useMemo(() => {
    return problems.reduce((sum, problem) => sum + problem.amount, 0);
  }, [problems]);

  async function handleOrderUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setHasAnalyzed(false);
    setShowAllOrderMapping(false);
    setOrderFileName(file.name);

    const text = await file.text();
    const parsed = parseCsv(text);

    setOrderFile(parsed);
    setOrderMapping(guessMapping(parsed.headers, ORDER_FIELDS));
  }

  async function handleInvoiceUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setHasAnalyzed(false);
    setShowAllInvoiceMapping(false);
    setInvoiceFileName(file.name);

    const text = await file.text();
    const parsed = parseCsv(text);

    setInvoiceFile(parsed);
    setInvoiceMapping(guessMapping(parsed.headers, INVOICE_FIELDS));
  }

  function updateOrderMapping(field: OrderField, value: string) {
    setHasAnalyzed(false);
    setOrderMapping((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateInvoiceMapping(field: InvoiceField, value: string) {
    setHasAnalyzed(false);
    setInvoiceMapping((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleAnalyze() {
    setHasAnalyzed(true);

    window.setTimeout(() => {
      analysisRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <Link href="/" className="text-sm text-slate-400 hover:text-white">
            ← Tilbage
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-red-400">
            Upload og analyse
          </p>

          <h1 className="mt-2 text-4xl font-bold md:text-5xl">
            Sammenlign ordrestyring med fakturaer
          </h1>

          <p className="mt-3 max-w-3xl text-slate-400">
            Upload én fil fra ordrestyring og én fil fra fakturaprogrammet.
            FakturaTjek finder automatisk de relevante kolonner. Hvis noget
            mangler, bliver du kun bedt om at vælge de manglende kolonner.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <UploadBox
            title="1. Upload data fra ordrestyring"
            description="Filen skal indeholde kunder og projekter. Timer, materialer, status og datoer forbedrer analysen, men er ikke altid nødvendige."
            fileName={orderFileName}
            onChange={handleOrderUpload}
          />

          <UploadBox
            title="2. Upload data fra fakturaprogram"
            description="Filen skal indeholde kunder og projekter. Fakturerede timer, materialer, beløb, status og datoer forbedrer analysen."
            fileName={invoiceFileName}
            onChange={handleInvoiceUpload}
          />
        </section>

        {!hasAnalyzed && orderFile.headers.length > 0 && (
          <AutoMappingStatus
            title="Ordrestyring"
            fields={ORDER_FIELDS}
            mapping={orderMapping}
            onEditAll={() => setShowAllOrderMapping(true)}
          />
        )}

        {!hasAnalyzed && invoiceFile.headers.length > 0 && (
          <AutoMappingStatus
            title="Fakturaprogram"
            fields={INVOICE_FIELDS}
            mapping={invoiceMapping}
            onEditAll={() => setShowAllInvoiceMapping(true)}
          />
        )}

        {!hasAnalyzed &&
          orderFile.headers.length > 0 &&
          (showAllOrderMapping || missingOrderRequiredFields.length > 0) && (
            <MappingBox
              title={
                showAllOrderMapping
                  ? "Ret kolonner fra ordrestyring"
                  : "Vælg manglende kolonner fra ordrestyring"
              }
              description={
                showAllOrderMapping
                  ? "Her kan du rette alle kolonner, hvis FakturaTjek har gættet forkert."
                  : "FakturaTjek kunne ikke finde disse nødvendige kolonner automatisk."
              }
              fields={
                showAllOrderMapping ? ORDER_FIELDS : missingOrderRequiredFields
              }
              headers={orderFile.headers}
              mapping={orderMapping}
              onChange={updateOrderMapping}
            />
          )}

        {!hasAnalyzed &&
          invoiceFile.headers.length > 0 &&
          (showAllInvoiceMapping || missingInvoiceRequiredFields.length > 0) && (
            <MappingBox
              title={
                showAllInvoiceMapping
                  ? "Ret kolonner fra fakturaprogram"
                  : "Vælg manglende kolonner fra fakturaprogram"
              }
              description={
                showAllInvoiceMapping
                  ? "Her kan du rette alle kolonner, hvis FakturaTjek har gættet forkert."
                  : "FakturaTjek kunne ikke finde disse nødvendige kolonner automatisk."
              }
              fields={
                showAllInvoiceMapping
                  ? INVOICE_FIELDS
                  : missingInvoiceRequiredFields
              }
              headers={invoiceFile.headers}
              mapping={invoiceMapping}
              onChange={updateInvoiceMapping}
            />
          )}

        {!hasAnalyzed && hasBothFiles && (
          <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold text-red-200">
                Klar til analyse
              </h2>
              <p className="mt-2 text-sm text-red-200/80">
                FakturaTjek har fundet de nødvendige kolonner, hvis knappen er
                aktiv. Tryk på Analyser data for at skjule kolonne-kontrollen og
                se resultaterne.
              </p>
            </div>

            <button
              type="button"
              disabled={!canAnalyze}
              onClick={handleAnalyze}
              className="mt-6 rounded-xl bg-red-500 px-6 py-4 font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              Analyser data
            </button>

            {!canAnalyze && (
              <p className="mt-3 text-sm text-yellow-200">
                Kunde og projekt skal være fundet eller valgt i begge filer, før
                analysen kan køre.
              </p>
            )}
          </section>
        )}

        {!hasBothFiles &&
          (orderFile.rows.length > 0 || invoiceFile.rows.length > 0) && (
            <section className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
              <h2 className="text-xl font-bold text-yellow-200">
                Upload begge filer for at starte analysen
              </h2>
              <p className="mt-2 text-sm text-yellow-100/80">
                FakturaTjek skal bruge både data fra ordrestyring og
                fakturaprogram for at kunne sammenligne opgaver, timer,
                materialer og fakturaer.
              </p>
            </section>
          )}

        {hasAnalyzed && (
          <section
            ref={analysisRef}
            className="scroll-mt-8 grid grid-cols-1 gap-4 md:grid-cols-4"
          >
            <StatCard label="Opgaver læst" value={orderRows.length.toString()} />
            <StatCard
              label="Fakturaer læst"
              value={invoiceRows.length.toString()}
            />
            <StatCard
              label="Fundne problemer"
              value={problems.length.toString()}
            />
            <StatCard label="Potentiel værdi" value={formatCurrency(totalValue)} />
          </section>
        )}

        {hasAnalyzed && problems.length === 0 && (
          <section className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
            <h2 className="text-xl font-bold text-green-200">
              Ingen problemer fundet
            </h2>
            <p className="mt-2 text-sm text-green-100/80">
              FakturaTjek fandt ingen opgaver, timer, materialer eller forfaldne
              fakturaer, der kræver opfølgning.
            </p>
          </section>
        )}

        {hasAnalyzed && problems.length > 0 && (
          <ProblemResults problems={problems} totalValue={totalValue} />
        )}

        {hasAnalyzed && orderRows.length > 0 && (
          <DataTable
            title="Data fra ordrestyring"
            description="Data efter kolonnerne er blevet matchet."
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

        {hasAnalyzed && invoiceRows.length > 0 && (
          <DataTable
            title="Data fra fakturaprogram"
            description="Data efter kolonnerne er blevet matchet."
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
            rows={invoiceRows.map((row) => [
              row.faktura_id,
              row.kunde,
              row.projekt,
              row.status,
              row.timer_faktureret,
              formatCurrency(row.materialer_faktureret),
              formatCurrency(row.beloeb),
              row.dato,
            ])}
          />
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold">Vil du teste med demo-data?</h2>

            <p className="mt-2 text-sm text-slate-400">
              Download to realistiske CSV-filer og upload dem ovenfor. Filerne
              viser én fejl i hver kategori: manglende faktura, manglende timer,
              manglende materialer og forfalden faktura.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <a
              href="/testdata/ordrestyring-demo.csv"
              download
              className="rounded-xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-center font-semibold text-red-200 hover:bg-red-500/20"
            >
              Download ordrestyring-demo.csv
            </a>

            <a
              href="/testdata/fakturaer-demo.csv"
              download
              className="rounded-xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-center font-semibold text-red-200 hover:bg-red-500/20"
            >
              Download fakturaer-demo.csv
            </a>
          </div>
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

function AutoMappingStatus<T extends string>({
  title,
  fields,
  mapping,
  onEditAll,
}: {
  title: string;
  fields: FieldConfig<T>[];
  mapping: Mapping<T>;
  onEditAll: () => void;
}) {
  const mappedFields = getMappedFields(fields, mapping);
  const missingRequiredFields = getMissingRequiredFields(fields, mapping);
  const missingOptionalFields = getMissingOptionalFields(fields, mapping);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-red-400">
            {title}
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            FakturaTjek har genkendt felterne
          </h2>

          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Vi har automatisk fundet de felter, der skal bruges til analysen.
            Du behøver kun rette noget, hvis det ser forkert ud.
          </p>
        </div>

        <button
          type="button"
          onClick={onEditAll}
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/20"
        >
          Ret felter
        </button>
      </div>

      {mappedFields.length > 0 && (
        <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/10 p-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">✓</span>
            <h3 className="font-bold text-green-200">Fundet automatisk</h3>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {mappedFields.map((field) => (
              <div
                key={field.key}
                className="rounded-xl border border-green-500/20 bg-slate-950/40 p-4"
              >
                <p className="text-xs uppercase tracking-wide text-green-200/70">
                  {field.label}
                </p>
                <p className="mt-1 font-semibold text-green-100">
                  {formatHeaderLabel(mapping[field.key])}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {missingRequiredFields.length > 0 && (
        <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">!</span>
            <h3 className="font-bold text-yellow-200">
              Vi mangler nogle felter
            </h3>
          </div>

          <p className="mt-2 text-sm text-yellow-100/80">
            Vælg disse felter manuelt, før analysen kan køre:
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {missingRequiredFields.map((field) => (
              <span
                key={field.key}
                className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-sm text-yellow-100"
              >
                {field.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {missingOptionalFields.length > 0 && (
        <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <h3 className="font-bold text-slate-200">
            Ikke alle ekstra felter blev fundet
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Det er ikke nødvendigvis et problem. Analysen kan stadig køre, men
            bliver mere præcis, hvis disse felter også findes:
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {missingOptionalFields.map((field) => (
              <span
                key={field.key}
                className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-300"
              >
                {field.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
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

          {problem.dato && (
            <p className="mt-5 text-sm text-slate-400">Dato: {problem.dato}</p>
          )}
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

function MappingBox<T extends string>({
  title,
  description,
  fields,
  headers,
  mapping,
  onChange,
}: {
  title: string;
  description: string;
  fields: FieldConfig<T>[];
  headers: string[];
  mapping: Mapping<T>;
  onChange: (field: T, value: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className="block">
            <span className="text-sm font-medium text-slate-300">
              {field.label}
              {field.required && <span className="text-red-400"> *</span>}
            </span>

            <select
              value={mapping[field.key]}
              onChange={(event) => onChange(field.key, event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
            >
              <option value="">Ikke valgt</option>

              {headers.map((header) => (
                <option key={header} value={header}>
                  {formatHeaderLabel(header)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
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