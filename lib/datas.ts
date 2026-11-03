const FUSO = "America/Sao_Paulo";

const fmtDataHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const fmtDataCurta = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const fmtMesAno = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, month: "long", year: "numeric" });

const fmtCabecalho = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const fmtChaveMes = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit" });

/** "4 de novembro de 2026 às 23:10" */
export function dataHora(iso: string) {
  return fmtDataHora.format(new Date(iso)).replace(", ", " às ");
}

/** "04/11/2026" */
export function dataCurta(iso: string) {
  return fmtDataCurta.format(new Date(iso));
}

/** "Novembro de 2026" */
export function mesAno(iso: string) {
  const s = fmtMesAno.format(new Date(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Chave para agrupar por mês no fuso de Brasília: "2026-11" */
export function chaveMes(iso: string) {
  return fmtChaveMes.format(new Date(iso)).slice(0, 7);
}

/** "quarta-feira, 4 de novembro de 2026" */
export function dataDeHoje() {
  return fmtCabecalho.format(new Date());
}
