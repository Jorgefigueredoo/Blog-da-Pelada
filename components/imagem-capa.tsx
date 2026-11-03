import Image from "next/image";

type Props = {
  src: string | null | undefined;
  alt: string;
  /** `sizes` correto evita baixar 1600px num slot de 150px */
  sizes: string;
  /** só a capa principal da página leva prioridade; o resto é lazy */
  prioridade?: boolean;
  proporcao?: string;
  rotuloSemFoto?: string | null;
  className?: string;
};

/**
 * Imagem servida via next/image (CDN da Vercel, não a banda do Supabase).
 * Sem foto, vira um gramado com o chapéu no meio, para o layout nunca ficar vazio.
 */
export function ImagemCapa({ src, alt, sizes, prioridade = false, proporcao = "aspect-[16/10]", rotuloSemFoto, className = "" }: Props) {
  return (
    <div className={`relative overflow-hidden ${proporcao} ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          quality={70}
          priority={prioridade}
          loading={prioridade ? undefined : "lazy"}
          className="object-cover"
        />
      ) : (
        <div className="gramado flex h-full w-full items-center justify-center p-3" role="img" aria-label={alt}>
          {rotuloSemFoto ? (
            <span className="manchete max-w-[80%] rotate-[-4deg] bg-papel px-2 text-center text-[clamp(1rem,4vw,2.25rem)] text-tinta shadow-[4px_4px_0_var(--tinta)]">
              {rotuloSemFoto}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
