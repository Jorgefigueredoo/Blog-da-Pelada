/** Medidor estilo placar: "3 de 5 publicadas esta semana". */
export function PlacarCota({ rotulo, usado, limite }: { rotulo: string; usado: number; limite: number }) {
  const cheio = usado >= limite;
  const pct = Math.min(100, Math.round((usado / Math.max(1, limite)) * 100));
  return (
    <div className="border-2 border-tinta bg-superficie p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-manchete text-4xl tabular-nums">
          {usado}
          <span className="text-sutil"> de {limite}</span>
        </span>
        {cheio ? <span className="chapeu chapeu-alerta text-[0.7rem]">Lotado</span> : null}
      </div>
      <p className="font-rotulo text-sm font-bold uppercase tracking-wide text-sutil">{rotulo}</p>
      <div className="mt-2 h-2 bg-tinta/10" aria-hidden>
        <div className={`h-full ${cheio ? "bg-vermelho" : "bg-campo"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
