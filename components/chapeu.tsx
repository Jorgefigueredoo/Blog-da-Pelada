const PALAVRAS_DE_ALERTA = /(ESC[AÂ]NDALO|URGENTE|VEXAME|POL[EÊ]MICA|BOMBA|PLANT[AÃ]O)/i;

/** Chapéu da matéria. Palavras de alarme ganham fundo vermelho; o resto, amarelo de cartão. */
export function Chapeu({ texto, className = "" }: { texto: string | null | undefined; className?: string }) {
  if (!texto) return null;
  const alerta = PALAVRAS_DE_ALERTA.test(texto);
  return <span className={`chapeu ${alerta ? "chapeu-alerta" : ""} ${className}`}>{texto}</span>;
}
