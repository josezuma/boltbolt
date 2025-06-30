export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      brands: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      discount_categories: {
        Row: {
          category_id: string | null
          created_at: string
          discount_id: string | null
          id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          discount_id?: string | null
          id?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          discount_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_categories_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          }
        ]
      }
      discount_products: {
        Row: {
          created_at: string
          discount_id: string | null
          id: string
          product_id: string | null
        }
        Insert: {
          created_at?: string
          discount_id?: string | null
          id?: string
          product_id?: string | null
        }
        Update: {
          created_at?: string
          discount_id?: string | null
          id?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_products_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      discount_redemptions: {
        Row: {
          amount_discounted: string
          created_at: string
          discount_id: string | null
          id: string
          order_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_discounted: string
          created_at?: string
          discount_id?: string | null
          id?: string
          order_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_discounted?: string
          created_at?: string
          discount_id?: string | null
          id?: string
          order_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_redemptions_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      discounts: {
        Row: {
          applies_to_all_products: boolean
          code: string | null
          created_at: string
          description: string | null
          discount_type: "percentage" | "fixed_amount"
          discount_value: string
          ends_at: string | null
          id: string
          is_active: boolean
          is_automatic: boolean
          minimum_purchase_amount: string
          name: string
          starts_at: string
          updated_at: string
          usage_limit: number | null
          usage_limit_per_customer: number | null
        }
        Insert: {
          applies_to_all_products?: boolean
          code?: string | null
          created_at?: string
          description?: string | null
          discount_type?: "percentage" | "fixed_amount"
          discount_value: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          is_automatic?: boolean
          minimum_purchase_amount?: string
          name: string
          starts_at?: string
          updated_at?: string
          usage_limit?: number | null
          usage_limit_per_customer?: number | null
        }
        Update: {
          applies_to_all_products?: boolean
          code?: string | null
          created_at?: string
          description?: string | null
          discount_type?: "percentage" | "fixed_amount"
          discount_value?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          is_automatic?: boolean
          minimum_purchase_amount?: string
          name?: string
          starts_at?: string
          updated_at?: string
          usage_limit?: number | null
          usage_limit_per_customer?: number | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: string
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: string
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          created_at: string
          discount_amount: string
          discount_id: string | null
          id: string
          shipping_address: Json | null
          status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
          stripe_payment_intent: string | null
          total_amount: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          discount_amount?: string
          discount_id?: string | null
          id?: string
          shipping_address?: Json | null
          status?: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
          stripe_payment_intent?: string | null
          total_amount: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          discount_amount?: string
          discount_id?: string | null
          id?: string
          shipping_address?: Json | null
          status?: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
          stripe_payment_intent?: string | null
          total_amount?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          brand_id: string | null
          care_instructions: string | null
          category_id: string | null
          created_at: string
          description: string | null
          dimensions: Json | null
          featured_image_id: string | null
          id: string
          image_url: string | null
          is_active: boolean
          material: string | null
          name: string
          price: string
          sku: string | null
          slug: string
          stock: number
          tags: string[] | null
          updated_at: string
          weight: string | null
        }
        Insert: {
          brand_id?: string | null
          care_instructions?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          dimensions?: Json | null
          featured_image_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          material?: string | null
          name: string
          price: string
          sku?: string | null
          slug: string
          stock?: number
          tags?: string[] | null
          updated_at?: string
          weight?: string | null
        }
        Update: {
          brand_id?: string | null
          care_instructions?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          dimensions?: Json | null
          featured_image_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          material?: string | null
          name?: string
          price?: string
          sku?: string | null
          slug?: string
          stock?: number
          tags?: string[] | null
          updated_at?: string
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_featured_image_id_fkey"
            columns: ["featured_image_id"]
            isOneToOne: false
            referencedRelation: "product_images"
            referencedColumns: ["id"]
          }
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          is_featured: boolean
          product_id: string | null
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_featured?: boolean
          product_id?: string | null
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_featured?: boolean
          product_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean
          is_verified_purchase: boolean
          product_id: string | null
          rating: number | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          is_verified_purchase?: boolean
          product_id?: string | null
          rating?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          is_verified_purchase?: boolean
          product_id?: string | null
          rating?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      product_variants: {
        Row: {
          attributes: Json | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          price: string | null
          product_id: string | null
          sku: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          attributes?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          price?: string | null
          product_id?: string | null
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          attributes?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: string | null
          product_id?: string | null
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          role: "admin" | "customer"
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          role?: "admin" | "customer"
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: "admin" | "customer"
          updated_at?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      discount_type: "percentage" | "fixed_amount"
      order_status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
      user_role: "admin" | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}