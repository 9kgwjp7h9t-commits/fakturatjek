export const demoData = {
  company: "Odense El & Teknik ApS",
  summary: {
    missedRevenue: 126900,
    completedNotInvoiced: 6,
    unbilledHours: 38,
    unbilledMaterials: 17450,
    overdueInvoices: 84200,
  },
  issues: [
    {
      id: 1,
      type: "Afsluttet opgave ikke faktureret",
      customer: "Andersen Ejendomme",
      project: "El-installation i 3 lejligheder",
      amount: 38500,
      severity: "Høj",
      reason:
        "Opgaven er markeret afsluttet, men der findes ingen matchende faktura.",
    },
    {
      id: 2,
      type: "Timer ikke faktureret",
      customer: "Fyns VVS Center",
      project: "Fejlfinding og tavlearbejde",
      amount: 18600,
      severity: "Høj",
      reason: "31 registrerede timer er ikke overført til faktura.",
    },
    {
      id: 3,
      type: "Materialer mangler på faktura",
      customer: "Nordic Bolig",
      project: "Renovering af køkkeninstallation",
      amount: 17450,
      severity: "Mellem",
      reason:
        "Materialeforbrug er registreret, men ikke medtaget på faktura.",
    },
    {
      id: 4,
      type: "Tilbud mangler opfølgning",
      customer: "Larsen Byg",
      project: "Ny eltavle og gennemgang",
      amount: 28400,
      severity: "Mellem",
      reason: "Tilbud sendt for 19 dage siden uden opfølgning.",
    },
    {
      id: 5,
      type: "Forfalden faktura",
      customer: "Munkebo Maskinservice",
      project: "Serviceaftale Q2",
      amount: 24000,
      severity: "Høj",
      reason: "Faktura er 32 dage over betalingsfrist.",
    },
  ],
};