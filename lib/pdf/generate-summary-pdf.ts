import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb } from "pdf-lib";
import type { Match, Tournament } from "@/core/tournament/types";
import { calculateStandings, getTournamentTotals, isCompletedMatch } from "@/core/tournament/statistics";

const pageSize: [number, number] = [595, 842];
const margin = 34;
const contentWidth = pageSize[0] - margin * 2;

const colors = {
  background: rgb(0.07, 0.08, 0.08),
  surface: rgb(0.11, 0.13, 0.12),
  surfaceMuted: rgb(0.14, 0.16, 0.15),
  border: rgb(0.22, 0.25, 0.24),
  text: rgb(0.95, 0.96, 0.95),
  textSecondary: rgb(0.66, 0.7, 0.68),
  primary: rgb(0.75, 0.35, 0.33),
  ball: rgb(0.73, 0.75, 0.38),
  gold: rgb(0.78, 0.7, 0.42),
  silver: rgb(0.66, 0.69, 0.7),
  bronze: rgb(0.72, 0.54, 0.38),
};

interface PdfFonts {
  regular: PDFFont;
  bold: PDFFont;
}

export async function generateTournamentPdf(tournament: Tournament) {
  const pdf = await PDFDocument.create();
  const fonts: PdfFonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };

  const standings = calculateStandings(tournament.players, tournament.rounds, tournament.config.pointsForWin);
  const totals = getTournamentTotals(tournament.rounds);
  const playerById = new Map(tournament.players.map((player) => [player.id, player.name]));
  const state = {
    page: pdf.addPage(pageSize),
    y: pageSize[1] - margin,
  };

  const newPage = () => {
    state.page = pdf.addPage(pageSize);
    drawPageBackground(state.page);
    state.y = pageSize[1] - margin;
  };

  const ensureSpace = (height: number) => {
    if (state.y - height < margin) newPage();
  };

  drawPageBackground(state.page);
  drawHero(state.page, fonts, tournament.config.name ?? "Torneo Retapadel");
  state.y = 672;

  drawPodium(state.page, fonts, standings.slice(0, 3));
  state.y -= 258;

  drawTotals(state.page, fonts, [
    `${totals.completedRounds} rondas completadas`,
    `${totals.completedMatches} partidos jugados`,
    `${totals.scoreTotal} puntos registrados`,
  ]);
  state.y -= 104;

  ensureSpace(120 + standings.length * 28);
  drawStandings(state.page, fonts, standings, tournament.config.pointsForWin, state.y);
  state.y -= 112 + standings.length * 28;

  ensureSpace(84);
  drawSectionTitle(state.page, fonts, "Resultados por ronda", state.y);
  state.y -= 34;

  for (const round of tournament.rounds.slice().reverse()) {
    const roundHeight = 54 + round.matches.length * 46 + (round.restingPlayerIds.length > 0 ? 24 : 0);
    ensureSpace(roundHeight);
    drawRoundCard(state.page, fonts, round.number, round.matches, round.restingPlayerIds, playerById, state.y);
    state.y -= roundHeight + 12;
  }

  return pdf.save();
}

function drawPageBackground(page: PDFPage) {
  page.drawRectangle({ x: 0, y: 0, width: pageSize[0], height: pageSize[1], color: colors.background });
  page.drawRectangle({ x: 0, y: pageSize[1] - 96, width: pageSize[0], height: 96, color: colors.surface });
  page.drawRectangle({ x: margin, y: 24, width: contentWidth, height: 1, color: colors.border, opacity: 0.8 });
}

function drawHero(page: PDFPage, fonts: PdfFonts, title: string) {
  const x = margin;
  const y = pageSize[1] - margin - 24;

  page.drawCircle({ x: x + 18, y: y + 9, size: 10, color: colors.ball });
  page.drawCircle({ x: x + 18, y: y + 9, size: 16, color: colors.ball, opacity: 0.18 });
  drawText(page, fonts.bold, "RESUMEN FINAL", x + 44, y + 9, 8, colors.textSecondary);
  drawText(page, fonts.bold, clipText(title, fonts.bold, 28, contentWidth - 34), x, y - 34, 28, colors.text);
  drawText(page, fonts.regular, "Retapadel", x, y - 54, 10, colors.primary);
}

