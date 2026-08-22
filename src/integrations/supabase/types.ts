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
      customer_activity: {
        Row: {
          actor_id: string | null
          created_at: string
          customer_id: string
          detail: string | null
          id: string
          kind: string
          meta: Json | null
          title: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          customer_id: string
          detail?: string | null
          id?: string
          kind: string
          meta?: Json | null
          title: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          customer_id?: string
          detail?: string | null
          id?: string
          kind?: string
          meta?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_activity_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_activity_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_documents: {
        Row: {
          created_at: string
          customer_id: string
          doc_type: string | null
          id: string
          name: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          doc_type?: string | null
          id?: string
          name: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          doc_type?: string | null
          id?: string
          name?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          customer_id: string
          id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          customer_id: string
          id?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          customer_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          assigned_to: string | null
          bhk_preference: number | null
          budget_max: number | null
          budget_min: number | null
          company: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          intent: Database["public"]["Enums"]["customer_intent"]
          is_vip: boolean
          last_contacted_at: string | null
          lead_id: string | null
          next_follow_up_at: string | null
          notes: string | null
          occupation: string | null
          phone: string | null
          photo_url: string | null
          preferred_city: string | null
          preferred_location: string | null
          priority: Database["public"]["Enums"]["customer_priority"]
          property_type: Database["public"]["Enums"]["property_type"] | null
          source: string | null
          status: Database["public"]["Enums"]["customer_status"]
          tags: string[]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          assigned_to?: string | null
          bhk_preference?: number | null
          budget_max?: number | null
          budget_min?: number | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          intent?: Database["public"]["Enums"]["customer_intent"]
          is_vip?: boolean
          last_contacted_at?: string | null
          lead_id?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          photo_url?: string | null
          preferred_city?: string | null
          preferred_location?: string | null
          priority?: Database["public"]["Enums"]["customer_priority"]
          property_type?: Database["public"]["Enums"]["property_type"] | null
          source?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          tags?: string[]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          assigned_to?: string | null
          bhk_preference?: number | null
          budget_max?: number | null
          budget_min?: number | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          intent?: Database["public"]["Enums"]["customer_intent"]
          is_vip?: boolean
          last_contacted_at?: string | null
          lead_id?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          photo_url?: string | null
          preferred_city?: string | null
          preferred_location?: string | null
          priority?: Database["public"]["Enums"]["customer_priority"]
          property_type?: Database["public"]["Enums"]["property_type"] | null
          source?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          tags?: string[]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
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
          area: string | null
          city: string
          created_at: string
          demand: Database["public"]["Enums"]["demand_level"]
          description: string | null
          id: string
          image_url: string | null
          pin_code: string | null
          sector: string | null
          sub_sector: string | null
          top_builder: string | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          city: string
          created_at?: string
          demand?: Database["public"]["Enums"]["demand_level"]
          description?: string | null
          id?: string
          image_url?: string | null
          pin_code?: string | null
          sector?: string | null
          sub_sector?: string | null
          top_builder?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          city?: string
          created_at?: string
          demand?: Database["public"]["Enums"]["demand_level"]
          description?: string | null
          id?: string
          image_url?: string | null
          pin_code?: string | null
          sector?: string | null
          sub_sector?: string | null
          top_builder?: string | null
          updated_at?: string
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
          assigned_to: string | null
          balconies: number | null
          bathrooms: number | null
          bedrooms: number | null
          booking_amount: number | null
          builder: string | null
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
          share_show_documents: boolean
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
          assigned_to?: string | null
          balconies?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          booking_amount?: number | null
          builder?: string | null
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
          share_show_documents?: boolean
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
          assigned_to?: string | null
          balconies?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          booking_amount?: number | null
          builder?: string | null
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
          share_show_documents?: boolean
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
        Relationships: [
          {
            foreignKeyName: "properties_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          media_kind: string
          property_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          media_kind?: string
          property_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          media_kind?: string
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
      property_share_items: {
        Row: {
          created_at: string
          id: string
          is_favourite: boolean
          property_id: string
          share_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_favourite?: boolean
          property_id: string
          share_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_favourite?: boolean
          property_id?: string
          share_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "property_share_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_share_items_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "property_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      property_shares: {
        Row: {
          channel: Database["public"]["Enums"]["share_channel"]
          created_at: string
          customer_id: string | null
          id: string
          last_viewed_at: string | null
          message: string | null
          opened_at: string | null
          shared_by: string | null
          title: string | null
          token: string
          view_count: number
        }
        Insert: {
          channel?: Database["public"]["Enums"]["share_channel"]
          created_at?: string
          customer_id?: string | null
          id?: string
          last_viewed_at?: string | null
          message?: string | null
          opened_at?: string | null
          shared_by?: string | null
          title?: string | null
          token?: string
          view_count?: number
        }
        Update: {
          channel?: Database["public"]["Enums"]["share_channel"]
          created_at?: string
          customer_id?: string | null
          id?: string
          last_viewed_at?: string | null
          message?: string | null
          opened_at?: string | null
          shared_by?: string | null
          title?: string | null
          token?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "property_shares_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      share_events: {
        Row: {
          created_at: string
          event: Database["public"]["Enums"]["share_event_type"]
          id: string
          meta: Json | null
          property_id: string | null
          share_id: string
        }
        Insert: {
          created_at?: string
          event: Database["public"]["Enums"]["share_event_type"]
          id?: string
          meta?: Json | null
          property_id?: string | null
          share_id: string
        }
        Update: {
          created_at?: string
          event?: Database["public"]["Enums"]["share_event_type"]
          id?: string
          meta?: Json | null
          property_id?: string | null
          share_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_events_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "property_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visits: {
        Row: {
          agent_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          feedback: string | null
          id: string
          lead_id: string | null
          meeting_point: string | null
          notes: string | null
          property_id: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["visit_status"]
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          feedback?: string | null
          id?: string
          lead_id?: string | null
          meeting_point?: string | null
          notes?: string | null
          property_id?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          feedback?: string | null
          id?: string
          lead_id?: string | null
          meeting_point?: string | null
          notes?: string | null
          property_id?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_visits_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_visits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_visits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_visits_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          details: string | null
          due_at: string | null
          id: string
          lead_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          property_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          property_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          property_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
      get_published_property: { Args: { p_slug: string }; Returns: Json }
      get_share_bundle: { Args: { p_token: string }; Returns: Json }
      list_published_property_cards: {
        Args: {
          p_city?: string
          p_exclude_slug?: string
          p_limit?: number
          p_property_type?: string
        }
        Returns: Json
      }
      list_published_property_slugs: {
        Args: never
        Returns: {
          slug: string
        }[]
      }
      list_shared_properties: { Args: { p_ids: string[] }; Returns: Json }
      record_share_event: {
        Args: {
          p_event: Database["public"]["Enums"]["share_event_type"]
          p_meta?: Json
          p_property_id?: string
          p_token: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "agent"
      area_unit: "sqft" | "sqyard" | "acre"
      customer_intent: "buy" | "rent" | "lease" | "invest"
      customer_priority: "low" | "medium" | "high" | "vip"
      customer_status:
        | "new"
        | "active"
        | "following_up"
        | "negotiating"
        | "converted"
        | "inactive"
        | "lost"
      demand_level: "low" | "moderate" | "high" | "very_high"
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
      share_channel: "whatsapp" | "email" | "sms" | "link" | "qr"
      share_event_type:
        | "sent"
        | "delivered"
        | "opened"
        | "viewed"
        | "favourite"
        | "brochure_downloaded"
        | "enquiry"
        | "visit_booked"
        | "reshared"
      task_priority: "low" | "medium" | "high"
      task_status: "open" | "in_progress" | "done"
      visit_status:
        | "scheduled"
        | "completed"
        | "cancelled"
        | "rescheduled"
        | "no_show"
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
      customer_intent: ["buy", "rent", "lease", "invest"],
      customer_priority: ["low", "medium", "high", "vip"],
      customer_status: [
        "new",
        "active",
        "following_up",
        "negotiating",
        "converted",
        "inactive",
        "lost",
      ],
      demand_level: ["low", "moderate", "high", "very_high"],
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
      share_channel: ["whatsapp", "email", "sms", "link", "qr"],
      share_event_type: [
        "sent",
        "delivered",
        "opened",
        "viewed",
        "favourite",
        "brochure_downloaded",
        "enquiry",
        "visit_booked",
        "reshared",
      ],
      task_priority: ["low", "medium", "high"],
      task_status: ["open", "in_progress", "done"],
      visit_status: [
        "scheduled",
        "completed",
        "cancelled",
        "rescheduled",
        "no_show",
      ],
    },
  },
} as const
