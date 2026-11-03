/** "Tonhão marca CONTRA!" → "tonhao-marca-contra" (máx. 80 caracteres, sem cortar palavra) */
export function gerarSlug(texto: string): string {
  const base = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (base.length <= 80) return base || "materia";
  const cortado = base.slice(0, 80);
  const ultimoHifen = cortado.lastIndexOf("-");
  return (ultimoHifen > 40 ? cortado.slice(0, ultimoHifen) : cortado).replace(/-+$/g, "");
}

/** Escolhe o primeiro slug livre: base, base-2, base-3… */
export function slugLivre(base: string, ocupados: Set<string>): string {
  if (!ocupados.has(base)) return base;
  for (let i = 2; ; i++) {
    const candidato = `${base}-${i}`;
    if (!ocupados.has(candidato)) return candidato;
  }
}