function drawPodium(page: PDFPage, fonts: PdfFonts, podium: ReturnType<typeof calculateStandings>) {
  const cardHeight = 68;
  const gap = 10;
  let y = 646;

  for (const row of podium) {
    drawCard(page, margin, y - cardHeight, contentWidth, cardHeight);
    drawText(page, fonts.bold, `LUGAR ${row.position}`, margin + 16, y - 20, 8, colors.textSecondary);
    drawText(page, fonts.bold, clipText(row.player.name, fonts.bold, 15, contentWidth - 160), margin + 16, y - 40, 15, colors.text);
    drawText(page, fonts.regular, `${row.points} pts  |  DIF ${row.difference}`, margin + 16, y - 58, 11, colors.textSecondary);
    drawPositionPill(page, fonts, row.position, margin + contentWidth - 44, y - 44);
    y -= cardHeight + gap;
  }
}

function drawTotals(page: PDFPage, fonts: PdfFonts, totals: string[]) {
  const y = 392;
  drawCard(page, margin, y - 68, contentWidth, 68);
  const columnWidth = contentWidth / totals.length;

  totals.forEach((text, index) => {
    const x = margin + columnWidth * index + 14;
    if (index > 0) {
      page.drawRectangle({ x: margin + columnWidth * index, y: y - 58, width: 1, height: 48, color: colors.border });
    }
    const [value, ...rest] = text.split(" ");
    drawText(page, fonts.bold, value, x, y - 28, 18, colors.text);
    drawText(page, fonts.regular, rest.join(" "), x, y - 48, 9, colors.textSecondary);
  });
}

function drawStandings(page: PDFPage, fonts: PdfFonts, standings: ReturnType<typeof calculateStandings>, pointsForWin: number, topY: number) {
  const headerHeight = 38;
  const rowHeight = 28;
  const tableHeight = headerHeight + 34 + standings.length * rowHeight;
  const x = margin;
  const y = topY - tableHeight;

  drawCard(page, x, y, contentWidth, tableHeight);
  drawText(page, fonts.bold, "Clasificacion final", x + 14, topY - 24, 12, colors.text);
  drawText(page, fonts.bold, `Victoria ${pointsForWin} pts`, x + contentWidth - 82, topY - 24, 9, colors.primary);
  page.drawRectangle({ x, y: topY - 72, width: contentWidth, height: 34, color: colors.surfaceMuted });

  const columns = [
    { label: "POS.", x: x + 38, align: "center" as const },
    { label: "JUGADOR", x: x + 86, align: "left" as const },
    { label: "PJ", x: x + contentWidth - 164, align: "right" as const },
    { label: "PG", x: x + contentWidth - 112, align: "right" as const },
    { label: "DIF", x: x + contentWidth - 62, align: "right" as const },
    { label: "PTS", x: x + contentWidth - 14, align: "right" as const },
  ];

  for (const column of columns) {
    drawAlignedText(page, fonts.bold, column.label, column.x, topY - 58, 8, colors.textSecondary, column.align);
  }

  standings.forEach((row, index) => {
    const rowTop = topY - 72 - index * rowHeight;
    page.drawRectangle({ x, y: rowTop - rowHeight, width: contentWidth, height: 1, color: colors.border, opacity: 0.85 });
    drawPositionPill(page, fonts, row.position, x + 30, rowTop - 20, 16);
    drawText(page, fonts.bold, clipText(row.player.name, fonts.bold, 10, contentWidth - 240), x + 86, rowTop - 19, 10, colors.text);
    drawAlignedText(page, fonts.regular, String(row.played), x + contentWidth - 164, rowTop - 19, 10, colors.text, "right");
    drawAlignedText(page, fonts.regular, String(row.won), x + contentWidth - 112, rowTop - 19, 10, colors.text, "right");
    drawAlignedText(page, fonts.regular, String(row.difference), x + contentWidth - 62, rowTop - 19, 10, colors.text, "right");
    drawAlignedText(page, fonts.bold, String(row.points), x + contentWidth - 14, rowTop - 19, 10, colors.text, "right");
  });
}

function drawSectionTitle(page: PDFPage, fonts: PdfFonts, title: string, y: number) {
  drawText(page, fonts.bold, title, margin, y, 14, colors.text);
  page.drawRectangle({ x: margin, y: y - 10, width: contentWidth, height: 1, color: colors.border });
}

