import { PadelBall } from "@/components/padel/PadelBall";

export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 text-text-primary">
      <section className="max-w-sm rounded-md border border-border bg-surface p-5 text-center">
        <div className="mb-4 flex justify-center">
          <PadelBall />
        </div>
        <h1 className="text-2xl font-bold">Retapadel esta offline</h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">El torneo guardado en este dispositivo seguira disponible cuando vuelvas a abrir la app.</p>
      </section>
    </main>
  );
}
