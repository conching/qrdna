export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          tier: "free" | "pro" | "team";
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          tier?: "free" | "pro" | "team";
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          tier?: "free" | "pro" | "team";
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          color: string | null;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          color?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          color?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      qr_codes: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          name: string;
          type: "static" | "dynamic";
          content_type: string;
          destination_url: string | null;
          static_data: Json | null;
          short_code: string | null;
          is_active: boolean;
          expires_at: string | null;
          password_hash: string | null;
          total_scans: number;
          unique_scans: number;
          last_scan_at: string | null;
          style: Json | null;
          tags: string[];
          is_favorited: boolean;
          scheduled_redirects: Json | null;
          expiry_page_config: Json | null;
          routing_rules: Json | null;
          version_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          name: string;
          type?: "static" | "dynamic";
          content_type: string;
          destination_url?: string | null;
          static_data?: Json | null;
          short_code?: string | null;
          is_active?: boolean;
          expires_at?: string | null;
          password_hash?: string | null;
          total_scans?: number;
          unique_scans?: number;
          last_scan_at?: string | null;
          style?: Json | null;
          tags?: string[];
          is_favorited?: boolean;
          scheduled_redirects?: Json | null;
          expiry_page_config?: Json | null;
          routing_rules?: Json | null;
          version_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          name?: string;
          type?: "static" | "dynamic";
          content_type?: string;
          destination_url?: string | null;
          static_data?: Json | null;
          short_code?: string | null;
          is_active?: boolean;
          expires_at?: string | null;
          password_hash?: string | null;
          total_scans?: number;
          unique_scans?: number;
          last_scan_at?: string | null;
          style?: Json | null;
          tags?: string[];
          is_favorited?: boolean;
          scheduled_redirects?: Json | null;
          expiry_page_config?: Json | null;
          routing_rules?: Json | null;
          version_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "qr_codes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "qr_codes_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      qr_code_versions: {
        Row: {
          id: string;
          qr_code_id: string;
          version_number: number;
          destination_url: string | null;
          static_data: Json | null;
          style: Json | null;
          changed_by: string | null;
          change_summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          qr_code_id: string;
          version_number: number;
          destination_url?: string | null;
          static_data?: Json | null;
          style?: Json | null;
          changed_by?: string | null;
          change_summary?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          qr_code_id?: string;
          version_number?: number;
          destination_url?: string | null;
          static_data?: Json | null;
          style?: Json | null;
          changed_by?: string | null;
          change_summary?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "qr_code_versions_qr_code_id_fkey";
            columns: ["qr_code_id"];
            isOneToOne: false;
            referencedRelation: "qr_codes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "qr_code_versions_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      business_cards: {
        Row: {
          id: string;
          user_id: string;
          qr_code_id: string | null;
          slug: string;
          first_name: string;
          last_name: string;
          pronouns: string | null;
          title: string | null;
          company: string | null;
          department: string | null;
          bio: string | null;
          phones: Json | null;
          emails: Json | null;
          websites: Json | null;
          address: Json | null;
          social_links: Json | null;
          headshot_url: string | null;
          company_logo_url: string | null;
          theme: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          qr_code_id?: string | null;
          slug: string;
          first_name: string;
          last_name: string;
          pronouns?: string | null;
          title?: string | null;
          company?: string | null;
          department?: string | null;
          bio?: string | null;
          phones?: Json | null;
          emails?: Json | null;
          websites?: Json | null;
          address?: Json | null;
          social_links?: Json | null;
          headshot_url?: string | null;
          company_logo_url?: string | null;
          theme?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          qr_code_id?: string | null;
          slug?: string;
          first_name?: string;
          last_name?: string;
          pronouns?: string | null;
          title?: string | null;
          company?: string | null;
          department?: string | null;
          bio?: string | null;
          phones?: Json | null;
          emails?: Json | null;
          websites?: Json | null;
          address?: Json | null;
          social_links?: Json | null;
          headshot_url?: string | null;
          company_logo_url?: string | null;
          theme?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_cards_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_cards_qr_code_id_fkey";
            columns: ["qr_code_id"];
            isOneToOne: false;
            referencedRelation: "qr_codes";
            referencedColumns: ["id"];
          },
        ];
      };
      scan_events: {
        Row: {
          id: number;
          qr_code_id: string;
          scanned_at: string;
          ip_address: string | null;
          country: string | null;
          city: string | null;
          region: string | null;
          user_agent: string | null;
          device_type: string | null;
          os: string | null;
          browser: string | null;
          referrer: string | null;
          is_unique: boolean;
        };
        Insert: {
          id?: never; // auto-generated identity
          qr_code_id: string;
          scanned_at?: string;
          ip_address?: string | null;
          country?: string | null;
          city?: string | null;
          region?: string | null;
          user_agent?: string | null;
          device_type?: string | null;
          os?: string | null;
          browser?: string | null;
          referrer?: string | null;
          is_unique?: boolean;
        };
        Update: {
          id?: never;
          qr_code_id?: string;
          scanned_at?: string;
          ip_address?: string | null;
          country?: string | null;
          city?: string | null;
          region?: string | null;
          user_agent?: string | null;
          device_type?: string | null;
          os?: string | null;
          browser?: string | null;
          referrer?: string | null;
          is_unique?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "scan_events_qr_code_id_fkey";
            columns: ["qr_code_id"];
            isOneToOne: false;
            referencedRelation: "qr_codes";
            referencedColumns: ["id"];
          },
        ];
      };
      card_view_events: {
        Row: {
          id: number;
          card_id: string;
          event_type: string;
          event_data: Json | null;
          viewed_at: string;
          ip_address: string | null;
          country: string | null;
          city: string | null;
          user_agent: string | null;
          device_type: string | null;
          is_unique: boolean;
        };
        Insert: {
          id?: never;
          card_id: string;
          event_type?: string;
          event_data?: Json | null;
          viewed_at?: string;
          ip_address?: string | null;
          country?: string | null;
          city?: string | null;
          user_agent?: string | null;
          device_type?: string | null;
          is_unique?: boolean;
        };
        Update: {
          id?: never;
          card_id?: string;
          event_type?: string;
          event_data?: Json | null;
          viewed_at?: string;
          ip_address?: string | null;
          country?: string | null;
          city?: string | null;
          user_agent?: string | null;
          device_type?: string | null;
          is_unique?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "card_view_events_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "business_cards";
            referencedColumns: ["id"];
          },
        ];
      };
      style_templates: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          category: string;
          style: Json;
          is_system: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          category: string;
          style: Json;
          is_system?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          category?: string;
          style?: Json;
          is_system?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "style_templates_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      tier: "free" | "pro" | "team";
      qr_type: "static" | "dynamic";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ---------------------------------------------------------------------------
// Convenience type aliases
// ---------------------------------------------------------------------------

type PublicSchema = Database["public"];

export type Tables<
  T extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][T]["Row"];

export type InsertTables<
  T extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][T]["Insert"];

export type UpdateTables<
  T extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][T]["Update"];

// Row-level aliases for direct import convenience
export type ProfileRow = Tables<"profiles">;
export type ProjectRow = Tables<"projects">;
export type QRCodeRow = Tables<"qr_codes">;
export type QRCodeVersionRow = Tables<"qr_code_versions">;
export type BusinessCardRow = Tables<"business_cards">;
export type ScanEventRow = Tables<"scan_events">;
export type StyleTemplateRow = Tables<"style_templates">;
export type CardViewEventRow = Tables<"card_view_events">;