function drawRoundCard(page: PDFPage, fonts: PdfFonts, roundNumber: number, matches: Match[], restingPlayerIds: string[], playerById: Map<string, string>, topY: number) {
  const cardHeight = 54 + matches.length * 46 + (restingPlayerIds.length > 0 ? 24 : 0);
  const x = margin;
  const y = topY - cardHeight;

  drawCard(page, x, y, contentWidth, cardHeight);
  drawText(page, fonts.bold, `Ronda ${roundNumber}`, x + 14, topY - 22, 12, colors.text);
  drawText(page, fonts.regular, `${matches.length} cancha${matches.length === 1 ? "" : "s"}`, x + contentWidth - 76, topY - 22, 9, colors.textSecondary);

  let currentY = topY - 50;
  for (const match of matches) {
    const teamA = getTeamName(match.teamA, playerById);
    const teamB = getTeamName(match.teamB, playerById);
    const score = isCompletedMatch(match) ? `${match.scoreA} - ${match.scoreB}` : "pend.";

    page.drawRectangle({ x: x + 10, y: currentY - 31, width: contentWidth - 20, height: 36, color: colors.surfaceMuted });
    drawText(page, fonts.bold, `CANCHA ${match.courtNumber}`, x + 20, currentY - 9, 8, colors.textSecondary);
    drawText(page, fonts.bold, clipText(teamA, fonts.bold, 9, 170), x + 20, currentY - 25, 9, match.winner === "A" ? colors.text : colors.textSecondary);
    drawAlignedText(page, fonts.bold, score, x + contentWidth / 2, currentY - 24, 12, colors.text, "center");
    drawAlignedText(page, fonts.bold, clipText(teamB, fonts.bold, 9, 170), x + contentWidth - 20, currentY - 25, 9, match.winner === "B" ? colors.text : colors.textSecondary, "right");
    currentY -= 46;
  }

  if (restingPlayerIds.length > 0) {
    const restingNames = restingPlayerIds.map((id) => playerById.get(id)).filter(Boolean).join(", ");
    drawText(page, fonts.regular, `Descansaron: ${clipText(restingNames, fonts.regular, 9, contentWidth - 30)}`, x + 14, currentY - 2, 9, colors.textSecondary);
  }
}

function drawCard(page: PDFPage, x: number, y: number, width: number, height: number) {
  page.drawRectangle({ x, y, width, height, color: colors.surface, borderColor: colors.border, borderWidth: 1 });
}

function drawPositionPill(page: PDFPage, fonts: PdfFonts, position: number, x: number, y: number, size = 20) {
  const color = position === 1 ? colors.gold : position === 2 ? colors.silver : position === 3 ? colors.bronze : colors.surfaceMuted;
  page.drawRectangle({ x, y, width: size, height: size, color, opacity: position <= 3 ? 0.58 : 1 });
  drawAlignedText(page, fonts.bold, String(position), x + size / 2, y + 6, 8, colors.text, "center");
}

function drawText(page: PDFPage, font: PDFFont, text: string, x: number, y: number, size: number, color = colors.text) {
  page.drawText(normalizeText(text), { x, y, size, font, color });
}

function drawAlignedText(page: PDFPage, font: PDFFont, text: string, x: number, y: number, size: number, color: ReturnType<typeof rgb>, align: "left" | "center" | "right") {
  const value = normalizeText(text);
  const width = font.widthOfTextAtSize(value, size);
  const drawX = align === "center" ? x - width / 2 : align === "right" ? x - width : x;
  page.drawText(value, { x: drawX, y, size, font, color });
}

function getTeamName(ids: [string, string], playerById: Map<string, string>) {
  return `${playerById.get(ids[0]) ?? "Jugador"} / ${playerById.get(ids[1]) ?? "Jugador"}`;
}

function clipText(value: string, font: PDFFont, size: number, maxWidth: number) {
  let text = normalizeText(value);
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;

  while (text.length > 1 && font.widthOfTextAtSize(`${text}.`, size) > maxWidth) {
    text = text.slice(0, -1);
  }

  return `${text}.`;
}

function normalizeText(value: string) {
  return value.replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?");
}
