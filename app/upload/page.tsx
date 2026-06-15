"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, RefObject } from "react";
import * as XLSX from "xlsx";

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
  opgave_id?: string;
  faktura_id?: string;
  kunde: string;
  projekt: string;
  status: string;
  dato?: string;
  amount: number;
  title: string;
  explanation: string;
  action: string;
};

type MatchCandidate = {
  id: string;
  orderIndex: number;
  invoiceIndex: number;
  confidence: "muligt" | "usikkert";
  score: number;
  reasons: string[];
  order: OrderRow;
  invoice: InvoiceRow;
};

type MatchDecision = Record<string, "yes" | "no" | undefined>;

type ApprovedMatch = {
  orderIndex: number;
  invoiceIndex: number;
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

type ReportRow = {
  "Problem nr.": number;
  Problemtype: string;
  Status: string;
  Kunde: string;
  Projekt: string;
  "Opgave ID": string;
  "Faktura ID": string;
  Dato: string;
  "Hvad er problemet?": string;
  "Hvorfor er det fundet?": string;
  "Hvad bør du gøre nu?": string;
  "Potentiel værdi": string;
};

const HOURLY_RATE = 550;
const AUTO_APPROVE_MATCH_SCORE = 0.92;

const ORDER_FIELDS: FieldConfig<OrderField>[] = [
  {
    key: "opgave_id",
    label: "Opgave ID",
    aliases: [
      "opgave_id",
      "opgave id",
      "opgaveid",
      "opgavenr",
      "opgave nr",
      "opgavenummer",
      "sagref",
      "sagsref",
      "sag ref",
      "sags ref",
      "sag reference",
      "sagsreference",
      "sagsnummer",
      "sag nr",
      "sag nummer",
      "reference",
      "ref",
      "opgave reference",
      "ordre reference",
      "job id",
      "job nr",
      "jobnummer",
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
      "modtager",
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
      "opgave",
      "opgavenavn",
      "arbejde",
      "arbejdsbeskrivelse",
      "beskrivelse",
      "opgavebeskrivelse",
      "jobbeskrivelse",
      "tekst",
      "ydelse",
      "arbejdsopgave",
      "job",
      "jobnavn",
      "ordre",
      "ordrenavn",
      "project",
      "case",
      "task",
      "order",
      "description",
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
      "antal_arbejdstimer",
      "arbejdstimer",
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
      "varer_forbrug",
      "vareforbrug",
      "varer",
      "varer forbrug",
      "materiale forbrug",
      "materialeforbrug",
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
      "udført_den",
      "udfoert_den",
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
      "bilagsnr",
      "bilag nr",
      "bilagsnummer",
      "bilag",
      "faktnr",
      "fakt nr",
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
      "modtager",
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
      "opgave",
      "opgavenavn",
      "arbejde",
      "arbejdsbeskrivelse",
      "beskrivelse",
      "tekst",
      "ydelse",
      "fakturatekst",
      "linjetekst",
      "job",
      "jobnavn",
      "ordre",
      "ordrenavn",
      "project",
      "case",
      "task",
      "order",
      "description",
    ],
    required: true,
  },
  {
    key: "status",
    label: "Status",
    aliases: [
      "status",
      "betaling",
      "betalingsstatus",
      "fakturastatus",
      "tilstand",
      "fase",
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
      "arbejdstimer_paa_regning",
      "arbejdstimer på regning",
      "timer på regning",
      "timer paa regning",
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
      "materiale_salg",
      "materiale salg",
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
      "totalpris",
      "total pris",
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
      "sendt_den",
      "sendt den",
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

async function parseUploadedFile(file: File): Promise<ParsedCsv> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".csv")) {
    const text = await file.text();
    return parseCsv(text);
  }

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, {
      type: "array",
    });

    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return {
        headers: [],
        rows: [],
      };
    }

    const worksheet = workbook.Sheets[firstSheetName];

    const sheetRows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    }) as string[][];

    const cleanedRows = sheetRows
      .map((row) => row.map((cell) => String(cell).trim()))
      .filter((row) => row.some((cell) => cell.length > 0));

    if (cleanedRows.length < 2) {
      return {
        headers: [],
        rows: [],
      };
    }

    const headers = cleanedRows[0];

    const rows = cleanedRows.slice(1).map((values) => {
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

  return {
    headers: [],
    rows: [],
  };
}

function normalizeText(value: string | undefined) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\./g, "")
    .replace(/\baps\b/g, "")
    .replace(/\ba\/s\b/g, "")
    .replace(/\bas\b/g, "")
    .replace(/\bivs\b/g, "")
    .replace(/\bab\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
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

function getAliasMatchScore(header: string, alias: string) {
  const normalizedHeader = normalizeText(header);
  const normalizedAlias = normalizeText(alias);

  if (!normalizedHeader || !normalizedAlias) return 0;

  if (normalizedHeader === normalizedAlias) {
    return 100;
  }

  const headerWords = normalizedHeader.split(" ");
  const aliasWords = normalizedAlias.split(" ");

  if (
    aliasWords.length > 1 &&
    aliasWords.every((word) => headerWords.includes(word))
  ) {
    return 80;
  }

  if (normalizedHeader.includes(normalizedAlias) && normalizedAlias.length >= 5) {
    return 60;
  }

  if (normalizedAlias.includes(normalizedHeader) && normalizedHeader.length >= 5) {
    return 45;
  }

  return 0;
}

function isKnownAlias<T extends string>(header: string, field: FieldConfig<T>) {
  return field.aliases.some((alias) => getAliasMatchScore(header, alias) >= 45);
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

      field.aliases.forEach((alias) => {
        const score = getAliasMatchScore(header, alias);

        if (score > bestScore) {
          bestScore = score;
          bestHeader = header;
        }
      });
    });

    if (bestHeader && bestScore >= 45) {
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

function getRedFields<T extends string>(
  fields: FieldConfig<T>[],
  mapping: Mapping<T>
) {
  return fields.filter((field) => {
    const selectedHeader = mapping[field.key];

    if (!selectedHeader) return true;

    return !isKnownAlias(selectedHeader, field);
  });
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

function formatReportDate(date = new Date()) {
  return new Intl.DateTimeFormat("da-DK", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatFileDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function escapeHtml(value: string | number | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function isCompletedOrderStatus(statusValue?: string) {
  const status = normalizeText(statusValue);

  if (!status) return false;

  return (
    status.includes("afsluttet") ||
    status.includes("faerdig") ||
    status.includes("færdig") ||
    status.includes("udfoert") ||
    status.includes("udført") ||
    status.includes("completed") ||
    status.includes("done") ||
    status.includes("lukket")
  );
}

function getInvoiceNumbers(invoices: InvoiceRow[]) {
  return invoices
    .map((invoice) => invoice.faktura_id)
    .filter(Boolean)
    .join(", ");
}

function tokenize(value: string | undefined) {
  return normalizeText(value)
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length > 1);
}

function levenshteinDistance(a: string, b: string) {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function textSimilarity(a: string | undefined, b: string | undefined) {
  const left = normalizeText(a);
  const right = normalizeText(b);

  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.92;

  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);

  if (leftTokens.length === 0 || rightTokens.length === 0) return 0;

  const shared = leftTokens.filter((token) => rightTokens.includes(token));
  const tokenScore = shared.length / Math.max(leftTokens.length, rightTokens.length);

  const compactLeft = left.replace(/\s+/g, "");
  const compactRight = right.replace(/\s+/g, "");
  const editScore =
    1 -
    levenshteinDistance(compactLeft, compactRight) /
      Math.max(compactLeft.length, compactRight.length);

  return Math.max(tokenScore, editScore);
}

function dateDistanceScore(orderDate?: string, invoiceDate?: string) {
  if (!orderDate || !invoiceDate) return 0;

  const order = new Date(orderDate);
  const invoice = new Date(invoiceDate);

  if (Number.isNaN(order.getTime()) || Number.isNaN(invoice.getTime())) {
    return 0;
  }

  if (invoice.getTime() < order.getTime()) {
    return 0;
  }

  const days =
    Math.abs(invoice.getTime() - order.getTime()) / (1000 * 60 * 60 * 24);

  if (days <= 7) return 1;
  if (days <= 30) return 0.65;
  if (days <= 90) return 0.35;

  return 0;
}

function getMatchCandidateScore(order: OrderRow, invoice: InvoiceRow) {
  const customerScore = textSimilarity(order.kunde, invoice.kunde);
  const projectScore = textSimilarity(order.projekt, invoice.projekt);
  const dateScore = dateDistanceScore(order.dato, invoice.dato);

  const score = customerScore * 0.5 + projectScore * 0.4 + dateScore * 0.1;
  const reasons: string[] = [];

  if (customerScore >= 0.55) reasons.push("kundenavnet ligner");
  if (projectScore >= 0.45) reasons.push("projektet ligner");
  if (dateScore >= 0.35) reasons.push("datoerne ligger tæt på hinanden");

  return {
    score,
    customerScore,
    projectScore,
    dateScore,
    reasons,
  };
}

function findMatchCandidates(
  orderRows: OrderRow[],
  invoiceRows: InvoiceRow[]
): MatchCandidate[] {
  const candidates: MatchCandidate[] = [];
  const usedInvoiceIndexes = new Set<number>();

  orderRows.forEach((order, orderIndex) => {
    const exactMatchExists = invoiceRows.some((invoice) => {
      return (
        getMatchKey(order.kunde, order.projekt) ===
        getMatchKey(invoice.kunde, invoice.projekt)
      );
    });

    if (exactMatchExists) return;

    const possibleInvoices = invoiceRows
      .map((invoice, invoiceIndex) => {
        if (usedInvoiceIndexes.has(invoiceIndex)) return null;

        const exactMatch =
          getMatchKey(order.kunde, order.projekt) ===
          getMatchKey(invoice.kunde, invoice.projekt);

        if (exactMatch || !isInvoiceUsable(invoice)) {
          return null;
        }

        const { score, customerScore, projectScore, reasons } =
          getMatchCandidateScore(order, invoice);

        const shouldShow =
          customerScore >= 0.55 &&
          (projectScore >= 0.35 || customerScore >= 0.8);

        if (!shouldShow) {
          return null;
        }

        return {
          id: `${orderIndex}-${invoiceIndex}`,
          orderIndex,
          invoiceIndex,
          confidence: score >= 0.68 ? ("muligt" as const) : ("usikkert" as const),
          score,
          reasons:
            reasons.length > 0
              ? reasons
              : ["kunde og projekt ligner delvist hinanden"],
          order,
          invoice,
        };
      })
      .filter(Boolean) as MatchCandidate[];

    const bestCandidate = possibleInvoices.sort((a, b) => b.score - a.score)[0];

    if (bestCandidate) {
      candidates.push(bestCandidate);
      usedInvoiceIndexes.add(bestCandidate.invoiceIndex);
    }
  });

  return candidates;
}

function findMatchingOrderForInvoice(
  invoiceIndex: number,
  invoice: InvoiceRow,
  orderRows: OrderRow[],
  approvedMatches: ApprovedMatch[]
) {
  const exactOrder = orderRows.find((order) => {
    return (
      getMatchKey(order.kunde, order.projekt) ===
      getMatchKey(invoice.kunde, invoice.projekt)
    );
  });

  if (exactOrder) return exactOrder;

  const approvedMatch = approvedMatches.find((match) => {
    return match.invoiceIndex === invoiceIndex;
  });

  if (!approvedMatch) return undefined;

  return orderRows[approvedMatch.orderIndex];
}

function findProblems(
  orderRows: OrderRow[],
  invoiceRows: InvoiceRow[],
  approvedMatches: ApprovedMatch[]
): Problem[] {
  const problems: Problem[] = [];
  const invoiceMap = new Map<string, InvoiceRow[]>();

  invoiceRows.forEach((invoice) => {
    const key = getMatchKey(invoice.kunde, invoice.projekt);
    const existing = invoiceMap.get(key) || [];
    existing.push(invoice);
    invoiceMap.set(key, existing);
  });

  orderRows.forEach((order, orderIndex) => {
    const kunde = order.kunde || "Ukendt kunde";
    const projekt = order.projekt || "Ukendt projekt";
    const status = normalizeText(order.status);
    const hasStatus = Boolean(status);
    const isCompletedOrder = isCompletedOrderStatus(order.status);
    const shouldCheckOrder = hasStatus ? isCompletedOrder : true;
    const key = getMatchKey(order.kunde, order.projekt);

    const exactInvoices = (invoiceMap.get(key) || []).filter(isInvoiceUsable);

    const approvedInvoices = approvedMatches
      .filter((match) => match.orderIndex === orderIndex)
      .map((match) => invoiceRows[match.invoiceIndex])
      .filter((invoice): invoice is InvoiceRow => Boolean(invoice))
      .filter(isInvoiceUsable);

    const matchingInvoices = [...exactInvoices, ...approvedInvoices].filter(
      (invoice, index, list) => list.indexOf(invoice) === index
    );

    const invoiceNumbers = getInvoiceNumbers(matchingInvoices);

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
        opgave_id: order.opgave_id,
        faktura_id: "",
        kunde,
        projekt,
        status: "Manglende faktura",
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
        opgave_id: order.opgave_id,
        faktura_id: invoiceNumbers,
        kunde,
        projekt,
        status: "Timer mangler på faktura",
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
        opgave_id: order.opgave_id,
        faktura_id: invoiceNumbers,
        kunde,
        projekt,
        status: "Materialer mangler på faktura",
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

  invoiceRows.forEach((invoice, invoiceIndex) => {
    const status = normalizeText(invoice.status);

    if (status.includes("forfalden")) {
      const kunde = invoice.kunde || "Ukendt kunde";
      const projekt = invoice.projekt || "Ukendt projekt";
      const matchingOrder = findMatchingOrderForInvoice(
        invoiceIndex,
        invoice,
        orderRows,
        approvedMatches
      );

      problems.push({
        type: "faktura",
        opgave_id: matchingOrder?.opgave_id,
        faktura_id: invoice.faktura_id,
        kunde,
        projekt,
        status: "Forfalden faktura",
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

function getReportRows(problems: Problem[]): ReportRow[] {
  return problems.map((problem, index) => {
    const meta = getProblemMeta(problem.type);

    const invoiceNumber =
      problem.faktura_id && problem.faktura_id.trim().length > 0
        ? problem.faktura_id
        : problem.type === "opgave"
          ? "Ikke fundet"
          : "-";

    return {
      "Problem nr.": index + 1,
      Problemtype: meta.label,
      Status: problem.status,
      Kunde: problem.kunde,
      Projekt: problem.projekt,
      "Opgave ID": problem.opgave_id || "-",
      "Faktura ID": invoiceNumber,
      Dato: problem.dato || "-",
      "Hvad er problemet?": problem.title,
      "Hvorfor er det fundet?": problem.explanation,
      "Hvad bør du gøre nu?": problem.action,
      "Potentiel værdi": formatCurrency(problem.amount),
    };
  });
}

function downloadCsvReport(problems: Problem[]) {
  const rows = getReportRows(problems);
  const headers = [
    "Problem nr.",
    "Problemtype",
    "Status",
    "Kunde",
    "Projekt",
    "Opgave ID",
    "Faktura ID",
    "Dato",
    "Hvad er problemet?",
    "Hvorfor er det fundet?",
    "Hvad bør du gøre nu?",
    "Potentiel værdi",
  ];

  const escapeCsvValue = (value: string | number) => {
    const text = String(value ?? "");

    if (text.includes(";") || text.includes("\n") || text.includes('"')) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  };

  const csvContent = [
    headers.join(";"),
    ...rows.map((row) =>
      headers
        .map((header) => escapeCsvValue(row[header as keyof ReportRow]))
        .join(";")
    ),
  ].join("\n");

  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `fakturatjek-rapport-${formatFileDate()}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function downloadExcelReport(problems: Problem[]) {
  const rows = getReportRows(problems);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 18 },
    { wch: 26 },
    { wch: 24 },
    { wch: 28 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 40 },
    { wch: 60 },
    { wch: 60 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Fundne problemer");
  XLSX.writeFile(workbook, `fakturatjek-rapport-${formatFileDate()}.xlsx`);
}

function downloadPdfReport({
  problems,
  totalValue,
  orderCount,
  invoiceCount,
}: {
  problems: Problem[];
  totalValue: number;
  orderCount: number;
  invoiceCount: number;
}) {
  const createdAt = formatReportDate();

  const problemRows = problems
    .map((problem, index) => {
      const meta = getProblemMeta(problem.type);

      const invoiceNumber =
        problem.faktura_id && problem.faktura_id.trim().length > 0
          ? problem.faktura_id
          : problem.type === "opgave"
            ? "Ikke fundet"
            : "-";

      return `
        <article class="problem-card">
          <div class="problem-top">
            <div>
              <p class="eyebrow">Problem ${index + 1}</p>
              <h2>${escapeHtml(meta.label)}</h2>
              <span class="status">${escapeHtml(problem.status)}</span>
            </div>

            <div class="value-box">
              <p>Værdi</p>
              <strong>${escapeHtml(formatCurrency(problem.amount))}</strong>
            </div>
          </div>

          <div class="grid">
            <div>
              <p class="label">Kunde</p>
              <p class="main">${escapeHtml(problem.kunde)}</p>
            </div>

            <div>
              <p class="label">Projekt</p>
              <p class="main">${escapeHtml(problem.projekt)}</p>
            </div>

            <div>
              <p class="label">Opgave ID</p>
              <p>${escapeHtml(problem.opgave_id || "-")}</p>
            </div>

            <div>
              <p class="label">Faktura ID</p>
              <p>${escapeHtml(invoiceNumber)}</p>
            </div>

            <div>
              <p class="label">Dato</p>
              <p>${escapeHtml(problem.dato || "-")}</p>
            </div>
          </div>

          <div class="section">
            <p class="section-title">Hvad er problemet?</p>
            <p>${escapeHtml(problem.title)}</p>
          </div>

          <div class="section">
            <p class="section-title">Hvorfor er det fundet?</p>
            <p>${escapeHtml(problem.explanation)}</p>
          </div>

          <div class="action">
            <p class="section-title">Hvad bør du gøre nu?</p>
            <p>${escapeHtml(problem.action)}</p>
          </div>
        </article>
      `;
    })
    .join("");

  const html = `
    <!doctype html>
    <html lang="da">
      <head>
        <meta charset="utf-8" />
        <title>FakturaTjek analyse-rapport</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #f8fafc;
            color: #0f172a;
            font-family: Arial, Helvetica, sans-serif;
          }
          .page {
            max-width: 980px;
            margin: 0 auto;
            padding: 48px;
          }
          .header {
            border-bottom: 4px solid #ef4444;
            padding-bottom: 24px;
            margin-bottom: 28px;
          }
          .brand {
            color: #ef4444;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            font-size: 13px;
          }
          h1 {
            margin: 10px 0 0;
            font-size: 36px;
            line-height: 1.1;
          }
          .date {
            margin-top: 10px;
            color: #64748b;
            font-size: 14px;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
            margin: 28px 0;
          }
          .summary-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            padding: 18px;
          }
          .summary-card p {
            margin: 0;
            color: #64748b;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 700;
          }
          .summary-card strong {
            display: block;
            margin-top: 8px;
            font-size: 24px;
          }
          .intro {
            background: #fff1f2;
            border: 1px solid #fecdd3;
            color: #7f1d1d;
            border-radius: 18px;
            padding: 18px;
            line-height: 1.6;
            margin-bottom: 26px;
          }
          .problem-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 22px;
            padding: 24px;
            margin-bottom: 18px;
            page-break-inside: avoid;
          }
          .problem-top {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 18px;
            margin-bottom: 18px;
          }
          .eyebrow {
            margin: 0;
            color: #64748b;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            font-weight: 700;
          }
          h2 {
            margin: 6px 0 12px;
            font-size: 26px;
          }
          .status {
            display: inline-block;
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #fecaca;
            border-radius: 999px;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .value-box {
            text-align: right;
            min-width: 160px;
          }
          .value-box p {
            margin: 0;
            color: #64748b;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 700;
          }
          .value-box strong {
            display: block;
            margin-top: 8px;
            font-size: 26px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 18px;
          }
          .label {
            margin: 0 0 4px;
            color: #64748b;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 800;
          }
          .main {
            font-weight: 800;
            font-size: 16px;
          }
          .section {
            margin-top: 16px;
          }
          .section p {
            line-height: 1.55;
          }
          .section-title {
            margin: 0 0 6px;
            color: #991b1b;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-weight: 900;
          }
          .action {
            margin-top: 18px;
            background: #fff1f2;
            border: 1px solid #fecdd3;
            border-radius: 16px;
            padding: 16px;
          }
          .footer {
            margin-top: 34px;
            padding-top: 18px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 13px;
          }
          @media print {
            body { background: white; }
            .page {
              max-width: none;
              padding: 28px;
            }
            .problem-card { break-inside: avoid; }
          }
        </style>
      </head>

      <body>
        <main class="page">
          <header class="header">
            <div class="brand">FakturaTjek</div>
            <h1>Analyse-rapport</h1>
            <div class="date">Rapport oprettet: ${escapeHtml(createdAt)}</div>
          </header>

          <section class="summary">
            <div class="summary-card">
              <p>Opgaver læst</p>
              <strong>${escapeHtml(orderCount)}</strong>
            </div>
            <div class="summary-card">
              <p>Fakturaer læst</p>
              <strong>${escapeHtml(invoiceCount)}</strong>
            </div>
            <div class="summary-card">
              <p>Fundne problemer</p>
              <strong>${escapeHtml(problems.length)}</strong>
            </div>
            <div class="summary-card">
              <p>Potentiel værdi</p>
              <strong>${escapeHtml(formatCurrency(totalValue))}</strong>
            </div>
          </section>

          <section class="intro">
            Rapporten viser poster, som FakturaTjek vurderer bør kontrolleres manuelt.
            FakturaTjek laver ikke bogføring, ændrer ikke dine data og er ikke et endeligt facit.
          </section>

          ${problemRows}

          <footer class="footer">
            <strong>FakturaTjek</strong><br />
            Kontakt: kontakt@fakturatjek.net
          </footer>
        </main>

        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  const reportWindow = window.open("", "_blank");

  if (!reportWindow) {
    alert("Rapporten kunne ikke åbnes. Tillad popups og prøv igen.");
    return;
  }

  reportWindow.document.open();
  reportWindow.document.write(html);
  reportWindow.document.close();
}

export default function UploadPage() {
  const analysisRef = useRef<HTMLDivElement | null>(null);
  const matchReviewRef = useRef<HTMLDivElement | null>(null);

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
  const [isReviewingMatches, setIsReviewingMatches] = useState(false);
  const [matchCandidates, setMatchCandidates] = useState<MatchCandidate[]>([]);
  const [autoApprovedMatches, setAutoApprovedMatches] = useState<ApprovedMatch[]>([]);
  const [matchDecisions, setMatchDecisions] = useState<MatchDecision>({});

  const redOrderFields = getRedFields(ORDER_FIELDS, orderMapping);
  const redInvoiceFields = getRedFields(INVOICE_FIELDS, invoiceMapping);

  const orderMappingReady = hasRequiredMapping(ORDER_FIELDS, orderMapping);
  const invoiceMappingReady = hasRequiredMapping(INVOICE_FIELDS, invoiceMapping);

  const shouldShowOrderMapping =
    orderFile.headers.length > 0 && redOrderFields.length > 0;

  const shouldShowInvoiceMapping =
    invoiceFile.headers.length > 0 && redInvoiceFields.length > 0;

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

  const allMatchCandidatesAnswered =
    matchCandidates.length > 0 &&
    matchCandidates.every((candidate) => Boolean(matchDecisions[candidate.id]));

  const manuallyApprovedMatches = useMemo(() => {
    return matchCandidates
      .filter((candidate) => matchDecisions[candidate.id] === "yes")
      .map((candidate) => ({
        orderIndex: candidate.orderIndex,
        invoiceIndex: candidate.invoiceIndex,
      }));
  }, [matchCandidates, matchDecisions]);

  const approvedMatches = useMemo(() => {
    return [...autoApprovedMatches, ...manuallyApprovedMatches].filter(
      (match, index, list) =>
        index ===
        list.findIndex(
          (item) =>
            item.orderIndex === match.orderIndex &&
            item.invoiceIndex === match.invoiceIndex
        )
    );
  }, [autoApprovedMatches, manuallyApprovedMatches]);

  const problems = useMemo(() => {
    if (!hasAnalyzed || !canAnalyze) return [];
    return findProblems(orderRows, invoiceRows, approvedMatches);
  }, [orderRows, invoiceRows, canAnalyze, hasAnalyzed, approvedMatches]);

  const totalValue = useMemo(() => {
    return problems.reduce((sum, problem) => sum + problem.amount, 0);
  }, [problems]);

  async function handleOrderUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setHasAnalyzed(false);
    setIsReviewingMatches(false);
    setMatchCandidates([]);
    setAutoApprovedMatches([]);
    setMatchDecisions({});
    setOrderFileName(file.name);

    const parsed = await parseUploadedFile(file);

    setOrderFile(parsed);
    setOrderMapping(guessMapping(parsed.headers, ORDER_FIELDS));
  }

  async function handleInvoiceUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setHasAnalyzed(false);
    setIsReviewingMatches(false);
    setMatchCandidates([]);
    setAutoApprovedMatches([]);
    setMatchDecisions({});
    setInvoiceFileName(file.name);

    const parsed = await parseUploadedFile(file);

    setInvoiceFile(parsed);
    setInvoiceMapping(guessMapping(parsed.headers, INVOICE_FIELDS));
  }

  function updateOrderMapping(field: OrderField, value: string) {
    setHasAnalyzed(false);
    setIsReviewingMatches(false);
    setMatchCandidates([]);
    setAutoApprovedMatches([]);
    setMatchDecisions({});
    setOrderMapping((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateInvoiceMapping(field: InvoiceField, value: string) {
    setHasAnalyzed(false);
    setIsReviewingMatches(false);
    setMatchCandidates([]);
    setAutoApprovedMatches([]);
    setMatchDecisions({});
    setInvoiceMapping((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleAnalyze() {
    const candidates = findMatchCandidates(orderRows, invoiceRows);

    const automaticMatches = candidates
      .filter((candidate) => candidate.score >= AUTO_APPROVE_MATCH_SCORE)
      .map((candidate) => ({
        orderIndex: candidate.orderIndex,
        invoiceIndex: candidate.invoiceIndex,
      }));

    const candidatesToReview = candidates.filter(
      (candidate) => candidate.score < AUTO_APPROVE_MATCH_SCORE
    );

    setAutoApprovedMatches(automaticMatches);
    setMatchCandidates(candidatesToReview);
    setMatchDecisions({});
    setHasAnalyzed(false);

    if (candidatesToReview.length > 0) {
      setIsReviewingMatches(true);

      window.setTimeout(() => {
        matchReviewRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);

      return;
    }

    setIsReviewingMatches(false);
    setHasAnalyzed(true);

    window.setTimeout(() => {
      analysisRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  function updateMatchDecision(candidateId: string, decision: "yes" | "no") {
    setMatchDecisions((current) => ({
      ...current,
      [candidateId]: decision,
    }));
  }

  function finishMatchReview() {
    setIsReviewingMatches(false);
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
            Upload én CSV- eller Excel-fil fra ordrestyring og én CSV- eller
            Excel-fil fra fakturaprogrammet. FakturaTjek forsøger automatisk at
            finde de rigtige kolonner. Hvis en kolonne ikke kan placeres, bliver
            du bedt om at vælge den manuelt.
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

        {!hasAnalyzed && !isReviewingMatches && shouldShowOrderMapping && (
          <MappingBox
            title="Felter fra ordrestyring"
            description="Kun felter der mangler eller ikke kunne genkendes, skal rettes. Grøn betyder fundet. Rød betyder mangler."
            fields={ORDER_FIELDS}
            headers={orderFile.headers}
            mapping={orderMapping}
            onChange={updateOrderMapping}
          />
        )}

        {!hasAnalyzed && !isReviewingMatches && shouldShowInvoiceMapping && (
          <MappingBox
            title="Felter fra fakturaprogram"
            description="Kun felter der mangler eller ikke kunne genkendes, skal rettes. Grøn betyder fundet. Rød betyder mangler."
            fields={INVOICE_FIELDS}
            headers={invoiceFile.headers}
            mapping={invoiceMapping}
            onChange={updateInvoiceMapping}
          />
        )}

        {!hasAnalyzed && !isReviewingMatches && hasBothFiles && (
          <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold text-red-200">
                Klar til analyse
              </h2>
              <p className="mt-2 text-sm text-red-200/80">
                Når knappen er aktiv, har FakturaTjek nok data til at sammenligne
                opgaver og fakturaer.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                disabled={!canAnalyze}
                onClick={handleAnalyze}
                className="rounded-xl bg-red-500 px-6 py-4 font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                Analyser data
              </button>

              <a
                href="mailto:kontakt@fakturatjek.net"
                className="rounded-xl border border-slate-700 px-6 py-4 text-center font-semibold text-white hover:bg-slate-900"
              >
                Book gennemgang
              </a>
            </div>

            {!canAnalyze && (
              <p className="mt-3 text-sm text-yellow-200">
                Kunde og projekt skal være fundet eller valgt i begge filer, før
                analysen kan køre.
              </p>
            )}
          </section>
        )}

        {!hasBothFiles &&
          !isReviewingMatches &&
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

        {isReviewingMatches && matchCandidates.length > 0 && (
          <MatchReviewSection
            refElement={matchReviewRef}
            candidates={matchCandidates}
            decisions={matchDecisions}
            onDecision={updateMatchDecision}
            onContinue={finishMatchReview}
            canContinue={allMatchCandidatesAnswered}
          />
        )}

        {hasAnalyzed && (
          <section ref={analysisRef} className="scroll-mt-8 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
            </div>

            <AnalysisSummary
              orderCount={orderRows.length}
              invoiceCount={invoiceRows.length}
              problemCount={problems.length}
              totalValue={totalValue}
            />
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
          <ProblemResults
            problems={problems}
            totalValue={totalValue}
            orderCount={orderRows.length}
            invoiceCount={invoiceRows.length}
          />
        )}

        {hasAnalyzed && <AnalysisHelpBox />}

        {hasAnalyzed && orderRows.length > 0 && (
          <DataTable
            title="Data fra ordrestyringsprogram"
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

        <SafetyAndPrivacySection />
      </div>
    </main>
  );
}

function SafetyAndPrivacySection() {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-300">
          Sikkerhedstekst
        </p>

        <h2 className="mt-3 text-2xl font-bold text-white">
          Kontrolværktøj — ikke bogføring
        </h2>

        <p className="mt-3 text-sm leading-6 text-red-100/85">
          FakturaTjek laver ikke bogføring og ændrer ikke dine data. Analysen
          viser poster, der bør kontrolleres manuelt, og skal bruges som en
          hjælp til opfølgning — ikke som et endeligt facit.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
          Privacy
        </p>

        <h2 className="mt-3 text-2xl font-bold text-white">
          Dine filer behandles lokalt
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          FakturaTjek analyserer dine CSV- og Excel-filer direkte i din egen
          browser. Filerne uploades ikke til en server, og vi gemmer ikke dine
          data. Analysen bruges kun til at vise resultaterne på siden og til de
          rapporter, du selv vælger at downloade.
        </p>
      </div>
    </section>
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
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-2xl font-bold">{title}</h2>

      <p className="mt-2 text-sm text-slate-400">{description}</p>

      <div className="mt-6">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
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

function MatchReviewSection({
  refElement,
  candidates,
  decisions,
  onDecision,
  onContinue,
  canContinue,
}: {
  refElement: RefObject<HTMLDivElement | null>;
  candidates: MatchCandidate[];
  decisions: MatchDecision;
  onDecision: (candidateId: string, decision: "yes" | "no") => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  const answeredCount = candidates.filter((candidate) =>
    Boolean(decisions[candidate.id])
  ).length;

  return (
    <section
      ref={refElement}
      className="scroll-mt-8 overflow-hidden rounded-3xl border border-yellow-500/30 bg-yellow-500/10"
    >
      <div className="border-b border-yellow-500/20 p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-300">
          Match-kontrol
        </p>

        <h2 className="mt-3 text-3xl font-bold text-yellow-50">
          Kontrollér mulige matches
        </h2>

        <p className="mt-3 max-w-4xl text-sm leading-6 text-yellow-100/75">
          FakturaTjek har fundet opgaver og fakturaer, der ligner hinanden, men
          ikke matcher helt sikkert. Vælg om de hører sammen, før analysen laves.
        </p>

        <p className="mt-4 text-sm text-yellow-100/70">
          Besvaret: {answeredCount} af {candidates.length}
        </p>
      </div>

      <div className="space-y-4 p-4 md:p-6">
        {candidates.map((candidate) => {
          const decision = decisions[candidate.id];

          return (
            <article
              key={candidate.id}
              className="rounded-2xl border border-slate-700 bg-slate-950/60 p-5"
            >
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-3">
                  <p className="text-xs uppercase tracking-widest text-slate-400">
                    Opgave
                  </p>

                  <p className="mt-3 text-xl font-bold text-white">
                    {candidate.order.kunde || "Ukendt kunde"}
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    {candidate.order.projekt || "Ukendt projekt"}
                  </p>

                  <div className="mt-4 space-y-1 text-sm text-slate-400">
                    <p>Opgave ID: {candidate.order.opgave_id || "-"}</p>
                    <p>Dato: {candidate.order.dato || "-"}</p>
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <p className="text-xs uppercase tracking-widest text-slate-400">
                    Mulig faktura
                  </p>

                  <p className="mt-3 text-xl font-bold text-white">
                    {candidate.invoice.kunde || "Ukendt kunde"}
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    {candidate.invoice.projekt || "Ukendt projekt"}
                  </p>

                  <div className="mt-4 space-y-1 text-sm text-slate-400">
                    <p>Faktura ID: {candidate.invoice.faktura_id || "-"}</p>
                    <p>Dato: {candidate.invoice.dato || "-"}</p>
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <p className="text-xs uppercase tracking-widest text-slate-400">
                    Vurdering
                  </p>

                  <div className="mt-3 inline-flex rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-yellow-100">
                    {candidate.confidence === "muligt"
                      ? "Muligt match"
                      : "Usikkert match"}
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-300">
                    Match-score: {Math.round(candidate.score * 100)}%
                  </p>

                  {candidate.reasons.length > 0 && (
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Fordi {candidate.reasons.join(", ")}.
                    </p>
                  )}
                </div>

                <div className="lg:col-span-3">
                  <p className="text-xs uppercase tracking-widest text-slate-400">
                    Hører de sammen?
                  </p>

                  <div className="mt-4 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => onDecision(candidate.id, "yes")}
                      className={
                        decision === "yes"
                          ? "rounded-xl bg-green-500 px-4 py-3 font-semibold text-white"
                          : "rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 font-semibold text-green-100 hover:bg-green-500/20"
                      }
                    >
                      Ja, de hører sammen
                    </button>

                    <button
                      type="button"
                      onClick={() => onDecision(candidate.id, "no")}
                      className={
                        decision === "no"
                          ? "rounded-xl bg-red-500 px-4 py-3 font-semibold text-white"
                          : "rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 font-semibold text-red-100 hover:bg-red-500/20"
                      }
                    >
                      Nej, de hører ikke sammen
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-yellow-100/70">
            Matches med meget høj score er allerede godkendt automatisk. Her skal
            kun de mere usikre matches bekræftes.
          </p>

          <button
            type="button"
            disabled={!canContinue}
            onClick={onContinue}
            className="rounded-xl bg-red-500 px-6 py-4 font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            Lav Fundne problemer
          </button>
        </div>
      </div>
    </section>
  );
}

function AnalysisSummary({
  orderCount,
  invoiceCount,
  problemCount,
  totalValue,
}: {
  orderCount: number;
  invoiceCount: number;
  problemCount: number;
  totalValue: number;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-300">
        Kort opsummering
      </p>

      <h2 className="mt-3 text-2xl font-bold text-white">
        FakturaTjek har gennemgået dine filer
      </h2>

      <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
        FakturaTjek har læst {orderCount} opgaver og {invoiceCount} fakturaer.
        Der er fundet {problemCount} {problemCount === 1 ? "post" : "poster"},
        som bør kontrolleres manuelt. Den samlede potentielle værdi er{" "}
        <span className="font-semibold text-white">{formatCurrency(totalValue)}</span>.
      </p>

      {problemCount > 0 ? (
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Start med posterne med højest værdi. Derefter bør du kontrollere
          forfaldne fakturaer og poster, hvor timer eller materialer ikke matcher.
        </p>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Der blev ikke fundet tydelige uoverensstemmelser i de uploadede filer.
        </p>
      )}
    </section>
  );
}

function AnalysisHelpBox() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold">Vil du høre mere om FakturaTjek?</h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Få en kort gennemgang af, hvordan FakturaTjek kan give bedre
            overblik, spare tid og hjælpe med at opdage værdi, der ellers kan
            blive overset.
          </p>
        </div>

        <a
          href="mailto:kontakt@fakturatjek.net"
          className="rounded-xl bg-red-500 px-6 py-4 text-center font-semibold text-white hover:bg-red-600"
        >
          Book gennemgang
        </a>
      </div>
    </section>
  );
}

function ProblemResults({
  problems,
  totalValue,
  orderCount,
  invoiceCount,
}: {
  problems: Problem[];
  totalValue: number;
  orderCount: number;
  invoiceCount: number;
}) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  return (
    <>
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
                Her er de konkrete poster, FakturaTjek har fundet. Hver boks
                viser hvad problemet er, hvorfor det er fundet, hvad du bør gøre
                nu, og hvilken potentiel værdi posten har.
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

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="rounded-xl bg-red-500 px-6 py-4 font-semibold text-white hover:bg-red-600"
            >
              Download rapport
            </button>
          </div>
        </div>

        <div className="space-y-2 p-4 md:p-6">
          {problems.map((problem, index) => (
            <ProblemCard key={index} problem={problem} index={index} />
          ))}
        </div>
      </section>

      {isReportModalOpen && (
        <ReportDownloadModal
          problems={problems}
          totalValue={totalValue}
          orderCount={orderCount}
          invoiceCount={invoiceCount}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </>
  );
}

function ReportDownloadModal({
  problems,
  totalValue,
  orderCount,
  invoiceCount,
  onClose,
}: {
  problems: Problem[];
  totalValue: number;
  orderCount: number;
  invoiceCount: number;
  onClose: () => void;
}) {
  function handlePdfDownload() {
    downloadPdfReport({
      problems,
      totalValue,
      orderCount,
      invoiceCount,
    });

    onClose();
  }

  function handleExcelDownload() {
    downloadExcelReport(problems);
    onClose();
  }

  function handleCsvDownload() {
    downloadCsvReport(problems);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-300">
              Download rapport
            </p>

            <h2 className="mt-3 text-2xl font-bold text-white">
              Vælg rapportformat
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Vælg om rapporten skal gemmes som PDF, Excel eller CSV.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-900"
            aria-label="Luk"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={handlePdfDownload}
            className="rounded-2xl bg-red-500 px-6 py-4 text-left font-semibold text-white hover:bg-red-600"
          >
            PDF-rapport
            <span className="mt-1 block text-sm font-normal text-red-50/90">
              Flot rapport klar til print eller deling.
            </span>
          </button>

          <button
            type="button"
            onClick={handleExcelDownload}
            className="rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-left font-semibold text-red-100 hover:bg-red-500/20"
          >
            Excel-rapport
            <span className="mt-1 block text-sm font-normal text-red-100/75">
              God til videre arbejde, filtrering og opfølgning.
            </span>
          </button>

          <button
            type="button"
            onClick={handleCsvDownload}
            className="rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-left font-semibold text-red-100 hover:bg-red-500/20"
          >
            CSV-rapport
            <span className="mt-1 block text-sm font-normal text-red-100/75">
              Simpelt format, der kan åbnes i Excel og andre systemer.
            </span>
          </button>
        </div>
      </div>
    </div>
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

          <div className="mt-5 space-y-1 text-sm text-slate-400">
            <p>
              Opgave ID.:{" "}
              <span className="text-slate-200">{problem.opgave_id || "-"}</span>
            </p>

            <p>
              Faktura ID.:{" "}
              <span className="text-slate-200">
                {problem.faktura_id && problem.faktura_id.trim().length > 0
                  ? problem.faktura_id
                  : problem.type === "opgave"
                    ? "Ikke fundet"
                    : "-"}
              </span>
            </p>

            {problem.dato && <p>Dato: {problem.dato}</p>}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
              Hvad er problemet?
            </p>
            <p className="mt-2 text-xl font-bold text-white">{problem.title}</p>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Hvorfor er det fundet?
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              {problem.explanation}
            </p>
          </div>

          <div className="mt-5 max-w-2xl rounded-lg border border-red-500/25 bg-red-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
              Hvad bør du gøre nu?
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
        {fields.map((field) => {
          const selectedValue = mapping[field.key];
          const isGreen = Boolean(selectedValue) && isKnownAlias(selectedValue, field);

          return (
            <label
              key={field.key}
              className={
                isGreen
                  ? "block rounded-2xl border border-green-500/40 bg-green-500/10 p-4"
                  : "block rounded-2xl border border-red-500/60 bg-red-500/10 p-4"
              }
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={
                    isGreen
                      ? "text-sm font-semibold text-green-200"
                      : "text-sm font-semibold text-red-200"
                  }
                >
                  {field.label}
                  {field.required && <span className="text-red-400"> *</span>}
                </span>

                {isGreen ? (
                  <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-200">
                    Fundet
                  </span>
                ) : (
                  <span className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200">
                    Mangler
                  </span>
                )}
              </div>

              <select
                value={selectedValue}
                onChange={(event) => onChange(field.key, event.target.value)}
                className={
                  isGreen
                    ? "mt-3 w-full rounded-xl border border-green-500/50 bg-slate-950 p-3 text-sm text-white outline-none focus:border-green-400"
                    : "mt-3 w-full rounded-xl border border-red-500/70 bg-slate-950 p-3 text-sm text-white outline-none focus:border-red-400"
                }
              >
                <option value="">Ikke valgt</option>

                {headers.map((header) => (
                  <option key={header} value={header}>
                    {formatHeaderLabel(header)}
                  </option>
                ))}
              </select>

              {!isGreen && field.required && (
                <p className="mt-2 text-xs text-red-200/80">
                  Dette felt skal vælges, før analysen kan køre.
                </p>
              )}

              {!isGreen && !field.required && (
                <p className="mt-2 text-xs text-red-200/70">
                  Valgfrit felt. Vælg det, hvis filen indeholder den kolonne.
                </p>
              )}
            </label>
          );
        })}
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