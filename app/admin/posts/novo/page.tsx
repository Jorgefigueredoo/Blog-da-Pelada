import type { Metadata } from "next";
import { clienteServidor } from "@/lib/supabase/servidor";
import { EditorPost } from "../editor-post";

export const metadata: Metadata = { title: "Nova matéria" };

export default async function NovoPost() {
  const supabase = await clienteServidor();
  const { data: cota, error } = await supabase.from("v_cota_semanal").select("publicadas, limite, fotos, limite_fotos").single();
  if (error) console.error("[novo post] cota:", error.message);

  return (
    <EditorPost
      inicial={{ chapeu: "", titulo: "", chamada: "", corpo: "", capa: null, fotos: [], publicado: false, publicado_em: null }}
      cotaInicial={
        cota
          ? { publicadas: cota.publicadas ?? 0, limite: cota.limite ?? 5, fotos: cota.fotos ?? 0, limite_fotos: cota.limite_fotos ?? 24 }
          : null
      }
    />
  );
}
