
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "admins": {
                  Row: {
                    "criado_em": string,"email": string,"id": string,"nome": string
                  }
                  ComputedFields: never
                  Insert: {
                    "criado_em"?: string,"email": string,"id": string,"nome": string
                  }
                  Update: {
                    "criado_em"?: string,"email"?: string,"id"?: string,"nome"?: string
                  }
                  Relationships: [
                    
                  ]
                },"comentarios": {
                  Row: {
                    "apelido": string,"corpo": string,"criado_em": string,"id": string,"post_id": string,"status": string,"visitante_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "apelido": string,"corpo": string,"criado_em"?: string,"id"?: string,"post_id": string,"status"?: string,"visitante_hash": string
                  }
                  Update: {
                    "apelido"?: string,"corpo"?: string,"criado_em"?: string,"id"?: string,"post_id"?: string,"status"?: string,"visitante_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "comentarios_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                },"gols": {
                  Row: {
                    "assistencia_id": string | null,"contra": boolean,"id": string,"jogador_id": string,"minuto": number | null,"partida_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assistencia_id"?: string | null,"contra"?: boolean,"id"?: string,"jogador_id": string,"minuto"?: number | null,"partida_id": string
                  }
                  Update: {
                    "assistencia_id"?: string | null,"contra"?: boolean,"id"?: string,"jogador_id"?: string,"minuto"?: number | null,"partida_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "gols_assistencia_id_fkey"
      columns: ["assistencia_id"]
isOneToOne: false
      referencedRelation: "jogadores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gols_assistencia_id_fkey"
      columns: ["assistencia_id"]
isOneToOne: false
      referencedRelation: "v_artilharia"
      referencedColumns: ["jogador_id"]
    },{
      foreignKeyName: "gols_assistencia_id_fkey"
      columns: ["assistencia_id"]
isOneToOne: false
      referencedRelation: "v_gols_contra"
      referencedColumns: ["jogador_id"]
    },{
      foreignKeyName: "gols_assistencia_id_fkey"
      columns: ["assistencia_id"]
isOneToOne: false
      referencedRelation: "v_presenca"
      referencedColumns: ["jogador_id"]
    },{
      foreignKeyName: "gols_jogador_id_fkey"
      columns: ["jogador_id"]
isOneToOne: false
      referencedRelation: "jogadores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gols_jogador_id_fkey"
      columns: ["jogador_id"]
isOneToOne: false
      referencedRelation: "v_artilharia"
      referencedColumns: ["jogador_id"]
    },{
      foreignKeyName: "gols_jogador_id_fkey"
      columns: ["jogador_id"]
isOneToOne: false
      referencedRelation: "v_gols_contra"
      referencedColumns: ["jogador_id"]
    },{
      foreignKeyName: "gols_jogador_id_fkey"
      columns: ["jogador_id"]
isOneToOne: false
      referencedRelation: "v_presenca"
      referencedColumns: ["jogador_id"]
    },{
      foreignKeyName: "gols_partida_id_fkey"
      columns: ["partida_id"]
isOneToOne: false
      referencedRelation: "partidas"
      referencedColumns: ["id"]
    }
                  ]
                },"jogadores": {
                  Row: {
                    "apelido": string,"ativo": boolean,"bordao": string | null,"criado_em": string,"desde": string | null,"foto_url": string | null,"id": string,"nome_completo": string | null,"posicao": string | null,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "apelido": string,"ativo"?: boolean,"bordao"?: string | null,"criado_em"?: string,"desde"?: string | null,"foto_url"?: string | null,"id"?: string,"nome_completo"?: string | null,"posicao"?: string | null,"slug": string
                  }
                  Update: {
                    "apelido"?: string,"ativo"?: boolean,"bordao"?: string | null,"criado_em"?: string,"desde"?: string | null,"foto_url"?: string | null,"id"?: string,"nome_completo"?: string | null,"posicao"?: string | null,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"manutencao_log": {
                  Row: {
                    "arquivos_apagados": number,"bytes_liberados": number,"detalhes": Json | null,"executado_em": string,"id": string,"tipo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "arquivos_apagados"?: number,"bytes_liberados"?: number,"detalhes"?: Json | null,"executado_em"?: string,"id"?: string,"tipo": string
                  }
                  Update: {
                    "arquivos_apagados"?: number,"bytes_liberados"?: number,"detalhes"?: Json | null,"executado_em"?: string,"id"?: string,"tipo"?: string
                  }
                  Relationships: [
                    
                  ]
                },"partidas": {
                  Row: {
                    "gols_a": number,"gols_b": number,"id": string,"ordem": number,"pelada_id": string,"time_a": string,"time_b": string
                  }
                  ComputedFields: never
                  Insert: {
                    "gols_a"?: number,"gols_b"?: number,"id"?: string,"ordem": number,"pelada_id": string,"time_a": string,"time_b": string
                  }
                  Update: {
                    "gols_a"?: number,"gols_b"?: number,"id"?: string,"ordem"?: number,"pelada_id"?: string,"time_a"?: string,"time_b"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "partidas_pelada_id_fkey"
      columns: ["pelada_id"]
isOneToOne: false
      referencedRelation: "peladas"
      referencedColumns: ["id"]
    }
                  ]
                },"peladas": {
                  Row: {
                    "criado_em": string,"data": string,"id": string,"local": string | null,"observacao": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "criado_em"?: string,"data": string,"id"?: string,"local"?: string | null,"observacao"?: string | null
                  }
                  Update: {
                    "criado_em"?: string,"data"?: string,"id"?: string,"local"?: string | null,"observacao"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"post_fotos": {
                  Row: {
                    "criado_em": string,"id": string,"legenda": string | null,"ordem": number,"post_id": string,"url_full": string | null,"url_thumb": string
                  }
                  ComputedFields: never
                  Insert: {
                    "criado_em"?: string,"id"?: string,"legenda"?: string | null,"ordem"?: number,"post_id": string,"url_full"?: string | null,"url_thumb": string
                  }
                  Update: {
                    "criado_em"?: string,"id"?: string,"legenda"?: string | null,"ordem"?: number,"post_id"?: string,"url_full"?: string | null,"url_thumb"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_fotos_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                },"post_jogadores": {
                  Row: {
                    "jogador_id": string,"post_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "jogador_id": string,"post_id": string
                  }
                  Update: {
                    "jogador_id"?: string,"post_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_jogadores_jogador_id_fkey"
      columns: ["jogador_id"]
isOneToOne: false
      referencedRelation: "jogadores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_jogadores_jogador_id_fkey"
      columns: ["jogador_id"]
isOneToOne: false
      referencedRelation: "v_artilharia"
      referencedColumns: ["jogador_id"]
    },{
      foreignKeyName: "post_jogadores_jogador_id_fkey"
      columns: ["jogador_id"]
isOneToOne: false
      referencedRelation: "v_gols_contra"
      referencedColumns: ["jogador_id"]
    },{
      foreignKeyName: "post_jogadores_jogador_id_fkey"
      columns: ["jogador_id"]
isOneToOne: false
      referencedRelation: "v_presenca"
      referencedColumns: ["jogador_id"]
    },{
      foreignKeyName: "post_jogadores_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                },"posts": {
                  Row: {
                    "atualizado_em": string,"autor_id": string | null,"capa_url_full": string | null,"capa_url_thumb": string | null,"chamada": string | null,"chapeu": string | null,"corpo": string,"criado_em": string,"id": string,"pelada_id": string | null,"publicado": boolean,"publicado_em": string | null,"slug": string,"titulo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "atualizado_em"?: string,"autor_id"?: string | null,"capa_url_full"?: string | null,"capa_url_thumb"?: string | null,"chamada"?: string | null,"chapeu"?: string | null,"corpo": string,"criado_em"?: string,"id"?: string,"pelada_id"?: string | null,"publicado"?: boolean,"publicado_em"?: string | null,"slug": string,"titulo": string
                  }
                  Update: {
                    "atualizado_em"?: string,"autor_id"?: string | null,"capa_url_full"?: string | null,"capa_url_thumb"?: string | null,"chamada"?: string | null,"chapeu"?: string | null,"corpo"?: string,"criado_em"?: string,"id"?: string,"pelada_id"?: string | null,"publicado"?: boolean,"publicado_em"?: string | null,"slug"?: string,"titulo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "posts_autor_id_fkey"
      columns: ["autor_id"]
isOneToOne: false
      referencedRelation: "admins"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_pelada_id_fkey"
      columns: ["pelada_id"]
isOneToOne: false
      referencedRelation: "peladas"
      referencedColumns: ["id"]
    }
                  ]
                },"presencas": {
                  Row: {
                    "jogador_id": string,"pelada_id": string,"presente": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "jogador_id": string,"pelada_id": string,"presente"?: boolean
                  }
                  Update: {
                    "jogador_id"?: string,"pelada_id"?: string,"presente"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "presencas_jogador_id_fkey"
      columns: ["jogador_id"]
isOneToOne: false
      referencedRelation: "jogadores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "presencas_jogador_id_fkey"
      columns: ["jogador_id"]
isOneToOne: false
      referencedRelation: "v_artilharia"
      referencedColumns: ["jogador_id"]
    },{
      foreignKeyName: "presencas_jogador_id_fkey"
      columns: ["jogador_id"]
isOneToOne: false
      referencedRelation: "v_gols_contra"
      referencedColumns: ["jogador_id"]
    },{
      foreignKeyName: "presencas_jogador_id_fkey"
      columns: ["jogador_id"]
isOneToOne: false
      referencedRelation: "v_presenca"
      referencedColumns: ["jogador_id"]
    },{
      foreignKeyName: "presencas_pelada_id_fkey"
      columns: ["pelada_id"]
isOneToOne: false
      referencedRelation: "peladas"
      referencedColumns: ["id"]
    }
                  ]
                },"reacoes": {
                  Row: {
                    "criado_em": string,"emoji": string,"id": string,"post_id": string,"visitante_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "criado_em"?: string,"emoji": string,"id"?: string,"post_id": string,"visitante_hash": string
                  }
                  Update: {
                    "criado_em"?: string,"emoji"?: string,"id"?: string,"post_id"?: string,"visitante_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reacoes_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "v_artilharia": {
                  Row: {
                    "apelido": string,"ativo": boolean,"foto_url": string | null,"gols_temporada": number | null,"gols_total": number | null,"jogador_id": string,"slug": string
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_cota_semanal": {
                  Row: {
                    "fim": string | null,"fotos": number | null,"inicio": string | null,"limite": number | null,"limite_fotos": number | null,"publicadas": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_gols_contra": {
                  Row: {
                    "apelido": string,"foto_url": string | null,"gols_contra": number | null,"jogador_id": string,"slug": string,"ultimo_vexame": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_presenca": {
                  Row: {
                    "apelido": string,"ativo": boolean,"foto_url": string | null,"jogador_id": string,"peladas_possiveis": number | null,"percentual": number | null,"presencas": number | null,"slug": string
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_reacoes_contagem": {
                  Row: {
                    "emoji": string,"post_id": string,"total": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "reacoes_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "fotos_semana":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"inicio_semana":
{ Args: { "ref"?: string }; Returns: string
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"limite_fotos_semana":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"limite_posts_semana":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"uso_storage":
{ Args: Record<PropertyKey, never>; Returns: {
              "total_arquivos": number,"total_bytes": number,"total_fotos": number
            }[]
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
