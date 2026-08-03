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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          meta: Json | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json | null
        }
        Relationships: []
      }
      amenities: {
        Row: {
          category: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string | null
          follow_up_at: string | null
          id: string
          last_contacted_at: string | null
          message: string | null
          name: string
          notes: string | null
          phone: string | null
          property_id: string | null
          property_title: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          follow_up_at?: string | null
          id?: string
          last_contacted_at?: string | null
          message?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          property_id?: string | null
          property_title?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          follow_up_at?: string | null
          id?: string
          last_contacted_at?: string | null
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          property_id?: string | null
          property_title?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          city: string
          created_at: string
          id: string
          pin_code: string | null
          sector: string | null
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          pin_code?: string | null
          sector?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          pin_code?: string | null
          sector?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          age: Database["public"]["Enums"]["property_age"] | null
          agent_email: string | null
          agent_name: string | null
          agent_office: string | null
          agent_phone: string | null
          agent_whatsapp: string | null
          amenities: string[]
          area_unit: Database["public"]["Enums"]["area_unit"]
          balconies: number | null
          bathrooms: number | null
          bedrooms: number | null
          booking_amount: number | null
          builtup_area: number | null
          carpet_area: number | null
          city: string
          cover_image: string | null
          created_at: string
          created_by: string | null
          description: string | null
          facing: Database["public"]["Enums"]["facing_type"] | null
          floor_no: number | null
          furnishing: Database["public"]["Enums"]["furnishing_type"] | null
          id: string
          is_archived: boolean
          is_exclusive: boolean
          is_featured: boolean
          is_hot: boolean
          is_premium: boolean
          is_published: boolean
          is_starred: boolean
          is_verified: boolean
          keywords: string | null
          landmark: string | null
          latitude: number | null
          longitude: number | null
          maintenance_charges: number | null
          maps_url: string | null
          meta_description: string | null
          meta_title: string | null
          negotiable: boolean
          parking: number | null
          pin_code: string | null
          price: number
          property_code: string
          property_type: Database["public"]["Enums"]["property_type"]
          purpose: Database["public"]["Enums"]["property_purpose"]
          sector: string | null
          security_deposit: number | null
          share_show_address: boolean
          share_show_amenities: boolean
          share_show_contact: boolean
          share_show_description: boolean
          share_show_location: boolean
          share_show_price: boolean
          share_show_specs: boolean
          slug: string
          status: Database["public"]["Enums"]["property_status"]
          super_area: number | null
          title: string
          total_floors: number | null
          updated_at: string
          views: number
          virtual_tour_url: string | null
          youtube_url: string | null
        }
        Insert: {
          address?: string | null
          age?: Database["public"]["Enums"]["property_age"] | null
          agent_email?: string | null
          agent_name?: string | null
          agent_office?: string | null
          agent_phone?: string | null
          agent_whatsapp?: string | null
          amenities?: string[]
          area_unit?: Database["public"]["Enums"]["area_unit"]
          balconies?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          booking_amount?: number | null
          builtup_area?: number | null
          carpet_area?: number | null
          city?: string
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          facing?: Database["public"]["Enums"]["facing_type"] | null
          floor_no?: number | null
          furnishing?: Database["public"]["Enums"]["furnishing_type"] | null
          id?: string
          is_archived?: boolean
          is_exclusive?: boolean
          is_featured?: boolean
          is_hot?: boolean
          is_premium?: boolean
          is_published?: boolean
          is_starred?: boolean
          is_verified?: boolean
          keywords?: string | null
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          maintenance_charges?: number | null
          maps_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          negotiable?: boolean
          parking?: number | null
          pin_code?: string | null
          price?: number
          property_code?: string
          property_type?: Database["public"]["Enums"]["property_type"]
          purpose?: Database["public"]["Enums"]["property_purpose"]
          sector?: string | null
          security_deposit?: number | null
          share_show_address?: boolean
          share_show_amenities?: boolean
          share_show_contact?: boolean
          share_show_description?: boolean
          share_show_location?: boolean
          share_show_price?: boolean
          share_show_specs?: boolean
          slug: string
          status?: Database["public"]["Enums"]["property_status"]
          super_area?: number | null
          title: string
          total_floors?: number | null
          updated_at?: string
          views?: number
          virtual_tour_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          address?: string | null
          age?: Database["public"]["Enums"]["property_age"] | null
          agent_email?: string | null
          agent_name?: string | null
          agent_office?: string | null
          agent_phone?: string | null
          agent_whatsapp?: string | null
          amenities?: string[]
          area_unit?: Database["public"]["Enums"]["area_unit"]
          balconies?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          booking_amount?: number | null
          builtup_area?: number | null
          carpet_area?: number | null
          city?: string
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          facing?: Database["public"]["Enums"]["facing_type"] | null
          floor_no?: number | null
          furnishing?: Database["public"]["Enums"]["furnishing_type"] | null
          id?: string
          is_archived?: boolean
          is_exclusive?: boolean
          is_featured?: boolean
          is_hot?: boolean
          is_premium?: boolean
          is_published?: boolean
          is_starred?: boolean
          is_verified?: boolean
          keywords?: string | null
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          maintenance_charges?: number | null
          maps_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          negotiable?: boolean
          parking?: number | null
          pin_code?: string | null
          price?: number
          property_code?: string
          property_type?: Database["public"]["Enums"]["property_type"]
          purpose?: Database["public"]["Enums"]["property_purpose"]
          sector?: string | null
          security_deposit?: number | null
          share_show_address?: boolean
          share_show_amenities?: boolean
          share_show_contact?: boolean
          share_show_description?: boolean
          share_show_location?: boolean
          share_show_price?: boolean
          share_show_specs?: boolean
          slug?: string
          status?: Database["public"]["Enums"]["property_status"]
          super_area?: number | null
          title?: string
          total_floors?: number | null
          updated_at?: string
          views?: number
          virtual_tour_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      property_documents: {
        Row: {
          created_at: string
          doc_type: string | null
          id: string
          name: string
          property_id: string
          url: string
        }
        Insert: {
          created_at?: string
          doc_type?: string | null
          id?: string
          name: string
          property_id: string
          url: string
        }
        Update: {
          created_at?: string
          doc_type?: string | null
          id?: string
          name?: string
          property_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          is_featured: boolean
          property_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          property_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          property_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_videos: {
        Row: {
          created_at: string
          id: string
          property_id: string
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_videos_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_views: {
        Row: {
          created_at: string
          id: string
          property_id: string
          referrer: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          referrer?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          referrer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_views_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          address: string | null
          agency_name: string
          email: string | null
          facebook: string | null
          id: string
          instagram: string | null
          linkedin: string | null
          logo_url: string | null
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
          website: string | null
          whatsapp: string | null
          youtube: string | null
        }
        Insert: {
          address?: string | null
          agency_name?: string
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          logo_url?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          youtube?: string | null
        }
        Update: {
          address?: string | null
          agency_name?: string
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          logo_url?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "agent"
      area_unit: "sqft" | "sqyard" | "acre"
      facing_type:
        | "north"
        | "south"
        | "east"
        | "west"
        | "north_east"
        | "north_west"
        | "south_east"
        | "south_west"
      furnishing_type: "fully_furnished" | "semi_furnished" | "unfurnished"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "visit_scheduled"
        | "negotiation"
        | "won"
        | "lost"
      property_age:
        | "new_launch"
        | "ready_to_move"
        | "under_construction"
        | "0_1"
        | "1_5"
        | "5_10"
        | "10_plus"
      property_purpose: "sale" | "rent" | "lease"
      property_status:
        | "available"
        | "sold"
        | "rented"
        | "draft"
        | "under_offer"
        | "archived"
      property_type:
        | "apartment"
        | "builder_floor"
        | "villa"
        | "independent_house"
        | "penthouse"
        | "plot"
        | "commercial"
        | "retail_shop"
        | "office_space"
        | "warehouse"
        | "farm_house"
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
      app_role: ["admin", "manager", "agent"],
      area_unit: ["sqft", "sqyard", "acre"],
      facing_type: [
        "north",
        "south",
        "east",
        "west",
        "north_east",
        "north_west",
        "south_east",
        "south_west",
      ],
      furnishing_type: ["fully_furnished", "semi_furnished", "unfurnished"],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "visit_scheduled",
        "negotiation",
        "won",
        "lost",
      ],
      property_age: [
        "new_launch",
        "ready_to_move",
        "under_construction",
        "0_1",
        "1_5",
        "5_10",
        "10_plus",
      ],
      property_purpose: ["sale", "rent", "lease"],
      property_status: [
        "available",
        "sold",
        "rented",
        "draft",
        "under_offer",
        "archived",
      ],
      property_type: [
        "apartment",
        "builder_floor",
        "villa",
        "independent_house",
        "penthouse",
        "plot",
        "commercial",
        "retail_shop",
        "office_space",
        "warehouse",
        "farm_house",
      ],
    },
  },
} as const
