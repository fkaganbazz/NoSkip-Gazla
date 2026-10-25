export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      badges: {
        Row: {
          description_en: string | null
          description_tr: string
          icon: string
          is_active: boolean
          key: string
          sort_order: number
          tint: string
          title_en: string | null
          title_tr: string
        }
        ComputedFields: never
        Insert: {
          description_en?: string | null
          description_tr: string
          icon: string
          is_active?: boolean
          key: string
          sort_order: number
          tint: string
          title_en?: string | null
          title_tr: string
        }
        Update: {
          description_en?: string | null
          description_tr?: string
          icon?: string
          is_active?: boolean
          key?: string
          sort_order?: number
          tint?: string
          title_en?: string | null
          title_tr?: string
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          profile_visible: boolean
        }
        ComputedFields: never
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          profile_visible?: boolean
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          profile_visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_invites: {
        Row: {
          challenge_id: string
          code: string
          created_at: string
          inviter_id: string
          revoked_at: string | null
        }
        ComputedFields: never
        Insert: {
          challenge_id: string
          code: string
          created_at?: string
          inviter_id: string
          revoked_at?: string | null
        }
        Update: {
          challenge_id?: string
          code?: string
          created_at?: string
          inviter_id?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_invites_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_members: {
        Row: {
          challenge_id: string
          created_at: string
          final_days_done: number | null
          final_rank: number | null
          final_required_days: number | null
          final_rescues: number | null
          finish_seen_at: string | null
          finished_at: string | null
          invited_by: string | null
          joined_at: string | null
          joined_on: string | null
          left_on: string | null
          reminder_time: string | null
          role: Database["public"]["Enums"]["member_role"]
          status: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        ComputedFields: never
        Insert: {
          challenge_id: string
          created_at?: string
          final_days_done?: number | null
          final_rank?: number | null
          final_required_days?: number | null
          final_rescues?: number | null
          finish_seen_at?: string | null
          finished_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          joined_on?: string | null
          left_on?: string | null
          reminder_time?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          final_days_done?: number | null
          final_rank?: number | null
          final_required_days?: number | null
          final_rescues?: number | null
          finish_seen_at?: string | null
          finished_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          joined_on?: string | null
          left_on?: string | null
          reminder_time?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["member_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_members_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_templates: {
        Row: {
          allowed_durations: number[]
          category: Database["public"]["Enums"]["challenge_category"]
          created_at: string
          default_duration_days: number
          description_en: string | null
          description_tr: string | null
          difficulty: Database["public"]["Enums"]["challenge_difficulty"]
          featured_week: string | null
          icon: string
          id: string
          is_active: boolean
          number_base_target: number | null
          number_daily_increment: number
          number_max: number | null
          number_step: number | null
          number_unit: string | null
          number_unit_en: string | null
          onboarding_order: number | null
          short_title_en: string | null
          short_title_tr: string | null
          slug: string
          task_type: Database["public"]["Enums"]["task_type"]
          tint: string
          title_en: string | null
          title_tr: string
        }
        ComputedFields: never
        Insert: {
          allowed_durations?: number[]
          category: Database["public"]["Enums"]["challenge_category"]
          created_at?: string
          default_duration_days: number
          description_en?: string | null
          description_tr?: string | null
          difficulty: Database["public"]["Enums"]["challenge_difficulty"]
          featured_week?: string | null
          icon: string
          id?: string
          is_active?: boolean
          number_base_target?: number | null
          number_daily_increment?: number
          number_max?: number | null
          number_step?: number | null
          number_unit?: string | null
          number_unit_en?: string | null
          onboarding_order?: number | null
          short_title_en?: string | null
          short_title_tr?: string | null
          slug: string
          task_type: Database["public"]["Enums"]["task_type"]
          tint: string
          title_en?: string | null
          title_tr: string
        }
        Update: {
          allowed_durations?: number[]
          category?: Database["public"]["Enums"]["challenge_category"]
          created_at?: string
          default_duration_days?: number
          description_en?: string | null
          description_tr?: string | null
          difficulty?: Database["public"]["Enums"]["challenge_difficulty"]
          featured_week?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          number_base_target?: number | null
          number_daily_increment?: number
          number_max?: number | null
          number_step?: number | null
          number_unit?: string | null
          number_unit_en?: string | null
          onboarding_order?: number | null
          short_title_en?: string | null
          short_title_tr?: string | null
          slug?: string
          task_type?: Database["public"]["Enums"]["task_type"]
          tint?: string
          title_en?: string | null
          title_tr?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          category: Database["public"]["Enums"]["challenge_category"] | null
          created_at: string
          created_by: string | null
          duration_days: number
          end_date: string | null
          icon: string
          id: string
          invite_message: string | null
          number_base_target: number | null
          number_daily_increment: number
          number_max: number | null
          number_step: number | null
          number_unit: string | null
          reminder_time: string | null
          short_title: string | null
          start_date: string
          task_type: Database["public"]["Enums"]["task_type"]
          template_id: string | null
          tint: string
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["challenge_visibility"]
        }
        ComputedFields: never
        Insert: {
          category?: Database["public"]["Enums"]["challenge_category"] | null
          created_at?: string
          created_by?: string | null
          duration_days: number
          end_date?: never
          icon?: string
          id?: string
          invite_message?: string | null
          number_base_target?: number | null
          number_daily_increment?: number
          number_max?: number | null
          number_step?: number | null
          number_unit?: string | null
          reminder_time?: string | null
          short_title?: string | null
          start_date: string
          task_type: Database["public"]["Enums"]["task_type"]
          template_id?: string | null
          tint?: string
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["challenge_visibility"]
        }
        Update: {
          category?: Database["public"]["Enums"]["challenge_category"] | null
          created_at?: string
          created_by?: string | null
          duration_days?: number
          end_date?: never
          icon?: string
          id?: string
          invite_message?: string | null
          number_base_target?: number | null
          number_daily_increment?: number
          number_max?: number | null
          number_step?: number | null
          number_unit?: string | null
          reminder_time?: string | null
          short_title?: string | null
          start_date?: string
          task_type?: Database["public"]["Enums"]["task_type"]
          template_id?: string | null
          tint?: string
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["challenge_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "challenge_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          challenge_id: string
          created_at: string
          id: string
          local_date: string
          note: string | null
          photo_path: string | null
          updated_at: string
          user_id: string
          value: number | null
        }
        ComputedFields: never
        Insert: {
          challenge_id: string
          created_at?: string
          id?: string
          local_date: string
          note?: string | null
          photo_path?: string | null
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          challenge_id?: string
          created_at?: string
          id?: string
          local_date?: string
          note?: string | null
          photo_path?: string | null
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          accepted_at: string | null
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["friendship_status"]
        }
        ComputedFields: never
        Insert: {
          accepted_at?: string | null
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["friendship_status"]
        }
        Update: {
          accepted_at?: string | null
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["friendship_status"]
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          challenge_id: string | null
          created_at: string
          friendship_id: string | null
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          local_date: string
          payload: NonNullable<Json>
          poke_id: string | null
          pushed_at: string | null
          read_at: string | null
          recipient_id: string
        }
        ComputedFields: never
        Insert: {
          actor_id?: string | null
          challenge_id?: string | null
          created_at?: string
          friendship_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          local_date: string
          payload?: NonNullable<Json>
          poke_id?: string | null
          pushed_at?: string | null
          read_at?: string | null
          recipient_id: string
        }
        Update: {
          actor_id?: string | null
          challenge_id?: string | null
          created_at?: string
          friendship_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          local_date?: string
          payload?: NonNullable<Json>
          poke_id?: string | null
          pushed_at?: string | null
          read_at?: string | null
          recipient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_challenge_fk"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_friendship_id_fkey"
            columns: ["friendship_id"]
            isOneToOne: false
            referencedRelation: "friendships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_poke_id_fkey"
            columns: ["poke_id"]
            isOneToOne: false
            referencedRelation: "pokes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      poke_messages: {
        Row: {
          is_active: boolean
          key: string
          sort_order: number
          text_en: string | null
          text_tr: string
          tone: Database["public"]["Enums"]["poke_tone"]
        }
        ComputedFields: never
        Insert: {
          is_active?: boolean
          key: string
          sort_order: number
          text_en?: string | null
          text_tr: string
          tone: Database["public"]["Enums"]["poke_tone"]
        }
        Update: {
          is_active?: boolean
          key?: string
          sort_order?: number
          text_en?: string | null
          text_tr?: string
          tone?: Database["public"]["Enums"]["poke_tone"]
        }
        Relationships: []
      }
      pokes: {
        Row: {
          challenge_id: string | null
          created_at: string
          id: string
          message_key: string
          recipient_id: string
          sender_id: string
          tone: Database["public"]["Enums"]["poke_tone"]
        }
        ComputedFields: never
        Insert: {
          challenge_id?: string | null
          created_at?: string
          id?: string
          message_key: string
          recipient_id: string
          sender_id: string
          tone: Database["public"]["Enums"]["poke_tone"]
        }
        Update: {
          challenge_id?: string | null
          created_at?: string
          id?: string
          message_key?: string
          recipient_id?: string
          sender_id?: string
          tone?: Database["public"]["Enums"]["poke_tone"]
        }
        Relationships: [
          {
            foreignKeyName: "pokes_challenge_fk"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pokes_message"
            columns: ["message_key", "tone"]
            isOneToOne: false
            referencedRelation: "poke_messages"
            referencedColumns: ["key", "tone"]
          },
          {
            foreignKeyName: "pokes_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pokes_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          avatar_tint: string
          created_at: string
          display_name: string
          harsh_mode: boolean
          id: string
          updated_at: string
          username: string
        }
        ComputedFields: never
        Insert: {
          avatar_path?: string | null
          avatar_tint?: string
          created_at?: string
          display_name: string
          harsh_mode?: boolean
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_path?: string | null
          avatar_tint?: string
          created_at?: string
          display_name?: string
          harsh_mode?: boolean
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          last_seen_at: string
          platform: string
          token: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          last_seen_at?: string
          platform: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_seen_at?: string
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          also_blocked: boolean
          challenge_id: string | null
          checkin_id: string | null
          created_at: string
          details: string | null
          evidence: Json | null
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_user_id: string | null
          reporter_id: string | null
          review_due_at: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_type: Database["public"]["Enums"]["report_target"]
        }
        ComputedFields: never
        Insert: {
          also_blocked?: boolean
          challenge_id?: string | null
          checkin_id?: string | null
          created_at?: string
          details?: string | null
          evidence?: Json | null
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_user_id?: string | null
          reporter_id?: string | null
          review_due_at?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_type?: Database["public"]["Enums"]["report_target"]
        }
        Update: {
          also_blocked?: boolean
          challenge_id?: string | null
          checkin_id?: string | null
          created_at?: string
          details?: string | null
          evidence?: Json | null
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reported_user_id?: string | null
          reporter_id?: string | null
          review_due_at?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_type?: Database["public"]["Enums"]["report_target"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_challenge_fk"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_checkin_fk"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      streak_rescues: {
        Row: {
          ad_reward_id: string | null
          challenge_id: string
          created_at: string
          id: string
          method: Database["public"]["Enums"]["rescue_method"]
          quota_month: string | null
          rescued_date: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          ad_reward_id?: string | null
          challenge_id: string
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["rescue_method"]
          quota_month?: string | null
          rescued_date: string
          user_id: string
        }
        Update: {
          ad_reward_id?: string | null
          challenge_id?: string
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["rescue_method"]
          quota_month?: string | null
          rescued_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streak_rescues_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streak_rescues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_key: string
          earned_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          badge_key: string
          earned_at?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_key_fkey"
            columns: ["badge_key"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          birth_year: number
          checkin_floor: string | null
          daily_reminder_time: string | null
          day_end_grace_hours: number
          discoverability: Database["public"]["Enums"]["discoverability"]
          locale: string
          poke_push_enabled: boolean
          terms_accepted_at: string
          timezone: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          birth_year: number
          checkin_floor?: string | null
          daily_reminder_time?: string | null
          day_end_grace_hours?: number
          discoverability?: Database["public"]["Enums"]["discoverability"]
          locale?: string
          poke_push_enabled?: boolean
          terms_accepted_at?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_year?: number
          checkin_floor?: string | null
          daily_reminder_time?: string | null
          day_end_grace_hours?: number
          discoverability?: Database["public"]["Enums"]["discoverability"]
          locale?: string
          poke_push_enabled?: boolean
          terms_accepted_at?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_friend_request: {
        Args: { p_friendship: string }
        Returns: {
          accepted_at: string | null
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["friendship_status"]
        }
        SetofOptions: {
          from: "*"
          to: "friendships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ad_rescue_result: {
        Args: { p_challenge: string; p_missed_date: string }
        Returns: string
      }
      can_send_diken_push: { Args: { p_user: string }; Returns: boolean }
      challenge_board: {
        Args: { p_challenge: string }
        Returns: {
          avatar_path: string
          avatar_tint: string
          days_done: number
          display_name: string
          done_today: boolean
          rank: number
          role: Database["public"]["Enums"]["member_role"]
          streak: number
          user_id: string
          username: string
        }[]
      }
      challenge_detail: { Args: { p_challenge: string }; Returns: Json }
      checkin: {
        Args: {
          p_challenge: string
          p_local_date?: string
          p_note?: string
          p_photo_path?: string
          p_value?: number
        }
        Returns: {
          challenge_id: string
          created_at: string
          id: string
          local_date: string
          note: string | null
          photo_path: string | null
          updated_at: string
          user_id: string
          value: number | null
        }
        SetofOptions: {
          from: "*"
          to: "checkins"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_diken_push: { Args: { p_notification: string }; Returns: boolean }
      claim_social_push: { Args: { p_notification: string }; Returns: Json }
      complete_profile: {
        Args: {
          p_birth_year: number
          p_display_name: string
          p_locale?: string
          p_timezone?: string
          p_username: string
        }
        Returns: {
          avatar_path: string | null
          avatar_tint: string
          created_at: string
          display_name: string
          harsh_mode: boolean
          id: string
          updated_at: string
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_challenge: {
        Args: {
          p_duration_days?: number
          p_invite_message?: string
          p_invitees?: string[]
          p_number_base_target?: number
          p_number_daily_increment?: number
          p_number_max?: number
          p_number_step?: number
          p_number_unit?: string
          p_reminder_time?: string
          p_start_date?: string
          p_task_type?: Database["public"]["Enums"]["task_type"]
          p_template?: string
          p_title?: string
          p_visibility?: Database["public"]["Enums"]["challenge_visibility"]
        }
        Returns: {
          category: Database["public"]["Enums"]["challenge_category"] | null
          created_at: string
          created_by: string | null
          duration_days: number
          end_date: string | null
          icon: string
          id: string
          invite_message: string | null
          number_base_target: number | null
          number_daily_increment: number
          number_max: number | null
          number_step: number | null
          number_unit: string | null
          reminder_time: string | null
          short_title: string | null
          start_date: string
          task_type: Database["public"]["Enums"]["task_type"]
          template_id: string | null
          tint: string
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["challenge_visibility"]
        }
        SetofOptions: {
          from: "*"
          to: "challenges"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_invite: { Args: { p_challenge: string }; Returns: string }
      decline_rescue: {
        Args: { p_challenge: string; p_missed_date: string }
        Returns: boolean
      }
      diken_stage_for: {
        Args: { p_streak: number }
        Returns: Database["public"]["Enums"]["diken_stage"]
      }
      find_contacts: {
        Args: { p_email_hashes: string[] }
        Returns: {
          avatar_path: string
          avatar_tint: string
          display_name: string
          id: string
          is_friend: boolean
          mutual_count: number
          request_pending: boolean
          username: string
        }[]
      }
      finish_due_challenges: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      friend_profile: { Args: { p_user: string }; Returns: Json }
      friend_requests: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_path: string
          avatar_tint: string
          created_at: string
          direction: string
          display_name: string
          id: string
          mutual_count: number
          user_id: string
          username: string
        }[]
      }
      friends_today: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_challenges: number
          avatar_path: string
          avatar_tint: string
          display_name: string
          done_today: boolean
          harsh_mode: boolean
          shared_challenge_id: string
          shared_challenge_short_title: string
          shared_challenge_title: string
          streak: number
          user_id: string
          username: string
        }[]
      }
      get_invite_preview: { Args: { p_code: string }; Returns: Json }
      grant_ad_rescue: {
        Args: {
          p_ad_reward_id: string
          p_challenge: string
          p_missed_date: string
          p_user: string
        }
        Returns: {
          ad_reward_id: string | null
          challenge_id: string
          created_at: string
          id: string
          method: Database["public"]["Enums"]["rescue_method"]
          quota_month: string | null
          rescued_date: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "streak_rescues"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      invite_to_challenge: {
        Args: { p_challenge: string; p_users: string[] }
        Returns: number
      }
      is_username_available: { Args: { p_username: string }; Returns: boolean }
      join_challenge_by_invite: {
        Args: { p_code: string }
        Returns: {
          challenge_id: string
          created_at: string
          final_days_done: number | null
          final_rank: number | null
          final_required_days: number | null
          final_rescues: number | null
          finish_seen_at: string | null
          finished_at: string | null
          invited_by: string | null
          joined_at: string | null
          joined_on: string | null
          left_on: string | null
          reminder_time: string | null
          role: Database["public"]["Enums"]["member_role"]
          status: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "challenge_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      join_friend_challenge: {
        Args: { p_challenge: string }
        Returns: {
          challenge_id: string
          created_at: string
          final_days_done: number | null
          final_rank: number | null
          final_required_days: number | null
          final_rescues: number | null
          finish_seen_at: string | null
          finished_at: string | null
          invited_by: string | null
          joined_at: string | null
          joined_on: string | null
          left_on: string | null
          reminder_time: string | null
          role: Database["public"]["Enums"]["member_role"]
          status: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "challenge_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leave_challenge: {
        Args: { p_challenge: string }
        Returns: {
          challenge_id: string
          created_at: string
          final_days_done: number | null
          final_rank: number | null
          final_required_days: number | null
          final_rescues: number | null
          finish_seen_at: string | null
          finished_at: string | null
          invited_by: string | null
          joined_at: string | null
          joined_on: string | null
          left_on: string | null
          reminder_time: string | null
          role: Database["public"]["Enums"]["member_role"]
          status: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "challenge_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_finish_seen: { Args: { p_challenge: string }; Returns: boolean }
      mark_notifications_read: { Args: { p_ids?: string[] }; Returns: number }
      my_badges: {
        Args: Record<PropertyKey, never>
        Returns: {
          description: string
          earned_at: string
          icon: string
          key: string
          sort_order: number
          tint: string
          title: string
        }[]
      }
      my_garden: {
        Args: Record<PropertyKey, never>
        Returns: {
          challenge_id: string
          duration_days: number
          final_rank: number
          final_rescues: number
          finished_at: string
          is_longest: boolean
          longest_streak: number
          required_days: number
          short_title: string
          stage: Database["public"]["Enums"]["diken_stage"]
          title: string
        }[]
      }
      my_membership: { Args: { p_challenge: string }; Returns: Json }
      my_pending_rescues: {
        Args: Record<PropertyKey, never>
        Returns: {
          challenge_id: string
          expires_at: string
          free_rescue_available: boolean
          missed_date: string
          streak_before: number
          title: string
        }[]
      }
      my_recent_days: {
        Args: { p_days?: number }
        Returns: {
          covered: number
          day: string
          is_open: boolean
          required: number
          rescued: number
        }[]
      }
      my_streak: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_streak: number
          done_today: number
          free_rescue_available: boolean
          longest_streak: number
          stage: Database["public"]["Enums"]["diken_stage"]
          total_today: number
          wilted: boolean
        }[]
      }
      my_today: {
        Args: Record<PropertyKey, never>
        Returns: {
          challenge_id: string
          day_index: number
          done: boolean
          duration_days: number
          icon: string
          local_date: string
          member_count: number
          note: string
          number_unit: string
          photo_path: string
          short_title: string
          target: number
          task_type: Database["public"]["Enums"]["task_type"]
          tint: string
          title: string
          value: number
        }[]
      }
      my_unseen_finished: {
        Args: Record<PropertyKey, never>
        Returns: {
          challenge_id: string
          completed: boolean
          days_done: number
          duration_days: number
          finished_at: string
          icon: string
          rank: number
          required_days: number
          rescues: number
          short_title: string
          stage: Database["public"]["Enums"]["diken_stage"]
          task_type: Database["public"]["Enums"]["task_type"]
          tint: string
          title: string
        }[]
      }
      number_stats: {
        Args: { p_challenge: string; p_local_date?: string }
        Returns: Json
      }
      poke_status: {
        Args: { p_recipient: string }
        Returns: {
          daily_limit: number
          harsh_mode: boolean
          remaining: number
          sent_today: number
        }[]
      }
      queue_diken_notifications: {
        Args: Record<PropertyKey, never>
        Returns: {
          body: string
          challenge_id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          notification_id: string
          recipient_id: string
          tokens: string[]
          url: string
        }[]
      }
      record_ad_rescue_failure: {
        Args: {
          p_ad_reward_id: string
          p_challenge: string
          p_code: string
          p_hint?: string
          p_message: string
          p_missed_date: string
          p_user: string
        }
        Returns: boolean
      }
      register_push_token: {
        Args: { p_platform: string; p_token: string }
        Returns: undefined
      }
      rescue_streak: {
        Args: { p_challenge: string; p_missed_date: string }
        Returns: {
          ad_reward_id: string | null
          challenge_id: string
          created_at: string
          id: string
          method: Database["public"]["Enums"]["rescue_method"]
          quota_month: string | null
          rescued_date: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "streak_rescues"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      respond_to_invite: {
        Args: { p_accept: boolean; p_challenge: string }
        Returns: {
          challenge_id: string
          created_at: string
          final_days_done: number | null
          final_rank: number | null
          final_required_days: number | null
          final_rescues: number | null
          finish_seen_at: string | null
          finished_at: string | null
          invited_by: string | null
          joined_at: string | null
          joined_on: string | null
          left_on: string | null
          reminder_time: string | null
          role: Database["public"]["Enums"]["member_role"]
          status: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "challenge_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      revoke_invite: {
        Args: { p_challenge: string; p_code?: string }
        Returns: undefined
      }
      search_profiles: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          avatar_path: string
          avatar_tint: string
          display_name: string
          id: string
          is_friend: boolean
          mutual_count: number
          request_pending: boolean
          username: string
        }[]
      }
      send_friend_request: {
        Args: { p_user: string }
        Returns: {
          accepted_at: string | null
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["friendship_status"]
        }
        SetofOptions: {
          from: "*"
          to: "friendships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      send_poke: {
        Args: {
          p_challenge?: string
          p_message_key: string
          p_recipient: string
          p_tone: Database["public"]["Enums"]["poke_tone"]
        }
        Returns: {
          challenge_id: string | null
          created_at: string
          id: string
          message_key: string
          recipient_id: string
          sender_id: string
          tone: Database["public"]["Enums"]["poke_tone"]
        }
        SetofOptions: {
          from: "*"
          to: "pokes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_my_reminder: {
        Args: { p_challenge: string; p_time: string }
        Returns: Json
      }
      submit_report: {
        Args: {
          p_also_block?: boolean
          p_challenge?: string
          p_checkin?: string
          p_details?: string
          p_invite_code?: string
          p_reason: Database["public"]["Enums"]["report_reason"]
          p_target?: Database["public"]["Enums"]["report_target"]
          p_user: string
        }
        Returns: string
      }
      template_popularity: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_count: number
          popularity: number
          template_id: string
        }[]
      }
      template_stats: { Args: { p_template: string }; Returns: Json }
      undo_checkin: {
        Args: { p_challenge: string; p_local_date?: string }
        Returns: boolean
      }
    }
    Enums: {
      challenge_category:
        | "detox"
        | "social_courage"
        | "sport"
        | "food_drink"
        | "reading"
        | "money"
        | "quirky"
      challenge_difficulty: "easy" | "medium" | "hard"
      challenge_visibility: "invited" | "friends"
      diken_stage: "filiz" | "genc" | "tam" | "cicek"
      discoverability: "everyone" | "nobody"
      friendship_status: "pending" | "accepted"
      member_role: "owner" | "member"
      member_status: "invited" | "active" | "declined" | "left"
      notification_kind:
        | "daily_reminder"
        | "day_ending"
        | "streak_broken"
        | "weekly_summary"
        | "streak_milestone"
        | "poke_hype"
        | "poke_roast"
        | "friend_request"
        | "challenge_invite"
        | "friend_finished_challenge"
      poke_tone: "hype" | "roast"
      report_reason:
        | "harassment"
        | "inappropriate_photo"
        | "spam_or_fake"
        | "dangerous_challenge"
        | "other"
      report_status: "pending" | "reviewing" | "actioned" | "dismissed"
      report_target: "user" | "photo" | "challenge"
      rescue_method: "ad" | "free"
      task_type: "check" | "photo" | "number"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      challenge_category: [
        "detox",
        "social_courage",
        "sport",
        "food_drink",
        "reading",
        "money",
        "quirky",
      ],
      challenge_difficulty: ["easy", "medium", "hard"],
      challenge_visibility: ["invited", "friends"],
      diken_stage: ["filiz", "genc", "tam", "cicek"],
      discoverability: ["everyone", "nobody"],
      friendship_status: ["pending", "accepted"],
      member_role: ["owner", "member"],
      member_status: ["invited", "active", "declined", "left"],
      notification_kind: [
        "daily_reminder",
        "day_ending",
        "streak_broken",
        "weekly_summary",
        "streak_milestone",
        "poke_hype",
        "poke_roast",
        "friend_request",
        "challenge_invite",
        "friend_finished_challenge",
      ],
      poke_tone: ["hype", "roast"],
      report_reason: [
        "harassment",
        "inappropriate_photo",
        "spam_or_fake",
        "dangerous_challenge",
        "other",
      ],
      report_status: ["pending", "reviewing", "actioned", "dismissed"],
      report_target: ["user", "photo", "challenge"],
      rescue_method: ["ad", "free"],
      task_type: ["check", "photo", "number"],
    },
  },
} as const
