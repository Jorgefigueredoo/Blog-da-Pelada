import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <div className="py-14 text-center">
      <p className="font-manchete text-[7rem] leading-none text-campo sm:text-[10rem]">404</p>
      <h1 className="manchete mt-2 text-4xl sm:text-5xl">Essa bola saiu pela linha de fundo</h1>
      <p className="mt-3 text-sutil">A página que você procurou não existe — ou foi chutada pra fora do terreno.</p>
      <Link href="/" className="botao botao-primario mt-8">
        Tiro de meta: voltar pra capa
      </Link>
    </div>
  );
}
