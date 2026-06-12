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
            Find opgaver, timer og materialer der mangler opfølgning.
          </h1>

          <p className="mt-6 text-xl leading-8 text-slate-300">
            FakturaTjek sammenligner registrerede opgaver, timer og materialer
            med dine fakturaer. På få sekunder får du en konkret liste over
            poster, der mangler fakturering, opfølgning eller manuel kontrol.
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
              Prøv selv upload og analyse
            </Link>

            <a
              href="mailto:kontakt@fakturatjek.net"
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
              Finder opgaver der er markeret færdige, men ikke matcher en
              faktura.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-bold">Timer og materialer</h2>
            <p className="mt-3 text-slate-400">
              Sammenligner registrerede timer og materialer med fakturaerne.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-bold">Forfaldne fakturaer</h2>
            <p className="mt-3 text-slate-400">
              Viser fakturaer der kræver opfølgning, så de ikke bliver glemt.
            </p>
          </div>
        </div>

        <div className="mt-16 rounded-3xl border border-slate-800 bg-slate-900 p-6 md:p-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-red-400">
              Sådan gør du
            </p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Fra eksportfiler til konkret handleliste
            </h2>

            <p className="mt-4 text-slate-400">
              Start med to simple filer fra de systemer, du allerede bruger.
              FakturaTjek understøtter både CSV og Excel.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm font-semibold text-red-400">1</p>
              <h3 className="mt-2 font-bold">Eksportér ordrestyring</h3>
              <p className="mt-2 text-sm text-slate-400">
                Hent en fil med opgaver, timer, materialer og status fra
                ordrestyringssystemet.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm font-semibold text-red-400">2</p>
              <h3 className="mt-2 font-bold">Eksportér fakturaer</h3>
              <p className="mt-2 text-sm text-slate-400">
                Hent en fil med fakturaer, kunder, projekter, materialer, timer,
                beløb og betalingsstatus.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm font-semibold text-red-400">3</p>
              <h3 className="mt-2 font-bold">Upload begge filer</h3>
              <p className="mt-2 text-sm text-slate-400">
                FakturaTjek sammenligner filerne på kunde og projekt og finder
                afvigelser.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm font-semibold text-red-400">4</p>
              <h3 className="mt-2 font-bold">Få en handleliste</h3>
              <p className="mt-2 text-sm text-slate-400">
                Se præcis hvilke poster der mangler fakturering, opfølgning
                eller manuel kontrol.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/upload"
              className="inline-flex rounded-xl bg-red-500 px-6 py-4 font-semibold text-white hover:bg-red-600"
            >
              Prøv selv upload og analyse
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}