import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-red-400">
            FakturaTjek
          </p>

          <h1 className="text-5xl font-bold leading-tight md:text-7xl">
            Find penge der mangler at blive faktureret.
          </h1>

          <p className="mt-6 text-xl leading-8 text-slate-300">
         <p className="mt-6 text-xl leading-8 text-slate-300">
           FakturaTjek sammenligner registrerede opgaver, timer og materialer
            med dine fakturaer. På få sekunder får du en konkret
           liste over poster, der mangler opfølgning, fakturering eller manuel kontrol.
</p>
</p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
  <Link
    href="/demo"
    className="rounded-xl bg-red-500 px-6 py-4 text-center font-semibold text-white hover:bg-red-600"
  >
    Se demo
  </Link>

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
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-bold">Afsluttede opgaver</h2>
            <p className="mt-3 text-slate-400">
              Finder opgaver der er markeret færdige, men ikke matcher en faktura.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-bold">Timer og materialer</h2>
            <p className="mt-3 text-slate-400">
              Viser registrerede timer og materialer, der kan være glemt på fakturaen.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-bold">Ugentlig handleliste</h2>
            <p className="mt-3 text-slate-400">
              Sender en konkret liste over ting, som bør tjekkes og følges op på.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}