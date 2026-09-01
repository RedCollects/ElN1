export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      bids: {
        Row: {
          terms_version: string | null;
          entry: boolean;
          amount: number;
          business_id: string | null;
          business_name: string;
          category: string | null;
          created_at: string;
          expires_at: string | null;
          failure_reason: string | null;
          id: string;
          payment_id: string | null;
          position: number;
          preference_id: string | null;
          refund_id: string | null;
          settled_at: string | null;
          status: string;
        };
        Insert: {
          terms_version?: string | null;
          entry?: boolean;
          amount: number;
          business_id?: string | null;
          business_name: string;
          category?: string | null;
          created_at?: string;
          expires_at?: string | null;
          failure_reason?: string | null;
          id?: string;
          payment_id?: string | null;
          position: number;
          preference_id?: string | null;
          refund_id?: string | null;
          settled_at?: string | null;
          status?: string;
        };
        Update: {
          terms_version?: string | null;
          entry?: boolean;
          amount?: number;
          business_id?: string | null;
          business_name?: string;
          category?: string | null;
          created_at?: string;
          expires_at?: string | null;
          failure_reason?: string | null;
          id?: string;
          payment_id?: string | null;
          position?: number;
          preference_id?: string | null;
          refund_id?: string | null;
          settled_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bids_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      business_clicks: {
        Row: {
          business_id: string;
          created_at: string;
          id: number;
          session_id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          id?: never;
          session_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: never;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_clicks_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      businesses: {
        Row: {
          terms_accepted_at: string | null;
          terms_version: string | null;
          active: boolean;
          category: string | null;
          city: string | null;
          cover_url: string | null;
          created_at: string;
          current_price: number;
          description: string | null;
          email_public: string | null;
          facebook: string | null;
          hours: string | null;
          id: string;
          instagram: string | null;
          logo_url: string | null;
          maps_url: string | null;
          name: string;
          owner_id: string | null;
          phone: string | null;
          position: number | null;
          price_set_at: string | null;
          slug: string | null;
          status: string;
          tagline: string | null;
          tiktok: string | null;
          updated_at: string;
          website: string | null;
          whatsapp: string | null;
        };
        Insert: {
          terms_accepted_at?: string | null;
          terms_version?: string | null;
          active?: boolean;
          category?: string | null;
          city?: string | null;
          cover_url?: string | null;
          created_at?: string;
          current_price?: number;
          description?: string | null;
          email_public?: string | null;
          facebook?: string | null;
          hours?: string | null;
          id?: string;
          instagram?: string | null;
          logo_url?: string | null;
          maps_url?: string | null;
          name: string;
          owner_id?: string | null;
          phone?: string | null;
          position?: number | null;
          price_set_at?: string | null;
          slug?: string | null;
          status?: string;
          tagline?: string | null;
          tiktok?: string | null;
          updated_at?: string;
          website?: string | null;
          whatsapp?: string | null;
        };
        Update: {
          terms_accepted_at?: string | null;
          terms_version?: string | null;
          active?: boolean;
          category?: string | null;
          city?: string | null;
          cover_url?: string | null;
          created_at?: string;
          current_price?: number;
          description?: string | null;
          email_public?: string | null;
          facebook?: string | null;
          hours?: string | null;
          id?: string;
          instagram?: string | null;
          logo_url?: string | null;
          maps_url?: string | null;
          name?: string;
          owner_id?: string | null;
          phone?: string | null;
          position?: number | null;
          price_set_at?: string | null;
          slug?: string | null;
          status?: string;
          tagline?: string | null;
          tiktok?: string | null;
          updated_at?: string;
          website?: string | null;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      online_sessions: {
        Row: {
          last_seen_at: string;
          session_id: string;
        };
        Insert: {
          last_seen_at?: string;
          session_id: string;
        };
        Update: {
          last_seen_at?: string;
          session_id?: string;
        };
        Relationships: [];
      };
      site_visits: {
        Row: {
          created_at: string;
          session_id: string;
          visit_date: string;
        };
        Insert: {
          created_at?: string;
          session_id: string;
          visit_date: string;
        };
        Update: {
          created_at?: string;
          session_id?: string;
          visit_date?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      business_click_totals: {
        Row: {
          business_id: string | null;
          visits: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "business_clicks_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      business_daily_click_totals: {
        Row: {
          business_id: string | null;
          visits: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "business_clicks_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      active_reservations: {
        Args: never;
        Returns: {
          amount: number;
          expires_at: string;
          ranking_position: number;
        }[];
      };
      compact_ranking: { Args: never; Returns: undefined };
      ranking_state: {
        Args: { p_business_id?: string | null };
        Returns: {
          lowest_price: number;
          ranked_count: number;
          own_price: number;
          own_position: number;
        }[];
      };
      reorder_ranking: { Args: never; Returns: undefined };
      expire_bids: { Args: never; Returns: number };
      position_state: {
        Args: { p_position: number; p_business_id?: string | null };
        Returns: {
          current_price: number;
          floor_price: number;
          holder_id: string;
          next_free_position: number;
          reserved_amount: number;
          reserved_until: string;
        }[];
      };
      settle_bid: {
        Args: { p_bid_id: string; p_payment_id: string };
        Returns: Json;
      };
      slugify: { Args: { p_text: string }; Returns: string };
      unaccent: { Args: { "": string }; Returns: string };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
