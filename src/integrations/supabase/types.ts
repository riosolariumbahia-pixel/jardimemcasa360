export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_insights: {
        Row: {
          created_at: string
          description: string
          id: string
          priority: Database["public"]["Enums"]["insight_priority"]
          read: boolean | null
          type: Database["public"]["Enums"]["insight_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["insight_priority"]
          read?: boolean | null
          type: Database["public"]["Enums"]["insight_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["insight_priority"]
          read?: boolean | null
          type?: Database["public"]["Enums"]["insight_type"]
          user_id?: string
        }
        Relationships: []
      }
      ai_interactions: {
        Row: {
          ai_response: string
          context: Json | null
          created_at: string
          id: string
          user_id: string
          user_message: string
        }
        Insert: {
          ai_response: string
          context?: Json | null
          created_at?: string
          id?: string
          user_id: string
          user_message: string
        }
        Update: {
          ai_response?: string
          context?: Json | null
          created_at?: string
          id?: string
          user_id?: string
          user_message?: string
        }
        Relationships: []
      }
      analises_imagem: {
        Row: {
          ai_result: Json
          confidence: number
          created_at: string
          id: string
          image_url: string
          plant_id: string | null
          user_id: string
        }
        Insert: {
          ai_result?: Json
          confidence?: number
          created_at?: string
          id?: string
          image_url: string
          plant_id?: string | null
          user_id: string
        }
        Update: {
          ai_result?: Json
          confidence?: number
          created_at?: string
          id?: string
          image_url?: string
          plant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analises_imagem_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "garden_plants"
            referencedColumns: ["id"]
          },
        ]
      }
      anunciantes: {
        Row: {
          ativo: boolean
          cidade: string
          criado_em: string
          descricao: string
          id: string
          nome: string
          plano: Database["public"]["Enums"]["plano_anunciante"]
          tipo: Database["public"]["Enums"]["tipo_anunciante"]
          whatsapp: string
        }
        Insert: {
          ativo?: boolean
          cidade: string
          criado_em?: string
          descricao: string
          id?: string
          nome: string
          plano?: Database["public"]["Enums"]["plano_anunciante"]
          tipo: Database["public"]["Enums"]["tipo_anunciante"]
          whatsapp: string
        }
        Update: {
          ativo?: boolean
          cidade?: string
          criado_em?: string
          descricao?: string
          id?: string
          nome?: string
          plano?: Database["public"]["Enums"]["plano_anunciante"]
          tipo?: Database["public"]["Enums"]["tipo_anunciante"]
          whatsapp?: string
        }
        Relationships: []
      }
      anuncios: {
        Row: {
          anunciante_id: string
          ativo: boolean
          criado_em: string
          descricao: string
          id: string
          imagem_url: string | null
          link_whatsapp: string
          titulo: string
        }
        Insert: {
          anunciante_id: string
          ativo?: boolean
          criado_em?: string
          descricao: string
          id?: string
          imagem_url?: string | null
          link_whatsapp: string
          titulo: string
        }
        Update: {
          anunciante_id?: string
          ativo?: boolean
          criado_em?: string
          descricao?: string
          id?: string
          imagem_url?: string | null
          link_whatsapp?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "anuncios_anunciante_id_fkey"
            columns: ["anunciante_id"]
            isOneToOne: false
            referencedRelation: "anunciantes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliques_anuncios: {
        Row: {
          anuncio_id: string
          criado_em: string
          id: string
          usuario_id: string
        }
        Insert: {
          anuncio_id: string
          criado_em?: string
          id?: string
          usuario_id: string
        }
        Update: {
          anuncio_id?: string
          criado_em?: string
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliques_anuncios_anuncio_id_fkey"
            columns: ["anuncio_id"]
            isOneToOne: false
            referencedRelation: "anuncios"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostico_uso: {
        Row: {
          count: number
          created_at: string | null
          data: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string | null
          data?: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string | null
          data?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      garden_plants: {
        Row: {
          category: string | null
          created_at: string
          difficulty: string | null
          emoji: string | null
          fertilizer_amount: string | null
          fertilizer_frequency: string | null
          garden_id: string | null
          health: number | null
          id: string
          last_fertilized: string | null
          last_pruned: string | null
          last_watered: string | null
          light: string | null
          name: string
          needs_fertilizer: boolean | null
          needs_pruning: boolean | null
          needs_water: boolean | null
          updated_at: string
          user_id: string
          water_frequency: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          difficulty?: string | null
          emoji?: string | null
          fertilizer_amount?: string | null
          fertilizer_frequency?: string | null
          garden_id?: string | null
          health?: number | null
          id?: string
          last_fertilized?: string | null
          last_pruned?: string | null
          last_watered?: string | null
          light?: string | null
          name: string
          needs_fertilizer?: boolean | null
          needs_pruning?: boolean | null
          needs_water?: boolean | null
          updated_at?: string
          user_id: string
          water_frequency?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          difficulty?: string | null
          emoji?: string | null
          fertilizer_amount?: string | null
          fertilizer_frequency?: string | null
          garden_id?: string | null
          health?: number | null
          id?: string
          last_fertilized?: string | null
          last_pruned?: string | null
          last_watered?: string | null
          light?: string | null
          name?: string
          needs_fertilizer?: boolean | null
          needs_pruning?: boolean | null
          needs_water?: boolean | null
          updated_at?: string
          user_id?: string
          water_frequency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "garden_plants_garden_id_fkey"
            columns: ["garden_id"]
            isOneToOne: false
            referencedRelation: "gardens"
            referencedColumns: ["id"]
          },
        ]
      }
      gardens: {
        Row: {
          containers: Json | null
          created_at: string
          garden_type: string | null
          id: string
          light: string | null
          location: string | null
          name: string
          updated_at: string
          user_id: string
          wall_height: number | null
          wall_width: number | null
        }
        Insert: {
          containers?: Json | null
          created_at?: string
          garden_type?: string | null
          id?: string
          light?: string | null
          location?: string | null
          name: string
          updated_at?: string
          user_id: string
          wall_height?: number | null
          wall_width?: number | null
        }
        Update: {
          containers?: Json | null
          created_at?: string
          garden_type?: string | null
          id?: string
          light?: string | null
          location?: string | null
          name?: string
          updated_at?: string
          user_id?: string
          wall_height?: number | null
          wall_width?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          trial_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          trial_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          trial_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          plant_id: string | null
          scheduled_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          plant_id?: string | null
          scheduled_date: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          plant_id?: string | null
          scheduled_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "garden_plants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weather_cache: {
        Row: {
          city: string
          created_at: string
          humidity: number | null
          id: string
          rain_forecast: boolean | null
          ref_date: string
          temperature: number | null
        }
        Insert: {
          city: string
          created_at?: string
          humidity?: number | null
          id?: string
          rain_forecast?: boolean | null
          ref_date?: string
          temperature?: number | null
        }
        Update: {
          city?: string
          created_at?: string
          humidity?: number | null
          id?: string
          rain_forecast?: boolean | null
          ref_date?: string
          temperature?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_full_access: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      insight_priority: "baixa" | "media" | "alta"
      insight_type: "alerta" | "recomendacao" | "previsao"
      plano_anunciante: "free" | "premium"
      tipo_anunciante: "fornecedor" | "prestador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      insight_priority: ["baixa", "media", "alta"],
      insight_type: ["alerta", "recomendacao", "previsao"],
      plano_anunciante: ["free", "premium"],
      tipo_anunciante: ["fornecedor", "prestador"],
    },
  },
} as const
