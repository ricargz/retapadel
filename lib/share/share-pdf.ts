import type { Tournament } from "@/core/tournament/types";
import { generateTournamentPdf } from "@/lib/pdf/generate-summary-pdf";

export async function downloadTournamentPdf(tournament: Tournament) {
  const { blob, filename } = await createTournamentPdfBlob(tournament);
  downloadBlob(blob, filename);
}

export async function shareTournamentPdf(tournament: Tournament) {
  const { blob, filename } = await createTournamentPdfBlob(tournament);
  const file = new File([blob], filename, { type: "application/pdf" });

  if (typeof navigator !== "undefined" && "share" in navigator && canShareFile(file)) {
    await navigator.share({
      title: tournament.config.name ?? "Retapadel",
      text: "Resumen final del torneo Retapadel",
      files: [file],
    });
    return;
  }

  downloadBlob(blob, filename);
}

async function createTournamentPdfBlob(tournament: Tournament) {
  const bytes = await generateTournamentPdf(tournament);
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  const filename = `${sanitizeFilename(tournament.config.name ?? "retapadel")}.pdf`;

  return { blob, filename };
}

function canShareFile(file: File) {
  return "canShare" in navigator && navigator.canShare({ files: [file] });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLocaleLowerCase("es-MX");
}
