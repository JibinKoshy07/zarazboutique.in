PGDMP                      }            postgres    16.6 (Debian 16.6-1.pgdg120+1)    16.6 (Debian 16.6-1.pgdg120+1) �              0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false                       0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false                       0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false                       1262    17352    postgres    DATABASE     s   CREATE DATABASE postgres WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';
    DROP DATABASE postgres;
                postgres    false            9           1255    17789    add_category_created_event()    FUNCTION     �   CREATE FUNCTION public.add_category_created_event() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      INSERT INTO event (name, data)
      VALUES ('category_created', row_to_json(NEW));
      RETURN NEW;
    END;
    $$;
 3   DROP FUNCTION public.add_category_created_event();
       public          postgres    false            ;           1255    17793    add_category_deleted_event()    FUNCTION     �   CREATE FUNCTION public.add_category_deleted_event() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      INSERT INTO event (name, data)
      VALUES ('category_deleted', row_to_json(OLD));
      RETURN OLD;
    END;
    $$;
 3   DROP FUNCTION public.add_category_deleted_event();
       public          postgres    false            :           1255    17791    add_category_updated_event()    FUNCTION     �   CREATE FUNCTION public.add_category_updated_event() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      INSERT INTO event (name, data)
      VALUES ('category_updated', row_to_json(NEW));
      RETURN NEW;
    END;
    $$;
 3   DROP FUNCTION public.add_category_updated_event();
       public          postgres    false            J           1255    18177    add_customer_created_event()    FUNCTION     �   CREATE FUNCTION public.add_customer_created_event() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      INSERT INTO event (name, data)
      VALUES ('customer_created', row_to_json(NEW));
      RETURN NEW;
    END;
    $$;
 3   DROP FUNCTION public.add_customer_created_event();
       public          postgres    false            L           1255    18181    add_customer_deleted_event()    FUNCTION     �   CREATE FUNCTION public.add_customer_deleted_event() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      INSERT INTO event (name, data)
      VALUES ('customer_deleted', row_to_json(OLD));
      RETURN OLD;
    END;
    $$;
 3   DROP FUNCTION public.add_customer_deleted_event();
       public          postgres    false            K           1255    18179    add_customer_updated_event()    FUNCTION     �   CREATE FUNCTION public.add_customer_updated_event() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      INSERT INTO event (name, data)
      VALUES ('customer_updated', row_to_json(NEW));
      RETURN NEW;
    END;
    $$;
 3   DROP FUNCTION public.add_customer_updated_event();
       public          postgres    false            C           1255    18069    add_order_created_event()    FUNCTION     �   CREATE FUNCTION public.add_order_created_event() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      INSERT INTO event (name, data)
      VALUES ('order_created', row_to_json(NEW));
      RETURN NEW;
    END;
    $$;
 0   DROP FUNCTION public.add_order_created_event();
       public          postgres    false            <           1255    17795    add_product_created_event()    FUNCTION     �   CREATE FUNCTION public.add_product_created_event() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      INSERT INTO event (name, data)
      VALUES ('product_created', row_to_json(NEW));
      RETURN NEW;
    END;
    $$;
 2   DROP FUNCTION public.add_product_created_event();
       public          postgres    false            >           1255    17799    add_product_deleted_event()    FUNCTION     �   CREATE FUNCTION public.add_product_deleted_event() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      INSERT INTO event (name, data)
      VALUES ('product_deleted', row_to_json(OLD));
      RETURN OLD;
    END;
    $$;
 2   DROP FUNCTION public.add_product_deleted_event();
       public          postgres    false            @           1255    17819 %   add_product_inventory_updated_event()    FUNCTION     '  CREATE FUNCTION public.add_product_inventory_updated_event() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      INSERT INTO event (name, data)
      VALUES ('inventory_updated', json_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)));
      RETURN NEW;
    END;
    $$;
 <   DROP FUNCTION public.add_product_inventory_updated_event();
       public          postgres    false            =           1255    17797    add_product_updated_event()    FUNCTION     �   CREATE FUNCTION public.add_product_updated_event() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      INSERT INTO event (name, data)
      VALUES ('product_updated', row_to_json(NEW));
      RETURN NEW;
    END;
    $$;
 2   DROP FUNCTION public.add_product_updated_event();
       public          postgres    false            8           1255    17775    build_url_key()    FUNCTION     i  CREATE FUNCTION public.build_url_key() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
      url_key TEXT;
    BEGIN
      IF(NEW.url_key IS NULL) THEN
        url_key = regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g');
        url_key = regexp_replace(url_key, '^-|-$', '', 'g');
        url_key = lower(url_key);
        url_key = url_key || '-' || (SELECT floor(random() * 1000000)::text);
        NEW.url_key = url_key;
      ELSE
        IF (NEW.url_key ~ '[/\#]') THEN
          RAISE EXCEPTION 'Invalid url_key: %', NEW.url_key;
        END IF;
      END IF;
      RETURN NEW;
    END;
    $_$;
 &   DROP FUNCTION public.build_url_key();
       public          postgres    false            4           1255    17758 &   delete_product_attribute_value_index()    FUNCTION     g  CREATE FUNCTION public.delete_product_attribute_value_index() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        DELETE FROM "product_attribute_value_index" WHERE "product_attribute_value_index".option_id = OLD.attribute_option_id AND "product_attribute_value_index"."attribute_id" = OLD.attribute_id;
        RETURN OLD;
      END;
      $$;
 =   DROP FUNCTION public.delete_product_attribute_value_index();
       public          postgres    false            ?           1255    17817    delete_sub_categories()    FUNCTION     I  CREATE FUNCTION public.delete_sub_categories() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      sub_categories RECORD;
    BEGIN
      FOR sub_categories IN
        WITH RECURSIVE sub_categories AS (
          SELECT * FROM category WHERE parent_id = OLD.category_id
          UNION
          SELECT c.* FROM category c
          INNER JOIN sub_categories sc ON c.parent_id = sc.category_id
        ) SELECT * FROM sub_categories
      LOOP
        DELETE FROM category WHERE category_id = sub_categories.category_id;
      END LOOP;
      RETURN OLD;
    END;
    $$;
 .   DROP FUNCTION public.delete_sub_categories();
       public          postgres    false            6           1255    17766 3   delete_variant_group_after_attribute_type_changed()    FUNCTION     1  CREATE FUNCTION public.delete_variant_group_after_attribute_type_changed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        IF (OLD.type = 'select' AND NEW.type <> 'select') THEN
          DELETE FROM "variant_group" WHERE ("variant_group".attribute_one = OLD.attribute_id OR "variant_group".attribute_two = OLD.attribute_id OR "variant_group".attribute_three = OLD.attribute_id OR "variant_group".attribute_four = OLD.attribute_id OR "variant_group".attribute_five = OLD.attribute_id);
        END IF;
        RETURN NEW;
      END
      $$;
 J   DROP FUNCTION public.delete_variant_group_after_attribute_type_changed();
       public          postgres    false            1           1255    17752     prevent_change_attribute_group()    FUNCTION     R  CREATE FUNCTION public.prevent_change_attribute_group() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        IF OLD.group_id != NEW.group_id AND OLD.variant_group_id IS NOT NULL THEN
          RAISE EXCEPTION 'Cannot change attribute group of product with variants';
        END IF;
        RETURN NEW;
      END;
      $$;
 7   DROP FUNCTION public.prevent_change_attribute_group();
       public          postgres    false            0           1255    17750 (   prevent_delete_default_attribute_group()    FUNCTION     "  CREATE FUNCTION public.prevent_delete_default_attribute_group() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        IF OLD.attribute_group_id = 1 THEN
          RAISE EXCEPTION 'Cannot delete default attribute group';
        END IF;
        RETURN OLD;
      END;
      $$;
 ?   DROP FUNCTION public.prevent_delete_default_attribute_group();
       public          postgres    false            D           1255    18173 '   prevent_delete_default_customer_group()    FUNCTION       CREATE FUNCTION public.prevent_delete_default_customer_group() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        IF OLD.customer_group_id = 1 THEN
          RAISE EXCEPTION 'Cannot delete default customer group';
        END IF;
        RETURN OLD;
      END;
      $$;
 >   DROP FUNCTION public.prevent_delete_default_customer_group();
       public          postgres    false            U           1255    18290 "   prevent_delete_default_tax_class()    FUNCTION       CREATE FUNCTION public.prevent_delete_default_tax_class() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        IF OLD.tax_class_id = 1 THEN
          RAISE EXCEPTION 'Cannot delete default tax class';
        END IF;
        RETURN OLD;
      END;
      $$;
 9   DROP FUNCTION public.prevent_delete_default_tax_class();
       public          postgres    false            A           1255    17823    product_image_insert_trigger()    FUNCTION     �   CREATE FUNCTION public.product_image_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        INSERT INTO event (name, data)
        VALUES ('product_image_added', row_to_json(NEW));
        RETURN NEW;
      END;
      $$;
 5   DROP FUNCTION public.product_image_insert_trigger();
       public          postgres    false            B           1255    17989 (   reduce_product_stock_when_order_placed()    FUNCTION     )  CREATE FUNCTION public.reduce_product_stock_when_order_placed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        UPDATE product_inventory SET qty = qty - NEW.qty WHERE product_inventory_product_id = NEW.product_id AND manage_stock = TRUE;
        RETURN NEW;
      END
      $$;
 ?   DROP FUNCTION public.reduce_product_stock_when_order_placed();
       public          postgres    false            2           1255    17754    remove_attribute_from_group()    FUNCTION     �  CREATE FUNCTION public.remove_attribute_from_group() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        DELETE FROM product_attribute_value_index WHERE product_attribute_value_index.attribute_id = OLD.attribute_id AND product_attribute_value_index.product_id IN (SELECT product.product_id FROM product WHERE product.group_id = OLD.group_id);
        DELETE FROM variant_group WHERE variant_group.attribute_group_id = OLD.group_id AND (variant_group.attribute_one = OLD.attribute_id OR variant_group.attribute_two = OLD.attribute_id OR variant_group.attribute_three = OLD.attribute_id OR variant_group.attribute_four = OLD.attribute_id OR variant_group.attribute_five = OLD.attribute_id);
        RETURN OLD;
      END;
      $$;
 4   DROP FUNCTION public.remove_attribute_from_group();
       public          postgres    false            S           1255    18226    set_coupon_used_time()    FUNCTION     �   CREATE FUNCTION public.set_coupon_used_time() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        UPDATE "coupon" SET used_time = used_time + 1 WHERE coupon = NEW.coupon;
        RETURN NEW;
      END;
      $$;
 -   DROP FUNCTION public.set_coupon_used_time();
       public          postgres    false            E           1255    18175    set_default_customer_group()    FUNCTION     �   CREATE FUNCTION public.set_default_customer_group() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        IF NEW.group_id IS NULL THEN
          NEW.group_id = 1;
        END IF;
        RETURN NEW;
      END;
      $$;
 3   DROP FUNCTION public.set_default_customer_group();
       public          postgres    false            7           1255    17763 5   update_attribute_index_and_variant_group_visibility()    FUNCTION     #  CREATE FUNCTION public.update_attribute_index_and_variant_group_visibility() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        DELETE FROM "product_attribute_value_index"
        WHERE "product_attribute_value_index"."product_id" = NEW.product_id 
        AND "product_attribute_value_index"."attribute_id" NOT IN (SELECT "attribute_group_link"."attribute_id" FROM "attribute_group_link" WHERE "attribute_group_link"."group_id" = NEW.group_id);
        UPDATE "variant_group" SET visibility = COALESCE((SELECT bool_or(visibility) FROM "product" WHERE "product"."variant_group_id" = NEW.variant_group_id AND "product"."status" = TRUE GROUP BY "product"."variant_group_id"), FALSE) WHERE "variant_group"."variant_group_id" = NEW.variant_group_id;
        RETURN NEW;
      END;
      $$;
 L   DROP FUNCTION public.update_attribute_index_and_variant_group_visibility();
       public          postgres    false            3           1255    17756 ,   update_product_attribute_option_value_text()    FUNCTION     �  CREATE FUNCTION public.update_product_attribute_option_value_text() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        UPDATE "product_attribute_value_index" SET "option_text" = NEW.option_text
        WHERE "product_attribute_value_index".option_id = NEW.attribute_option_id AND "product_attribute_value_index".attribute_id = NEW.attribute_id;
        RETURN NEW;
      END;
      $$;
 C   DROP FUNCTION public.update_product_attribute_option_value_text();
       public          postgres    false            5           1255    17760 !   update_variant_group_visibility()    FUNCTION     �  CREATE FUNCTION public.update_variant_group_visibility() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        UPDATE "variant_group" SET visibility = (SELECT bool_or(visibility) FROM "product" WHERE "product"."variant_group_id" = NEW.variant_group_id AND "product"."status" = TRUE) WHERE "variant_group"."variant_group_id" = NEW.variant_group_id;
        RETURN NEW;
      END;
      $$;
 8   DROP FUNCTION public.update_variant_group_visibility();
       public          postgres    false            �            1259    17354 
   admin_user    TABLE     �  CREATE TABLE public.admin_user (
    admin_user_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    status boolean DEFAULT true NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    full_name character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.admin_user;
       public         heap    postgres    false            �            1259    17353    admin_user_admin_user_id_seq    SEQUENCE     �   ALTER TABLE public.admin_user ALTER COLUMN admin_user_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.admin_user_admin_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    216            �            1259    17417 	   attribute    TABLE     �  CREATE TABLE public.attribute (
    attribute_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    attribute_code character varying NOT NULL,
    attribute_name character varying NOT NULL,
    type character varying NOT NULL,
    is_required boolean DEFAULT false NOT NULL,
    display_on_frontend boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_filterable boolean DEFAULT false NOT NULL
);
    DROP TABLE public.attribute;
       public         heap    postgres    false            �            1259    17416    attribute_attribute_id_seq    SEQUENCE     �   ALTER TABLE public.attribute ALTER COLUMN attribute_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.attribute_attribute_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    223            �            1259    17451    attribute_group    TABLE     '  CREATE TABLE public.attribute_group (
    attribute_group_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    group_name text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
 #   DROP TABLE public.attribute_group;
       public         heap    postgres    false            �            1259    17450 &   attribute_group_attribute_group_id_seq    SEQUENCE     �   ALTER TABLE public.attribute_group ALTER COLUMN attribute_group_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.attribute_group_attribute_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    227            �            1259    17464    attribute_group_link    TABLE     �   CREATE TABLE public.attribute_group_link (
    attribute_group_link_id integer NOT NULL,
    attribute_id integer NOT NULL,
    group_id integer NOT NULL
);
 (   DROP TABLE public.attribute_group_link;
       public         heap    postgres    false            �            1259    17463 0   attribute_group_link_attribute_group_link_id_seq    SEQUENCE       ALTER TABLE public.attribute_group_link ALTER COLUMN attribute_group_link_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.attribute_group_link_attribute_group_link_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    229            �            1259    17434    attribute_option    TABLE       CREATE TABLE public.attribute_option (
    attribute_option_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    attribute_id integer NOT NULL,
    attribute_code character varying NOT NULL,
    option_text character varying NOT NULL
);
 $   DROP TABLE public.attribute_option;
       public         heap    postgres    false            �            1259    17433 (   attribute_option_attribute_option_id_seq    SEQUENCE     �   ALTER TABLE public.attribute_option ALTER COLUMN attribute_option_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.attribute_option_attribute_option_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    225                       1259    17826    cart    TABLE     �  CREATE TABLE public.cart (
    cart_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    sid character varying,
    currency character varying NOT NULL,
    customer_id integer,
    customer_group_id smallint,
    customer_email character varying,
    customer_full_name character varying,
    user_ip character varying,
    status boolean DEFAULT false NOT NULL,
    coupon character varying,
    shipping_fee_excl_tax numeric(12,4) DEFAULT NULL::numeric,
    shipping_fee_incl_tax numeric(12,4) DEFAULT NULL::numeric,
    discount_amount numeric(12,4) DEFAULT NULL::numeric,
    sub_total numeric(12,4) NOT NULL,
    sub_total_incl_tax numeric(12,4) NOT NULL,
    sub_total_with_discount numeric(12,4) NOT NULL,
    sub_total_with_discount_incl_tax numeric(12,4) NOT NULL,
    total_qty integer NOT NULL,
    total_weight numeric(12,4) DEFAULT NULL::numeric,
    tax_amount numeric(12,4) NOT NULL,
    tax_amount_before_discount numeric(12,4) NOT NULL,
    shipping_tax_amount numeric(12,4) NOT NULL,
    grand_total numeric(12,4) NOT NULL,
    shipping_method character varying,
    shipping_method_name character varying,
    shipping_zone_id integer,
    shipping_address_id integer,
    payment_method character varying,
    payment_method_name character varying,
    billing_address_id integer,
    shipping_note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    total_tax_amount numeric(12,4)
);
    DROP TABLE public.cart;
       public         heap    postgres    false                       1259    17844    cart_address    TABLE     |  CREATE TABLE public.cart_address (
    cart_address_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying,
    postcode character varying,
    telephone character varying,
    country character varying,
    province character varying,
    city character varying,
    address_1 character varying,
    address_2 character varying
);
     DROP TABLE public.cart_address;
       public         heap    postgres    false                       1259    17843     cart_address_cart_address_id_seq    SEQUENCE     �   ALTER TABLE public.cart_address ALTER COLUMN cart_address_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.cart_address_cart_address_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    259                        1259    17825    cart_cart_id_seq    SEQUENCE     �   ALTER TABLE public.cart ALTER COLUMN cart_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.cart_cart_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    257                       1259    17855 	   cart_item    TABLE     �  CREATE TABLE public.cart_item (
    cart_item_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    cart_id integer NOT NULL,
    product_id integer NOT NULL,
    product_sku character varying NOT NULL,
    product_name text NOT NULL,
    thumbnail character varying,
    product_weight numeric(12,4) DEFAULT NULL::numeric,
    product_price numeric(12,4) NOT NULL,
    product_price_incl_tax numeric(12,4) NOT NULL,
    qty integer NOT NULL,
    final_price numeric(12,4) NOT NULL,
    final_price_incl_tax numeric(12,4) NOT NULL,
    tax_percent numeric(12,4) NOT NULL,
    tax_amount numeric(12,4) NOT NULL,
    tax_amount_before_discount numeric(12,4) NOT NULL,
    discount_amount numeric(12,4) NOT NULL,
    line_total numeric(12,4) NOT NULL,
    line_total_with_discount numeric(12,4) NOT NULL,
    line_total_incl_tax numeric(12,4) NOT NULL,
    line_total_with_discount_incl_tax numeric(12,4) NOT NULL,
    variant_group_id integer,
    variant_options text,
    product_custom_options text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.cart_item;
       public         heap    postgres    false                       1259    17854    cart_item_cart_item_id_seq    SEQUENCE     �   ALTER TABLE public.cart_item ALTER COLUMN cart_item_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.cart_item_cart_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    261            �            1259    17666    category    TABLE     �  CREATE TABLE public.category (
    category_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    status boolean NOT NULL,
    parent_id integer,
    include_in_nav boolean NOT NULL,
    "position" smallint,
    show_products boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.category;
       public         heap    postgres    false            �            1259    17665    category_category_id_seq    SEQUENCE     �   ALTER TABLE public.category ALTER COLUMN category_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.category_category_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    245            �            1259    17698    category_description    TABLE     v  CREATE TABLE public.category_description (
    category_description_id integer NOT NULL,
    category_description_category_id integer NOT NULL,
    name character varying NOT NULL,
    short_description text,
    description text,
    image character varying,
    meta_title text,
    meta_keywords text,
    meta_description text,
    url_key character varying NOT NULL
);
 (   DROP TABLE public.category_description;
       public         heap    postgres    false            �            1259    17697 0   category_description_category_description_id_seq    SEQUENCE       ALTER TABLE public.category_description ALTER COLUMN category_description_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.category_description_category_description_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    247                       1259    18072    cms_page    TABLE       CREATE TABLE public.cms_page (
    cms_page_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    status boolean,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.cms_page;
       public         heap    postgres    false                       1259    18071    cms_page_cms_page_id_seq    SEQUENCE     �   ALTER TABLE public.cms_page ALTER COLUMN cms_page_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.cms_page_cms_page_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    283                       1259    18085    cms_page_description    TABLE     J  CREATE TABLE public.cms_page_description (
    cms_page_description_id integer NOT NULL,
    cms_page_description_cms_page_id integer,
    url_key character varying NOT NULL,
    name character varying NOT NULL,
    content text,
    meta_title character varying,
    meta_keywords character varying,
    meta_description text
);
 (   DROP TABLE public.cms_page_description;
       public         heap    postgres    false                       1259    18084 0   cms_page_description_cms_page_description_id_seq    SEQUENCE       ALTER TABLE public.cms_page_description ALTER COLUMN cms_page_description_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.cms_page_description_cms_page_description_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    285            �            1259    17716 
   collection    TABLE     _  CREATE TABLE public.collection (
    collection_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text,
    code character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.collection;
       public         heap    postgres    false            �            1259    17715    collection_collection_id_seq    SEQUENCE     �   ALTER TABLE public.collection ALTER COLUMN collection_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.collection_collection_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    249            )           1259    18206    coupon    TABLE     &  CREATE TABLE public.coupon (
    coupon_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    status boolean DEFAULT true NOT NULL,
    description character varying NOT NULL,
    discount_amount numeric(12,4) NOT NULL,
    free_shipping boolean DEFAULT false NOT NULL,
    discount_type character varying DEFAULT '1'::character varying NOT NULL,
    coupon character varying NOT NULL,
    used_time integer DEFAULT 0 NOT NULL,
    target_products jsonb,
    condition jsonb,
    user_condition jsonb,
    buyx_gety jsonb,
    max_uses_time_per_coupon integer,
    max_uses_time_per_customer integer,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "POSITIVE_DISCOUNT_AMOUNT" CHECK ((discount_amount >= (0)::numeric)),
    CONSTRAINT "VALID_PERCENTAGE_DISCOUNT" CHECK (((discount_amount <= (100)::numeric) OR ((discount_type)::text <> 'percentage'::text)))
);
    DROP TABLE public.coupon;
       public         heap    postgres    false            (           1259    18205    coupon_coupon_id_seq    SEQUENCE     �   ALTER TABLE public.coupon ALTER COLUMN coupon_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.coupon_coupon_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    297            #           1259    18132    customer    TABLE     �  CREATE TABLE public.customer (
    customer_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    status smallint DEFAULT 1 NOT NULL,
    group_id integer DEFAULT 1,
    email character varying NOT NULL,
    password character varying NOT NULL,
    full_name character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.customer;
       public         heap    postgres    false            %           1259    18155    customer_address    TABLE     M  CREATE TABLE public.customer_address (
    customer_address_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id integer NOT NULL,
    full_name character varying,
    telephone character varying,
    address_1 character varying,
    address_2 character varying,
    postcode character varying,
    city character varying,
    province character varying,
    country character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_default boolean
);
 $   DROP TABLE public.customer_address;
       public         heap    postgres    false            $           1259    18154 (   customer_address_customer_address_id_seq    SEQUENCE     �   ALTER TABLE public.customer_address ALTER COLUMN customer_address_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.customer_address_customer_address_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    293            "           1259    18131    customer_customer_id_seq    SEQUENCE     �   ALTER TABLE public.customer ALTER COLUMN customer_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.customer_customer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    291            !           1259    18121    customer_group    TABLE     2  CREATE TABLE public.customer_group (
    customer_group_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    group_name character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
 "   DROP TABLE public.customer_group;
       public         heap    postgres    false                        1259    18120 $   customer_group_customer_group_id_seq    SEQUENCE     �   ALTER TABLE public.customer_group ALTER COLUMN customer_group_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.customer_group_customer_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    289            �            1259    17405    event    TABLE     �   CREATE TABLE public.event (
    event_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    data json,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.event;
       public         heap    postgres    false            �            1259    17404    event_event_id_seq    SEQUENCE     �   ALTER TABLE public.event ALTER COLUMN event_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.event_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    221            �            1259    17370 	   migration    TABLE       CREATE TABLE public.migration (
    migration_id integer NOT NULL,
    module character varying NOT NULL,
    version character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.migration;
       public         heap    postgres    false            �            1259    17369    migration_migration_id_seq    SEQUENCE     �   ALTER TABLE public.migration ALTER COLUMN migration_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.migration_migration_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    218                       1259    17881    order    TABLE     �  CREATE TABLE public."order" (
    order_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    integration_order_id character varying,
    sid character varying,
    order_number character varying NOT NULL,
    status character varying NOT NULL,
    cart_id integer NOT NULL,
    currency character varying NOT NULL,
    customer_id integer,
    customer_email character varying,
    customer_full_name character varying,
    user_ip character varying,
    user_agent character varying,
    coupon character varying,
    shipping_fee_excl_tax numeric(12,4) DEFAULT NULL::numeric,
    shipping_fee_incl_tax numeric(12,4) DEFAULT NULL::numeric,
    discount_amount numeric(12,4) DEFAULT NULL::numeric,
    sub_total numeric(12,4) NOT NULL,
    sub_total_incl_tax numeric(12,4) NOT NULL,
    sub_total_with_discount numeric(12,4) NOT NULL,
    sub_total_with_discount_incl_tax numeric(12,4) NOT NULL,
    total_qty integer NOT NULL,
    total_weight numeric(12,4) DEFAULT NULL::numeric,
    tax_amount numeric(12,4) NOT NULL,
    tax_amount_before_discount numeric(12,4) NOT NULL,
    shipping_tax_amount numeric(12,4) NOT NULL,
    shipping_note text,
    grand_total numeric(12,4) NOT NULL,
    shipping_method character varying,
    shipping_method_name character varying,
    shipping_address_id integer,
    payment_method character varying,
    payment_method_name character varying,
    billing_address_id integer,
    shipment_status character varying,
    payment_status character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    total_tax_amount numeric(12,4)
);
    DROP TABLE public."order";
       public         heap    postgres    false            	           1259    17902    order_activity    TABLE     �  CREATE TABLE public.order_activity (
    order_activity_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    order_activity_order_id integer NOT NULL,
    comment text NOT NULL,
    customer_notified boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
 "   DROP TABLE public.order_activity;
       public         heap    postgres    false                       1259    17901 $   order_activity_order_activity_id_seq    SEQUENCE     �   ALTER TABLE public.order_activity ALTER COLUMN order_activity_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.order_activity_order_activity_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    265                       1259    17922    order_address    TABLE     ~  CREATE TABLE public.order_address (
    order_address_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying,
    postcode character varying,
    telephone character varying,
    country character varying,
    province character varying,
    city character varying,
    address_1 character varying,
    address_2 character varying
);
 !   DROP TABLE public.order_address;
       public         heap    postgres    false            
           1259    17921 "   order_address_order_address_id_seq    SEQUENCE     �   ALTER TABLE public.order_address ALTER COLUMN order_address_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.order_address_order_address_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    267                       1259    17933 
   order_item    TABLE     <  CREATE TABLE public.order_item (
    order_item_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    order_item_order_id integer NOT NULL,
    product_id integer NOT NULL,
    referer integer,
    product_sku character varying NOT NULL,
    product_name text NOT NULL,
    thumbnail character varying,
    product_weight numeric(12,4) DEFAULT NULL::numeric,
    product_price numeric(12,4) NOT NULL,
    product_price_incl_tax numeric(12,4) NOT NULL,
    qty integer NOT NULL,
    final_price numeric(12,4) NOT NULL,
    final_price_incl_tax numeric(12,4) NOT NULL,
    tax_percent numeric(12,4) NOT NULL,
    tax_amount numeric(12,4) NOT NULL,
    tax_amount_before_discount numeric(12,4) NOT NULL,
    discount_amount numeric(12,4) NOT NULL,
    line_total numeric(12,4) NOT NULL,
    line_total_with_discount numeric(12,4) NOT NULL,
    line_total_incl_tax numeric(12,4) NOT NULL,
    line_total_with_discount_incl_tax numeric(12,4) NOT NULL,
    variant_group_id integer,
    variant_options text,
    product_custom_options text,
    requested_data text
);
    DROP TABLE public.order_item;
       public         heap    postgres    false                       1259    17932    order_item_order_item_id_seq    SEQUENCE     �   ALTER TABLE public.order_item ALTER COLUMN order_item_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.order_item_order_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    269                       1259    17880    order_order_id_seq    SEQUENCE     �   ALTER TABLE public."order" ALTER COLUMN order_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.order_order_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    263                       1259    17951    payment_transaction    TABLE     �  CREATE TABLE public.payment_transaction (
    payment_transaction_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    payment_transaction_order_id integer NOT NULL,
    transaction_id character varying,
    transaction_type character varying NOT NULL,
    amount numeric(12,4) NOT NULL,
    parent_transaction_id character varying,
    payment_action character varying,
    additional_information text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
 '   DROP TABLE public.payment_transaction;
       public         heap    postgres    false                       1259    17950 .   payment_transaction_payment_transaction_id_seq    SEQUENCE     	  ALTER TABLE public.payment_transaction ALTER COLUMN payment_transaction_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.payment_transaction_payment_transaction_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    271            �            1259    17530    product    TABLE       CREATE TABLE public.product (
    product_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying DEFAULT 'simple'::character varying NOT NULL,
    variant_group_id integer,
    visibility boolean DEFAULT true NOT NULL,
    group_id integer DEFAULT 1,
    sku character varying NOT NULL,
    price numeric(12,4) NOT NULL,
    weight numeric(12,4) DEFAULT NULL::numeric,
    tax_class smallint,
    status boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    category_id integer,
    CONSTRAINT "UNSIGNED_PRICE" CHECK ((price >= (0)::numeric)),
    CONSTRAINT "UNSIGNED_WEIGHT" CHECK ((weight >= (0)::numeric))
);
    DROP TABLE public.product;
       public         heap    postgres    false            �            1259    17564    product_attribute_value_index    TABLE     �   CREATE TABLE public.product_attribute_value_index (
    product_attribute_value_index_id integer NOT NULL,
    product_id integer NOT NULL,
    attribute_id integer NOT NULL,
    option_id integer,
    option_text text
);
 1   DROP TABLE public.product_attribute_value_index;
       public         heap    postgres    false            �            1259    17563 ?   product_attribute_value_index_product_attribute_value_index_seq    SEQUENCE     .  ALTER TABLE public.product_attribute_value_index ALTER COLUMN product_attribute_value_index_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.product_attribute_value_index_product_attribute_value_index_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    235            �            1259    17731    product_collection    TABLE     �   CREATE TABLE public.product_collection (
    product_collection_id integer NOT NULL,
    collection_id integer NOT NULL,
    product_id integer NOT NULL
);
 &   DROP TABLE public.product_collection;
       public         heap    postgres    false            �            1259    17730 ,   product_collection_product_collection_id_seq    SEQUENCE       ALTER TABLE public.product_collection ALTER COLUMN product_collection_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.product_collection_product_collection_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    251            �            1259    17595    product_custom_option    TABLE     f  CREATE TABLE public.product_custom_option (
    product_custom_option_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    product_custom_option_product_id integer NOT NULL,
    option_name character varying NOT NULL,
    option_type character varying NOT NULL,
    is_required boolean DEFAULT false NOT NULL,
    sort_order integer
);
 )   DROP TABLE public.product_custom_option;
       public         heap    postgres    false            �            1259    17594 2   product_custom_option_product_custom_option_id_seq    SEQUENCE       ALTER TABLE public.product_custom_option ALTER COLUMN product_custom_option_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.product_custom_option_product_custom_option_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    237            �            1259    17613    product_custom_option_value    TABLE     .  CREATE TABLE public.product_custom_option_value (
    product_custom_option_value_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    option_id integer NOT NULL,
    extra_price numeric(12,4) DEFAULT NULL::numeric,
    sort_order integer,
    value character varying NOT NULL
);
 /   DROP TABLE public.product_custom_option_value;
       public         heap    postgres    false            �            1259    17612 >   product_custom_option_value_product_custom_option_value_id_seq    SEQUENCE     )  ALTER TABLE public.product_custom_option_value ALTER COLUMN product_custom_option_value_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.product_custom_option_value_product_custom_option_value_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    239            �            1259    17631    product_description    TABLE     U  CREATE TABLE public.product_description (
    product_description_id integer NOT NULL,
    product_description_product_id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    short_description text,
    url_key character varying NOT NULL,
    meta_title text,
    meta_description text,
    meta_keywords text
);
 '   DROP TABLE public.product_description;
       public         heap    postgres    false            �            1259    17630 .   product_description_product_description_id_seq    SEQUENCE     	  ALTER TABLE public.product_description ALTER COLUMN product_description_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.product_description_product_description_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    241            �            1259    17649    product_image    TABLE       CREATE TABLE public.product_image (
    product_image_id integer NOT NULL,
    product_image_product_id integer NOT NULL,
    origin_image character varying NOT NULL,
    thumb_image text,
    listing_image text,
    single_image text,
    is_main boolean DEFAULT false
);
 !   DROP TABLE public.product_image;
       public         heap    postgres    false            �            1259    17648 "   product_image_product_image_id_seq    SEQUENCE     �   ALTER TABLE public.product_image ALTER COLUMN product_image_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.product_image_product_image_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    243            �            1259    17802    product_inventory    TABLE       CREATE TABLE public.product_inventory (
    product_inventory_id integer NOT NULL,
    product_inventory_product_id integer NOT NULL,
    qty integer DEFAULT 0 NOT NULL,
    manage_stock boolean DEFAULT false NOT NULL,
    stock_availability boolean DEFAULT false NOT NULL
);
 %   DROP TABLE public.product_inventory;
       public         heap    postgres    false            �            1259    17801 *   product_inventory_product_inventory_id_seq    SEQUENCE       ALTER TABLE public.product_inventory ALTER COLUMN product_inventory_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.product_inventory_product_inventory_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    255            �            1259    17529    product_product_id_seq    SEQUENCE     �   ALTER TABLE public.product ALTER COLUMN product_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.product_product_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    233            '           1259    18184    reset_password_token    TABLE     �   CREATE TABLE public.reset_password_token (
    reset_password_token_id integer NOT NULL,
    customer_id integer NOT NULL,
    token text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
 (   DROP TABLE public.reset_password_token;
       public         heap    postgres    false            &           1259    18183 0   reset_password_token_reset_password_token_id_seq    SEQUENCE       ALTER TABLE public.reset_password_token ALTER COLUMN reset_password_token_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.reset_password_token_reset_password_token_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    295            �            1259    17396    session    TABLE     �   CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);
    DROP TABLE public.session;
       public         heap    postgres    false            +           1259    18261    setting    TABLE     �   CREATE TABLE public.setting (
    setting_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    value text,
    is_json boolean DEFAULT false NOT NULL
);
    DROP TABLE public.setting;
       public         heap    postgres    false            *           1259    18260    setting_setting_id_seq    SEQUENCE     �   ALTER TABLE public.setting ALTER COLUMN setting_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.setting_setting_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    299                       1259    17971    shipment    TABLE     i  CREATE TABLE public.shipment (
    shipment_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    shipment_order_id integer NOT NULL,
    carrier character varying,
    tracking_number character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.shipment;
       public         heap    postgres    false                       1259    17970    shipment_shipment_id_seq    SEQUENCE     �   ALTER TABLE public.shipment ALTER COLUMN shipment_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.shipment_shipment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    273                       1259    18028    shipping_method    TABLE     �   CREATE TABLE public.shipping_method (
    shipping_method_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL
);
 #   DROP TABLE public.shipping_method;
       public         heap    postgres    false                       1259    18027 &   shipping_method_shipping_method_id_seq    SEQUENCE     �   ALTER TABLE public.shipping_method ALTER COLUMN shipping_method_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.shipping_method_shipping_method_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    279                       1259    17992    shipping_zone    TABLE     �   CREATE TABLE public.shipping_zone (
    shipping_zone_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    country character varying NOT NULL
);
 !   DROP TABLE public.shipping_zone;
       public         heap    postgres    false                       1259    18041    shipping_zone_method    TABLE     �  CREATE TABLE public.shipping_zone_method (
    shipping_zone_method_id integer NOT NULL,
    method_id integer NOT NULL,
    zone_id integer NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    cost numeric(12,4) DEFAULT NULL::numeric,
    calculate_api character varying,
    condition_type character varying,
    max numeric(12,4) DEFAULT NULL::numeric,
    min numeric(12,4) DEFAULT NULL::numeric,
    price_based_cost jsonb,
    weight_based_cost jsonb
);
 (   DROP TABLE public.shipping_zone_method;
       public         heap    postgres    false                       1259    18040 0   shipping_zone_method_shipping_zone_method_id_seq    SEQUENCE       ALTER TABLE public.shipping_zone_method ALTER COLUMN shipping_zone_method_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.shipping_zone_method_shipping_zone_method_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    281                       1259    18009    shipping_zone_province    TABLE     �   CREATE TABLE public.shipping_zone_province (
    shipping_zone_province_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    zone_id integer NOT NULL,
    province character varying NOT NULL
);
 *   DROP TABLE public.shipping_zone_province;
       public         heap    postgres    false                       1259    18008 4   shipping_zone_province_shipping_zone_province_id_seq    SEQUENCE       ALTER TABLE public.shipping_zone_province ALTER COLUMN shipping_zone_province_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.shipping_zone_province_shipping_zone_province_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    277                       1259    17991 "   shipping_zone_shipping_zone_id_seq    SEQUENCE     �   ALTER TABLE public.shipping_zone ALTER COLUMN shipping_zone_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.shipping_zone_shipping_zone_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    275            -           1259    18275 	   tax_class    TABLE     �   CREATE TABLE public.tax_class (
    tax_class_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL
);
    DROP TABLE public.tax_class;
       public         heap    postgres    false            ,           1259    18274    tax_class_tax_class_id_seq    SEQUENCE     �   ALTER TABLE public.tax_class ALTER COLUMN tax_class_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tax_class_tax_class_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    301            /           1259    18293    tax_rate    TABLE     v  CREATE TABLE public.tax_rate (
    tax_rate_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    tax_class_id integer,
    country character varying DEFAULT '*'::character varying NOT NULL,
    province character varying DEFAULT '*'::character varying NOT NULL,
    postcode character varying DEFAULT '*'::character varying NOT NULL,
    rate numeric(12,4) NOT NULL,
    is_compound boolean DEFAULT false NOT NULL,
    priority integer NOT NULL,
    CONSTRAINT "UNSIGNED_PRIORITY" CHECK ((priority >= 0)),
    CONSTRAINT "UNSIGNED_RATE" CHECK ((rate >= (0)::numeric))
);
    DROP TABLE public.tax_rate;
       public         heap    postgres    false            .           1259    18292    tax_rate_tax_rate_id_seq    SEQUENCE     �   ALTER TABLE public.tax_rate ALTER COLUMN tax_rate_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tax_rate_tax_rate_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    303            �            1259    17779    url_rewrite    TABLE     $  CREATE TABLE public.url_rewrite (
    url_rewrite_id integer NOT NULL,
    language character varying DEFAULT 'en'::character varying NOT NULL,
    request_path character varying NOT NULL,
    target_path character varying NOT NULL,
    entity_uuid uuid,
    entity_type character varying
);
    DROP TABLE public.url_rewrite;
       public         heap    postgres    false            �            1259    17778    url_rewrite_url_rewrite_id_seq    SEQUENCE     �   ALTER TABLE public.url_rewrite ALTER COLUMN url_rewrite_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.url_rewrite_url_rewrite_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    253            �            1259    17484    variant_group    TABLE     b  CREATE TABLE public.variant_group (
    variant_group_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    attribute_group_id integer NOT NULL,
    attribute_one integer,
    attribute_two integer,
    attribute_three integer,
    attribute_four integer,
    attribute_five integer,
    visibility boolean DEFAULT false NOT NULL
);
 !   DROP TABLE public.variant_group;
       public         heap    postgres    false            �            1259    17483 "   variant_group_variant_group_id_seq    SEQUENCE     �   ALTER TABLE public.variant_group ALTER COLUMN variant_group_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.variant_group_variant_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    231                       1259    18103    widget    TABLE       CREATE TABLE public.widget (
    widget_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    route jsonb DEFAULT '[]'::jsonb NOT NULL,
    area jsonb DEFAULT '[]'::jsonb NOT NULL,
    sort_order integer DEFAULT 1 NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    status boolean,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.widget;
       public         heap    postgres    false                       1259    18102    widget_widget_id_seq    SEQUENCE     �   ALTER TABLE public.widget ALTER COLUMN widget_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.widget_widget_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    287            �          0    17354 
   admin_user 
   TABLE DATA           u   COPY public.admin_user (admin_user_id, uuid, status, email, password, full_name, created_at, updated_at) FROM stdin;
    public          postgres    false    216   jy      �          0    17417 	   attribute 
   TABLE DATA           �   COPY public.attribute (attribute_id, uuid, attribute_code, attribute_name, type, is_required, display_on_frontend, sort_order, is_filterable) FROM stdin;
    public          postgres    false    223    z      �          0    17451    attribute_group 
   TABLE DATA           g   COPY public.attribute_group (attribute_group_id, uuid, group_name, created_at, updated_at) FROM stdin;
    public          postgres    false    227   �z      �          0    17464    attribute_group_link 
   TABLE DATA           _   COPY public.attribute_group_link (attribute_group_link_id, attribute_id, group_id) FROM stdin;
    public          postgres    false    229   {      �          0    17434    attribute_option 
   TABLE DATA           p   COPY public.attribute_option (attribute_option_id, uuid, attribute_id, attribute_code, option_text) FROM stdin;
    public          postgres    false    225   -{      �          0    17826    cart 
   TABLE DATA           U  COPY public.cart (cart_id, uuid, sid, currency, customer_id, customer_group_id, customer_email, customer_full_name, user_ip, status, coupon, shipping_fee_excl_tax, shipping_fee_incl_tax, discount_amount, sub_total, sub_total_incl_tax, sub_total_with_discount, sub_total_with_discount_incl_tax, total_qty, total_weight, tax_amount, tax_amount_before_discount, shipping_tax_amount, grand_total, shipping_method, shipping_method_name, shipping_zone_id, shipping_address_id, payment_method, payment_method_name, billing_address_id, shipping_note, created_at, updated_at, total_tax_amount) FROM stdin;
    public          postgres    false    257   |      �          0    17844    cart_address 
   TABLE DATA           �   COPY public.cart_address (cart_address_id, uuid, full_name, postcode, telephone, country, province, city, address_1, address_2) FROM stdin;
    public          postgres    false    259   �}      �          0    17855 	   cart_item 
   TABLE DATA           �  COPY public.cart_item (cart_item_id, uuid, cart_id, product_id, product_sku, product_name, thumbnail, product_weight, product_price, product_price_incl_tax, qty, final_price, final_price_incl_tax, tax_percent, tax_amount, tax_amount_before_discount, discount_amount, line_total, line_total_with_discount, line_total_incl_tax, line_total_with_discount_incl_tax, variant_group_id, variant_options, product_custom_options, created_at, updated_at) FROM stdin;
    public          postgres    false    261   �      �          0    17666    category 
   TABLE DATA           �   COPY public.category (category_id, uuid, status, parent_id, include_in_nav, "position", show_products, created_at, updated_at) FROM stdin;
    public          postgres    false    245   $�      �          0    17698    category_description 
   TABLE DATA           �   COPY public.category_description (category_description_id, category_description_category_id, name, short_description, description, image, meta_title, meta_keywords, meta_description, url_key) FROM stdin;
    public          postgres    false    247   ��      �          0    18072    cms_page 
   TABLE DATA           U   COPY public.cms_page (cms_page_id, uuid, status, created_at, updated_at) FROM stdin;
    public          postgres    false    283   6�      �          0    18085    cms_page_description 
   TABLE DATA           �   COPY public.cms_page_description (cms_page_description_id, cms_page_description_cms_page_id, url_key, name, content, meta_title, meta_keywords, meta_description) FROM stdin;
    public          postgres    false    285   ��      �          0    17716 
   collection 
   TABLE DATA           j   COPY public.collection (collection_id, uuid, name, description, code, created_at, updated_at) FROM stdin;
    public          postgres    false    249   �                0    18206    coupon 
   TABLE DATA           #  COPY public.coupon (coupon_id, uuid, status, description, discount_amount, free_shipping, discount_type, coupon, used_time, target_products, condition, user_condition, buyx_gety, max_uses_time_per_coupon, max_uses_time_per_customer, start_date, end_date, created_at, updated_at) FROM stdin;
    public          postgres    false    297   ��                0    18132    customer 
   TABLE DATA           {   COPY public.customer (customer_id, uuid, status, group_id, email, password, full_name, created_at, updated_at) FROM stdin;
    public          postgres    false    291   [�                0    18155    customer_address 
   TABLE DATA           �   COPY public.customer_address (customer_address_id, uuid, customer_id, full_name, telephone, address_1, address_2, postcode, city, province, country, created_at, updated_at, is_default) FROM stdin;
    public          postgres    false    293   }�                 0    18121    customer_group 
   TABLE DATA           e   COPY public.customer_group (customer_group_id, uuid, group_name, created_at, updated_at) FROM stdin;
    public          postgres    false    289   �      �          0    17405    event 
   TABLE DATA           G   COPY public.event (event_id, uuid, name, data, created_at) FROM stdin;
    public          postgres    false    221   y�      �          0    17370 	   migration 
   TABLE DATA           Z   COPY public.migration (migration_id, module, version, created_at, updated_at) FROM stdin;
    public          postgres    false    218   ��      �          0    17881    order 
   TABLE DATA           �  COPY public."order" (order_id, uuid, integration_order_id, sid, order_number, status, cart_id, currency, customer_id, customer_email, customer_full_name, user_ip, user_agent, coupon, shipping_fee_excl_tax, shipping_fee_incl_tax, discount_amount, sub_total, sub_total_incl_tax, sub_total_with_discount, sub_total_with_discount_incl_tax, total_qty, total_weight, tax_amount, tax_amount_before_discount, shipping_tax_amount, shipping_note, grand_total, shipping_method, shipping_method_name, shipping_address_id, payment_method, payment_method_name, billing_address_id, shipment_status, payment_status, created_at, updated_at, total_tax_amount) FROM stdin;
    public          postgres    false    263   ��      �          0    17902    order_activity 
   TABLE DATA           �   COPY public.order_activity (order_activity_id, uuid, order_activity_order_id, comment, customer_notified, created_at, updated_at) FROM stdin;
    public          postgres    false    265   ��      �          0    17922    order_address 
   TABLE DATA           �   COPY public.order_address (order_address_id, uuid, full_name, postcode, telephone, country, province, city, address_1, address_2) FROM stdin;
    public          postgres    false    267   %�      �          0    17933 
   order_item 
   TABLE DATA           �  COPY public.order_item (order_item_id, uuid, order_item_order_id, product_id, referer, product_sku, product_name, thumbnail, product_weight, product_price, product_price_incl_tax, qty, final_price, final_price_incl_tax, tax_percent, tax_amount, tax_amount_before_discount, discount_amount, line_total, line_total_with_discount, line_total_incl_tax, line_total_with_discount_incl_tax, variant_group_id, variant_options, product_custom_options, requested_data) FROM stdin;
    public          postgres    false    269   �      �          0    17951    payment_transaction 
   TABLE DATA           �   COPY public.payment_transaction (payment_transaction_id, uuid, payment_transaction_order_id, transaction_id, transaction_type, amount, parent_transaction_id, payment_action, additional_information, created_at) FROM stdin;
    public          postgres    false    271   ��      �          0    17530    product 
   TABLE DATA           �   COPY public.product (product_id, uuid, type, variant_group_id, visibility, group_id, sku, price, weight, tax_class, status, created_at, updated_at, category_id) FROM stdin;
    public          postgres    false    233   r�      �          0    17564    product_attribute_value_index 
   TABLE DATA           �   COPY public.product_attribute_value_index (product_attribute_value_index_id, product_id, attribute_id, option_id, option_text) FROM stdin;
    public          postgres    false    235   ~�      �          0    17731    product_collection 
   TABLE DATA           ^   COPY public.product_collection (product_collection_id, collection_id, product_id) FROM stdin;
    public          postgres    false    251   ��      �          0    17595    product_custom_option 
   TABLE DATA           �   COPY public.product_custom_option (product_custom_option_id, uuid, product_custom_option_product_id, option_name, option_type, is_required, sort_order) FROM stdin;
    public          postgres    false    237   ̖      �          0    17613    product_custom_option_value 
   TABLE DATA           �   COPY public.product_custom_option_value (product_custom_option_value_id, uuid, option_id, extra_price, sort_order, value) FROM stdin;
    public          postgres    false    239   �      �          0    17631    product_description 
   TABLE DATA           �   COPY public.product_description (product_description_id, product_description_product_id, name, description, short_description, url_key, meta_title, meta_description, meta_keywords) FROM stdin;
    public          postgres    false    241   �      �          0    17649    product_image 
   TABLE DATA           �   COPY public.product_image (product_image_id, product_image_product_id, origin_image, thumb_image, listing_image, single_image, is_main) FROM stdin;
    public          postgres    false    243   ��      �          0    17802    product_inventory 
   TABLE DATA           �   COPY public.product_inventory (product_inventory_id, product_inventory_product_id, qty, manage_stock, stock_availability) FROM stdin;
    public          postgres    false    255   ��                0    18184    reset_password_token 
   TABLE DATA           g   COPY public.reset_password_token (reset_password_token_id, customer_id, token, created_at) FROM stdin;
    public          postgres    false    295   ��      �          0    17396    session 
   TABLE DATA           4   COPY public.session (sid, sess, expire) FROM stdin;
    public          postgres    false    219   �      
          0    18261    setting 
   TABLE DATA           I   COPY public.setting (setting_id, uuid, name, value, is_json) FROM stdin;
    public          postgres    false    299   B�      �          0    17971    shipment 
   TABLE DATA           z   COPY public.shipment (shipment_id, uuid, shipment_order_id, carrier, tracking_number, created_at, updated_at) FROM stdin;
    public          postgres    false    273   ��      �          0    18028    shipping_method 
   TABLE DATA           I   COPY public.shipping_method (shipping_method_id, uuid, name) FROM stdin;
    public          postgres    false    279   S�      �          0    17992    shipping_zone 
   TABLE DATA           N   COPY public.shipping_zone (shipping_zone_id, uuid, name, country) FROM stdin;
    public          postgres    false    275   ��      �          0    18041    shipping_zone_method 
   TABLE DATA           �   COPY public.shipping_zone_method (shipping_zone_method_id, method_id, zone_id, is_enabled, cost, calculate_api, condition_type, max, min, price_based_cost, weight_based_cost) FROM stdin;
    public          postgres    false    281   �      �          0    18009    shipping_zone_province 
   TABLE DATA           d   COPY public.shipping_zone_province (shipping_zone_province_id, uuid, zone_id, province) FROM stdin;
    public          postgres    false    277   k�                0    18275 	   tax_class 
   TABLE DATA           =   COPY public.tax_class (tax_class_id, uuid, name) FROM stdin;
    public          postgres    false    301   ף                0    18293    tax_rate 
   TABLE DATA           �   COPY public.tax_rate (tax_rate_id, uuid, name, tax_class_id, country, province, postcode, rate, is_compound, priority) FROM stdin;
    public          postgres    false    303   '�      �          0    17779    url_rewrite 
   TABLE DATA           t   COPY public.url_rewrite (url_rewrite_id, language, request_path, target_path, entity_uuid, entity_type) FROM stdin;
    public          postgres    false    253   {�      �          0    17484    variant_group 
   TABLE DATA           �   COPY public.variant_group (variant_group_id, uuid, attribute_group_id, attribute_one, attribute_two, attribute_three, attribute_four, attribute_five, visibility) FROM stdin;
    public          postgres    false    231   ��      �          0    18103    widget 
   TABLE DATA           �   COPY public.widget (widget_id, uuid, name, type, route, area, sort_order, settings, status, created_at, updated_at) FROM stdin;
    public          postgres    false    287   ֥                 0    0    admin_user_admin_user_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public.admin_user_admin_user_id_seq', 1, true);
          public          postgres    false    215                       0    0    attribute_attribute_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.attribute_attribute_id_seq', 2, true);
          public          postgres    false    222                       0    0 &   attribute_group_attribute_group_id_seq    SEQUENCE SET     T   SELECT pg_catalog.setval('public.attribute_group_attribute_group_id_seq', 1, true);
          public          postgres    false    226                       0    0 0   attribute_group_link_attribute_group_link_id_seq    SEQUENCE SET     ^   SELECT pg_catalog.setval('public.attribute_group_link_attribute_group_link_id_seq', 2, true);
          public          postgres    false    228                       0    0 (   attribute_option_attribute_option_id_seq    SEQUENCE SET     V   SELECT pg_catalog.setval('public.attribute_option_attribute_option_id_seq', 6, true);
          public          postgres    false    224                       0    0     cart_address_cart_address_id_seq    SEQUENCE SET     O   SELECT pg_catalog.setval('public.cart_address_cart_address_id_seq', 15, true);
          public          postgres    false    258                       0    0    cart_cart_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public.cart_cart_id_seq', 5, true);
          public          postgres    false    256                       0    0    cart_item_cart_item_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.cart_item_cart_item_id_seq', 7, true);
          public          postgres    false    260                       0    0    category_category_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.category_category_id_seq', 4, true);
          public          postgres    false    244                       0    0 0   category_description_category_description_id_seq    SEQUENCE SET     ^   SELECT pg_catalog.setval('public.category_description_category_description_id_seq', 4, true);
          public          postgres    false    246                       0    0    cms_page_cms_page_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.cms_page_cms_page_id_seq', 1, true);
          public          postgres    false    282                        0    0 0   cms_page_description_cms_page_description_id_seq    SEQUENCE SET     ^   SELECT pg_catalog.setval('public.cms_page_description_cms_page_description_id_seq', 1, true);
          public          postgres    false    284            !           0    0    collection_collection_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public.collection_collection_id_seq', 2, true);
          public          postgres    false    248            "           0    0    coupon_coupon_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.coupon_coupon_id_seq', 1, true);
          public          postgres    false    296            #           0    0 (   customer_address_customer_address_id_seq    SEQUENCE SET     V   SELECT pg_catalog.setval('public.customer_address_customer_address_id_seq', 1, true);
          public          postgres    false    292            $           0    0    customer_customer_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.customer_customer_id_seq', 2, true);
          public          postgres    false    290            %           0    0 $   customer_group_customer_group_id_seq    SEQUENCE SET     R   SELECT pg_catalog.setval('public.customer_group_customer_group_id_seq', 1, true);
          public          postgres    false    288            &           0    0    event_event_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public.event_event_id_seq', 63, true);
          public          postgres    false    220            '           0    0    migration_migration_id_seq    SEQUENCE SET     I   SELECT pg_catalog.setval('public.migration_migration_id_seq', 31, true);
          public          postgres    false    217            (           0    0 $   order_activity_order_activity_id_seq    SEQUENCE SET     R   SELECT pg_catalog.setval('public.order_activity_order_activity_id_seq', 5, true);
          public          postgres    false    264            )           0    0 "   order_address_order_address_id_seq    SEQUENCE SET     P   SELECT pg_catalog.setval('public.order_address_order_address_id_seq', 4, true);
          public          postgres    false    266            *           0    0    order_item_order_item_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public.order_item_order_item_id_seq', 2, true);
          public          postgres    false    268            +           0    0    order_order_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.order_order_id_seq', 2, true);
          public          postgres    false    262            ,           0    0 .   payment_transaction_payment_transaction_id_seq    SEQUENCE SET     \   SELECT pg_catalog.setval('public.payment_transaction_payment_transaction_id_seq', 1, true);
          public          postgres    false    270            -           0    0 ?   product_attribute_value_index_product_attribute_value_index_seq    SEQUENCE SET     m   SELECT pg_catalog.setval('public.product_attribute_value_index_product_attribute_value_index_seq', 2, true);
          public          postgres    false    234            .           0    0 ,   product_collection_product_collection_id_seq    SEQUENCE SET     Z   SELECT pg_catalog.setval('public.product_collection_product_collection_id_seq', 5, true);
          public          postgres    false    250            /           0    0 2   product_custom_option_product_custom_option_id_seq    SEQUENCE SET     a   SELECT pg_catalog.setval('public.product_custom_option_product_custom_option_id_seq', 1, false);
          public          postgres    false    236            0           0    0 >   product_custom_option_value_product_custom_option_value_id_seq    SEQUENCE SET     m   SELECT pg_catalog.setval('public.product_custom_option_value_product_custom_option_value_id_seq', 1, false);
          public          postgres    false    238            1           0    0 .   product_description_product_description_id_seq    SEQUENCE SET     \   SELECT pg_catalog.setval('public.product_description_product_description_id_seq', 6, true);
          public          postgres    false    240            2           0    0 "   product_image_product_image_id_seq    SEQUENCE SET     P   SELECT pg_catalog.setval('public.product_image_product_image_id_seq', 5, true);
          public          postgres    false    242            3           0    0 *   product_inventory_product_inventory_id_seq    SEQUENCE SET     X   SELECT pg_catalog.setval('public.product_inventory_product_inventory_id_seq', 6, true);
          public          postgres    false    254            4           0    0    product_product_id_seq    SEQUENCE SET     D   SELECT pg_catalog.setval('public.product_product_id_seq', 6, true);
          public          postgres    false    232            5           0    0 0   reset_password_token_reset_password_token_id_seq    SEQUENCE SET     _   SELECT pg_catalog.setval('public.reset_password_token_reset_password_token_id_seq', 1, false);
          public          postgres    false    294            6           0    0    setting_setting_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.setting_setting_id_seq', 74, true);
          public          postgres    false    298            7           0    0    shipment_shipment_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.shipment_shipment_id_seq', 1, true);
          public          postgres    false    272            8           0    0 &   shipping_method_shipping_method_id_seq    SEQUENCE SET     T   SELECT pg_catalog.setval('public.shipping_method_shipping_method_id_seq', 1, true);
          public          postgres    false    278            9           0    0 0   shipping_zone_method_shipping_zone_method_id_seq    SEQUENCE SET     ^   SELECT pg_catalog.setval('public.shipping_zone_method_shipping_zone_method_id_seq', 2, true);
          public          postgres    false    280            :           0    0 4   shipping_zone_province_shipping_zone_province_id_seq    SEQUENCE SET     b   SELECT pg_catalog.setval('public.shipping_zone_province_shipping_zone_province_id_seq', 3, true);
          public          postgres    false    276            ;           0    0 "   shipping_zone_shipping_zone_id_seq    SEQUENCE SET     P   SELECT pg_catalog.setval('public.shipping_zone_shipping_zone_id_seq', 2, true);
          public          postgres    false    274            <           0    0    tax_class_tax_class_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.tax_class_tax_class_id_seq', 1, true);
          public          postgres    false    300            =           0    0    tax_rate_tax_rate_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.tax_rate_tax_rate_id_seq', 1, true);
          public          postgres    false    302            >           0    0    url_rewrite_url_rewrite_id_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public.url_rewrite_url_rewrite_id_seq', 48, true);
          public          postgres    false    252            ?           0    0 "   variant_group_variant_group_id_seq    SEQUENCE SET     Q   SELECT pg_catalog.setval('public.variant_group_variant_group_id_seq', 1, false);
          public          postgres    false    230            @           0    0    widget_widget_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.widget_widget_id_seq', 5, true);
          public          postgres    false    286            �           2606    17366 "   admin_user ADMIN_USER_EMAIL_UNIQUE 
   CONSTRAINT     `   ALTER TABLE ONLY public.admin_user
    ADD CONSTRAINT "ADMIN_USER_EMAIL_UNIQUE" UNIQUE (email);
 N   ALTER TABLE ONLY public.admin_user DROP CONSTRAINT "ADMIN_USER_EMAIL_UNIQUE";
       public            postgres    false    216            �           2606    17368 !   admin_user ADMIN_USER_UUID_UNIQUE 
   CONSTRAINT     ^   ALTER TABLE ONLY public.admin_user
    ADD CONSTRAINT "ADMIN_USER_UUID_UNIQUE" UNIQUE (uuid);
 M   ALTER TABLE ONLY public.admin_user DROP CONSTRAINT "ADMIN_USER_UUID_UNIQUE";
       public            postgres    false    216                       2606    17430    attribute ATTRIBUTE_CODE_UNIQUE 
   CONSTRAINT     f   ALTER TABLE ONLY public.attribute
    ADD CONSTRAINT "ATTRIBUTE_CODE_UNIQUE" UNIQUE (attribute_code);
 K   ALTER TABLE ONLY public.attribute DROP CONSTRAINT "ATTRIBUTE_CODE_UNIQUE";
       public            postgres    false    223            
           2606    17432 $   attribute ATTRIBUTE_CODE_UUID_UNIQUE 
   CONSTRAINT     a   ALTER TABLE ONLY public.attribute
    ADD CONSTRAINT "ATTRIBUTE_CODE_UUID_UNIQUE" UNIQUE (uuid);
 P   ALTER TABLE ONLY public.attribute DROP CONSTRAINT "ATTRIBUTE_CODE_UUID_UNIQUE";
       public            postgres    false    223                       2606    17470 0   attribute_group_link ATTRIBUTE_GROUP_LINK_UNIQUE 
   CONSTRAINT        ALTER TABLE ONLY public.attribute_group_link
    ADD CONSTRAINT "ATTRIBUTE_GROUP_LINK_UNIQUE" UNIQUE (attribute_id, group_id);
 \   ALTER TABLE ONLY public.attribute_group_link DROP CONSTRAINT "ATTRIBUTE_GROUP_LINK_UNIQUE";
       public            postgres    false    229    229                       2606    17462 +   attribute_group ATTRIBUTE_GROUP_UUID_UNIQUE 
   CONSTRAINT     h   ALTER TABLE ONLY public.attribute_group
    ADD CONSTRAINT "ATTRIBUTE_GROUP_UUID_UNIQUE" UNIQUE (uuid);
 W   ALTER TABLE ONLY public.attribute_group DROP CONSTRAINT "ATTRIBUTE_GROUP_UUID_UNIQUE";
       public            postgres    false    227                       2606    17443 -   attribute_option ATTRIBUTE_OPTION_UUID_UNIQUE 
   CONSTRAINT     j   ALTER TABLE ONLY public.attribute_option
    ADD CONSTRAINT "ATTRIBUTE_OPTION_UUID_UNIQUE" UNIQUE (uuid);
 Y   ALTER TABLE ONLY public.attribute_option DROP CONSTRAINT "ATTRIBUTE_OPTION_UUID_UNIQUE";
       public            postgres    false    225            o           2606    17853 %   cart_address CART_ADDRESS_UUID_UNIQUE 
   CONSTRAINT     b   ALTER TABLE ONLY public.cart_address
    ADD CONSTRAINT "CART_ADDRESS_UUID_UNIQUE" UNIQUE (uuid);
 Q   ALTER TABLE ONLY public.cart_address DROP CONSTRAINT "CART_ADDRESS_UUID_UNIQUE";
       public            postgres    false    259            s           2606    17867    cart_item CART_ITEM_UUID_UNIQUE 
   CONSTRAINT     \   ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT "CART_ITEM_UUID_UNIQUE" UNIQUE (uuid);
 K   ALTER TABLE ONLY public.cart_item DROP CONSTRAINT "CART_ITEM_UUID_UNIQUE";
       public            postgres    false    261            j           2606    17842    cart CART_UUID_UNIQUE 
   CONSTRAINT     R   ALTER TABLE ONLY public.cart
    ADD CONSTRAINT "CART_UUID_UNIQUE" UNIQUE (uuid);
 A   ALTER TABLE ONLY public.cart DROP CONSTRAINT "CART_UUID_UNIQUE";
       public            postgres    false    257            O           2606    17706 '   category_description CATEGORY_ID_UNIQUE 
   CONSTRAINT     �   ALTER TABLE ONLY public.category_description
    ADD CONSTRAINT "CATEGORY_ID_UNIQUE" UNIQUE (category_description_category_id);
 S   ALTER TABLE ONLY public.category_description DROP CONSTRAINT "CATEGORY_ID_UNIQUE";
       public            postgres    false    247            Q           2606    17708 ,   category_description CATEGORY_URL_KEY_UNIQUE 
   CONSTRAINT     l   ALTER TABLE ONLY public.category_description
    ADD CONSTRAINT "CATEGORY_URL_KEY_UNIQUE" UNIQUE (url_key);
 X   ALTER TABLE ONLY public.category_description DROP CONSTRAINT "CATEGORY_URL_KEY_UNIQUE";
       public            postgres    false    247            K           2606    17676    category CATEGORY_UUID_UNIQUE 
   CONSTRAINT     Z   ALTER TABLE ONLY public.category
    ADD CONSTRAINT "CATEGORY_UUID_UNIQUE" UNIQUE (uuid);
 I   ALTER TABLE ONLY public.category DROP CONSTRAINT "CATEGORY_UUID_UNIQUE";
       public            postgres    false    245            �           2606    18083    cms_page CMS_PAGE_UUID 
   CONSTRAINT     S   ALTER TABLE ONLY public.cms_page
    ADD CONSTRAINT "CMS_PAGE_UUID" UNIQUE (uuid);
 B   ALTER TABLE ONLY public.cms_page DROP CONSTRAINT "CMS_PAGE_UUID";
       public            postgres    false    283            V           2606    17727 !   collection COLLECTION_CODE_UNIQUE 
   CONSTRAINT     ^   ALTER TABLE ONLY public.collection
    ADD CONSTRAINT "COLLECTION_CODE_UNIQUE" UNIQUE (code);
 M   ALTER TABLE ONLY public.collection DROP CONSTRAINT "COLLECTION_CODE_UNIQUE";
       public            postgres    false    249            X           2606    17729 !   collection COLLECTION_UUID_UNIQUE 
   CONSTRAINT     ^   ALTER TABLE ONLY public.collection
    ADD CONSTRAINT "COLLECTION_UUID_UNIQUE" UNIQUE (uuid);
 M   ALTER TABLE ONLY public.collection DROP CONSTRAINT "COLLECTION_UUID_UNIQUE";
       public            postgres    false    249            �           2606    18225    coupon COUPON_UNIQUE 
   CONSTRAINT     S   ALTER TABLE ONLY public.coupon
    ADD CONSTRAINT "COUPON_UNIQUE" UNIQUE (coupon);
 @   ALTER TABLE ONLY public.coupon DROP CONSTRAINT "COUPON_UNIQUE";
       public            postgres    false    297            �           2606    18223    coupon COUPON_UUID_UNIQUE 
   CONSTRAINT     V   ALTER TABLE ONLY public.coupon
    ADD CONSTRAINT "COUPON_UUID_UNIQUE" UNIQUE (uuid);
 E   ALTER TABLE ONLY public.coupon DROP CONSTRAINT "COUPON_UUID_UNIQUE";
       public            postgres    false    297            �           2606    18166 -   customer_address CUSTOMER_ADDRESS_UUID_UNIQUE 
   CONSTRAINT     j   ALTER TABLE ONLY public.customer_address
    ADD CONSTRAINT "CUSTOMER_ADDRESS_UUID_UNIQUE" UNIQUE (uuid);
 Y   ALTER TABLE ONLY public.customer_address DROP CONSTRAINT "CUSTOMER_ADDRESS_UUID_UNIQUE";
       public            postgres    false    293            �           2606    18147    customer CUSTOMER_UUID_UNIQUE 
   CONSTRAINT     Z   ALTER TABLE ONLY public.customer
    ADD CONSTRAINT "CUSTOMER_UUID_UNIQUE" UNIQUE (uuid);
 I   ALTER TABLE ONLY public.customer DROP CONSTRAINT "CUSTOMER_UUID_UNIQUE";
       public            postgres    false    291            �           2606    18145    customer EMAIL_UNIQUE 
   CONSTRAINT     S   ALTER TABLE ONLY public.customer
    ADD CONSTRAINT "EMAIL_UNIQUE" UNIQUE (email);
 A   ALTER TABLE ONLY public.customer DROP CONSTRAINT "EMAIL_UNIQUE";
       public            postgres    false    291                       2606    17415    event EVENT_UUID 
   CONSTRAINT     M   ALTER TABLE ONLY public.event
    ADD CONSTRAINT "EVENT_UUID" UNIQUE (uuid);
 <   ALTER TABLE ONLY public.event DROP CONSTRAINT "EVENT_UUID";
       public            postgres    false    221            �           2606    18055 '   shipping_zone_method METHOD_ZONE_UNIQUE 
   CONSTRAINT     r   ALTER TABLE ONLY public.shipping_zone_method
    ADD CONSTRAINT "METHOD_ZONE_UNIQUE" UNIQUE (zone_id, method_id);
 S   ALTER TABLE ONLY public.shipping_zone_method DROP CONSTRAINT "METHOD_ZONE_UNIQUE";
       public            postgres    false    281    281            �           2606    17380    migration MODULE_UNIQUE 
   CONSTRAINT     V   ALTER TABLE ONLY public.migration
    ADD CONSTRAINT "MODULE_UNIQUE" UNIQUE (module);
 C   ALTER TABLE ONLY public.migration DROP CONSTRAINT "MODULE_UNIQUE";
       public            postgres    false    218            2           2606    17575 1   product_attribute_value_index OPTION_VALUE_UNIQUE 
   CONSTRAINT     �   ALTER TABLE ONLY public.product_attribute_value_index
    ADD CONSTRAINT "OPTION_VALUE_UNIQUE" UNIQUE (product_id, attribute_id, option_id);
 ]   ALTER TABLE ONLY public.product_attribute_value_index DROP CONSTRAINT "OPTION_VALUE_UNIQUE";
       public            postgres    false    235    235    235            �           2606    17914 )   order_activity ORDER_ACTIVITY_UUID_UNIQUE 
   CONSTRAINT     f   ALTER TABLE ONLY public.order_activity
    ADD CONSTRAINT "ORDER_ACTIVITY_UUID_UNIQUE" UNIQUE (uuid);
 U   ALTER TABLE ONLY public.order_activity DROP CONSTRAINT "ORDER_ACTIVITY_UUID_UNIQUE";
       public            postgres    false    265            �           2606    17931 '   order_address ORDER_ADDRESS_UUID_UNIQUE 
   CONSTRAINT     d   ALTER TABLE ONLY public.order_address
    ADD CONSTRAINT "ORDER_ADDRESS_UUID_UNIQUE" UNIQUE (uuid);
 S   ALTER TABLE ONLY public.order_address DROP CONSTRAINT "ORDER_ADDRESS_UUID_UNIQUE";
       public            postgres    false    267            �           2606    17943 !   order_item ORDER_ITEM_UUID_UNIQUE 
   CONSTRAINT     ^   ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT "ORDER_ITEM_UUID_UNIQUE" UNIQUE (uuid);
 M   ALTER TABLE ONLY public.order_item DROP CONSTRAINT "ORDER_ITEM_UUID_UNIQUE";
       public            postgres    false    269            y           2606    17900    order ORDER_NUMBER_UNIQUE 
   CONSTRAINT     `   ALTER TABLE ONLY public."order"
    ADD CONSTRAINT "ORDER_NUMBER_UNIQUE" UNIQUE (order_number);
 G   ALTER TABLE ONLY public."order" DROP CONSTRAINT "ORDER_NUMBER_UNIQUE";
       public            postgres    false    263            {           2606    17898    order ORDER_UUID_UNIQUE 
   CONSTRAINT     V   ALTER TABLE ONLY public."order"
    ADD CONSTRAINT "ORDER_UUID_UNIQUE" UNIQUE (uuid);
 E   ALTER TABLE ONLY public."order" DROP CONSTRAINT "ORDER_UUID_UNIQUE";
       public            postgres    false    263            �           2606    18093 #   cms_page_description PAGE_ID_UNIQUE 
   CONSTRAINT     |   ALTER TABLE ONLY public.cms_page_description
    ADD CONSTRAINT "PAGE_ID_UNIQUE" UNIQUE (cms_page_description_cms_page_id);
 O   ALTER TABLE ONLY public.cms_page_description DROP CONSTRAINT "PAGE_ID_UNIQUE";
       public            postgres    false    285            �           2606    17961 3   payment_transaction PAYMENT_TRANSACTION_UUID_UNIQUE 
   CONSTRAINT     p   ALTER TABLE ONLY public.payment_transaction
    ADD CONSTRAINT "PAYMENT_TRANSACTION_UUID_UNIQUE" UNIQUE (uuid);
 _   ALTER TABLE ONLY public.payment_transaction DROP CONSTRAINT "PAYMENT_TRANSACTION_UUID_UNIQUE";
       public            postgres    false    271            ^           2606    17737 ,   product_collection PRODUCT_COLLECTION_UNIQUE 
   CONSTRAINT     ~   ALTER TABLE ONLY public.product_collection
    ADD CONSTRAINT "PRODUCT_COLLECTION_UNIQUE" UNIQUE (collection_id, product_id);
 X   ALTER TABLE ONLY public.product_collection DROP CONSTRAINT "PRODUCT_COLLECTION_UNIQUE";
       public            postgres    false    251    251            7           2606    17605 7   product_custom_option PRODUCT_CUSTOM_OPTION_UUID_UNIQUE 
   CONSTRAINT     t   ALTER TABLE ONLY public.product_custom_option
    ADD CONSTRAINT "PRODUCT_CUSTOM_OPTION_UUID_UNIQUE" UNIQUE (uuid);
 c   ALTER TABLE ONLY public.product_custom_option DROP CONSTRAINT "PRODUCT_CUSTOM_OPTION_UUID_UNIQUE";
       public            postgres    false    237            <           2606    17623 C   product_custom_option_value PRODUCT_CUSTOM_OPTION_VALUE_UUID_UNIQUE 
   CONSTRAINT     �   ALTER TABLE ONLY public.product_custom_option_value
    ADD CONSTRAINT "PRODUCT_CUSTOM_OPTION_VALUE_UUID_UNIQUE" UNIQUE (uuid);
 o   ALTER TABLE ONLY public.product_custom_option_value DROP CONSTRAINT "PRODUCT_CUSTOM_OPTION_VALUE_UUID_UNIQUE";
       public            postgres    false    239            A           2606    17639 %   product_description PRODUCT_ID_UNIQUE 
   CONSTRAINT     |   ALTER TABLE ONLY public.product_description
    ADD CONSTRAINT "PRODUCT_ID_UNIQUE" UNIQUE (product_description_product_id);
 Q   ALTER TABLE ONLY public.product_description DROP CONSTRAINT "PRODUCT_ID_UNIQUE";
       public            postgres    false    241            f           2606    17811 5   product_inventory PRODUCT_INVENTORY_PRODUCT_ID_UNIQUE 
   CONSTRAINT     �   ALTER TABLE ONLY public.product_inventory
    ADD CONSTRAINT "PRODUCT_INVENTORY_PRODUCT_ID_UNIQUE" UNIQUE (product_inventory_product_id);
 a   ALTER TABLE ONLY public.product_inventory DROP CONSTRAINT "PRODUCT_INVENTORY_PRODUCT_ID_UNIQUE";
       public            postgres    false    255            )           2606    17550    product PRODUCT_SKU_UNIQUE 
   CONSTRAINT     V   ALTER TABLE ONLY public.product
    ADD CONSTRAINT "PRODUCT_SKU_UNIQUE" UNIQUE (sku);
 F   ALTER TABLE ONLY public.product DROP CONSTRAINT "PRODUCT_SKU_UNIQUE";
       public            postgres    false    233            D           2606    17641 *   product_description PRODUCT_URL_KEY_UNIQUE 
   CONSTRAINT     j   ALTER TABLE ONLY public.product_description
    ADD CONSTRAINT "PRODUCT_URL_KEY_UNIQUE" UNIQUE (url_key);
 V   ALTER TABLE ONLY public.product_description DROP CONSTRAINT "PRODUCT_URL_KEY_UNIQUE";
       public            postgres    false    241            +           2606    17548    product PRODUCT_UUID_UNIQUE 
   CONSTRAINT     X   ALTER TABLE ONLY public.product
    ADD CONSTRAINT "PRODUCT_UUID_UNIQUE" UNIQUE (uuid);
 G   ALTER TABLE ONLY public.product DROP CONSTRAINT "PRODUCT_UUID_UNIQUE";
       public            postgres    false    233                       2606    17402    session SESSION_PKEY 
   CONSTRAINT     U   ALTER TABLE ONLY public.session
    ADD CONSTRAINT "SESSION_PKEY" PRIMARY KEY (sid);
 @   ALTER TABLE ONLY public.session DROP CONSTRAINT "SESSION_PKEY";
       public            postgres    false    219            �           2606    18273    setting SETTING_NAME_UNIQUE 
   CONSTRAINT     X   ALTER TABLE ONLY public.setting
    ADD CONSTRAINT "SETTING_NAME_UNIQUE" UNIQUE (name);
 G   ALTER TABLE ONLY public.setting DROP CONSTRAINT "SETTING_NAME_UNIQUE";
       public            postgres    false    299            �           2606    18271    setting SETTING_UUID_UNIQUE 
   CONSTRAINT     X   ALTER TABLE ONLY public.setting
    ADD CONSTRAINT "SETTING_UUID_UNIQUE" UNIQUE (uuid);
 G   ALTER TABLE ONLY public.setting DROP CONSTRAINT "SETTING_UUID_UNIQUE";
       public            postgres    false    299            �           2606    17982    shipment SHIPMENT_UUID_UNIQUE 
   CONSTRAINT     Z   ALTER TABLE ONLY public.shipment
    ADD CONSTRAINT "SHIPMENT_UUID_UNIQUE" UNIQUE (uuid);
 I   ALTER TABLE ONLY public.shipment DROP CONSTRAINT "SHIPMENT_UUID_UNIQUE";
       public            postgres    false    273            �           2606    18039 +   shipping_method SHIPPING_METHOD_NAME_UNIQUE 
   CONSTRAINT     h   ALTER TABLE ONLY public.shipping_method
    ADD CONSTRAINT "SHIPPING_METHOD_NAME_UNIQUE" UNIQUE (name);
 W   ALTER TABLE ONLY public.shipping_method DROP CONSTRAINT "SHIPPING_METHOD_NAME_UNIQUE";
       public            postgres    false    279            �           2606    18037 +   shipping_method SHIPPING_METHOD_UUID_UNIQUE 
   CONSTRAINT     h   ALTER TABLE ONLY public.shipping_method
    ADD CONSTRAINT "SHIPPING_METHOD_UUID_UNIQUE" UNIQUE (uuid);
 W   ALTER TABLE ONLY public.shipping_method DROP CONSTRAINT "SHIPPING_METHOD_UUID_UNIQUE";
       public            postgres    false    279            �           2606    18020 =   shipping_zone_province SHIPPING_ZONE_PROVINCE_PROVINCE_UNIQUE 
   CONSTRAINT     ~   ALTER TABLE ONLY public.shipping_zone_province
    ADD CONSTRAINT "SHIPPING_ZONE_PROVINCE_PROVINCE_UNIQUE" UNIQUE (province);
 i   ALTER TABLE ONLY public.shipping_zone_province DROP CONSTRAINT "SHIPPING_ZONE_PROVINCE_PROVINCE_UNIQUE";
       public            postgres    false    277            �           2606    18018 9   shipping_zone_province SHIPPING_ZONE_PROVINCE_UUID_UNIQUE 
   CONSTRAINT     v   ALTER TABLE ONLY public.shipping_zone_province
    ADD CONSTRAINT "SHIPPING_ZONE_PROVINCE_UUID_UNIQUE" UNIQUE (uuid);
 e   ALTER TABLE ONLY public.shipping_zone_province DROP CONSTRAINT "SHIPPING_ZONE_PROVINCE_UUID_UNIQUE";
       public            postgres    false    277            �           2606    18001 '   shipping_zone SHIPPING_ZONE_UUID_UNIQUE 
   CONSTRAINT     d   ALTER TABLE ONLY public.shipping_zone
    ADD CONSTRAINT "SHIPPING_ZONE_UUID_UNIQUE" UNIQUE (uuid);
 S   ALTER TABLE ONLY public.shipping_zone DROP CONSTRAINT "SHIPPING_ZONE_UUID_UNIQUE";
       public            postgres    false    275            �           2606    18284    tax_class TAX_CLASS_UUID_UNIQUE 
   CONSTRAINT     \   ALTER TABLE ONLY public.tax_class
    ADD CONSTRAINT "TAX_CLASS_UUID_UNIQUE" UNIQUE (uuid);
 K   ALTER TABLE ONLY public.tax_class DROP CONSTRAINT "TAX_CLASS_UUID_UNIQUE";
       public            postgres    false    301            �           2606    18310 !   tax_rate TAX_RATE_PRIORITY_UNIQUE 
   CONSTRAINT     p   ALTER TABLE ONLY public.tax_rate
    ADD CONSTRAINT "TAX_RATE_PRIORITY_UNIQUE" UNIQUE (priority, tax_class_id);
 M   ALTER TABLE ONLY public.tax_rate DROP CONSTRAINT "TAX_RATE_PRIORITY_UNIQUE";
       public            postgres    false    303    303            �           2606    18308    tax_rate TAX_RATE_UUID_UNIQUE 
   CONSTRAINT     Z   ALTER TABLE ONLY public.tax_rate
    ADD CONSTRAINT "TAX_RATE_UUID_UNIQUE" UNIQUE (uuid);
 I   ALTER TABLE ONLY public.tax_rate DROP CONSTRAINT "TAX_RATE_UUID_UNIQUE";
       public            postgres    false    303            �           2606    17963 7   payment_transaction UNQ_PAYMENT_TRANSACTION_ID_ORDER_ID 
   CONSTRAINT     �   ALTER TABLE ONLY public.payment_transaction
    ADD CONSTRAINT "UNQ_PAYMENT_TRANSACTION_ID_ORDER_ID" UNIQUE (payment_transaction_order_id, transaction_id);
 c   ALTER TABLE ONLY public.payment_transaction DROP CONSTRAINT "UNQ_PAYMENT_TRANSACTION_ID_ORDER_ID";
       public            postgres    false    271    271            �           2606    18095 #   cms_page_description URL_KEY_UNIQUE 
   CONSTRAINT     c   ALTER TABLE ONLY public.cms_page_description
    ADD CONSTRAINT "URL_KEY_UNIQUE" UNIQUE (url_key);
 O   ALTER TABLE ONLY public.cms_page_description DROP CONSTRAINT "URL_KEY_UNIQUE";
       public            postgres    false    285            b           2606    17788 #   url_rewrite URL_REWRITE_PATH_UNIQUE 
   CONSTRAINT     q   ALTER TABLE ONLY public.url_rewrite
    ADD CONSTRAINT "URL_REWRITE_PATH_UNIQUE" UNIQUE (language, entity_uuid);
 O   ALTER TABLE ONLY public.url_rewrite DROP CONSTRAINT "URL_REWRITE_PATH_UNIQUE";
       public            postgres    false    253    253            #           2606    17492 '   variant_group VARIANT_GROUP_UUID_UNIQUE 
   CONSTRAINT     d   ALTER TABLE ONLY public.variant_group
    ADD CONSTRAINT "VARIANT_GROUP_UUID_UNIQUE" UNIQUE (uuid);
 S   ALTER TABLE ONLY public.variant_group DROP CONSTRAINT "VARIANT_GROUP_UUID_UNIQUE";
       public            postgres    false    231            �           2606    18118    widget WIDGET_UUID 
   CONSTRAINT     O   ALTER TABLE ONLY public.widget
    ADD CONSTRAINT "WIDGET_UUID" UNIQUE (uuid);
 >   ALTER TABLE ONLY public.widget DROP CONSTRAINT "WIDGET_UUID";
       public            postgres    false    287            �           2606    17364    admin_user admin_user_pkey 
   CONSTRAINT     c   ALTER TABLE ONLY public.admin_user
    ADD CONSTRAINT admin_user_pkey PRIMARY KEY (admin_user_id);
 D   ALTER TABLE ONLY public.admin_user DROP CONSTRAINT admin_user_pkey;
       public            postgres    false    216                       2606    17468 .   attribute_group_link attribute_group_link_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.attribute_group_link
    ADD CONSTRAINT attribute_group_link_pkey PRIMARY KEY (attribute_group_link_id);
 X   ALTER TABLE ONLY public.attribute_group_link DROP CONSTRAINT attribute_group_link_pkey;
       public            postgres    false    229                       2606    17460 $   attribute_group attribute_group_pkey 
   CONSTRAINT     r   ALTER TABLE ONLY public.attribute_group
    ADD CONSTRAINT attribute_group_pkey PRIMARY KEY (attribute_group_id);
 N   ALTER TABLE ONLY public.attribute_group DROP CONSTRAINT attribute_group_pkey;
       public            postgres    false    227                       2606    17441 &   attribute_option attribute_option_pkey 
   CONSTRAINT     u   ALTER TABLE ONLY public.attribute_option
    ADD CONSTRAINT attribute_option_pkey PRIMARY KEY (attribute_option_id);
 P   ALTER TABLE ONLY public.attribute_option DROP CONSTRAINT attribute_option_pkey;
       public            postgres    false    225                       2606    17428    attribute attribute_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.attribute
    ADD CONSTRAINT attribute_pkey PRIMARY KEY (attribute_id);
 B   ALTER TABLE ONLY public.attribute DROP CONSTRAINT attribute_pkey;
       public            postgres    false    223            q           2606    17851    cart_address cart_address_pkey 
   CONSTRAINT     i   ALTER TABLE ONLY public.cart_address
    ADD CONSTRAINT cart_address_pkey PRIMARY KEY (cart_address_id);
 H   ALTER TABLE ONLY public.cart_address DROP CONSTRAINT cart_address_pkey;
       public            postgres    false    259            w           2606    17865    cart_item cart_item_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT cart_item_pkey PRIMARY KEY (cart_item_id);
 B   ALTER TABLE ONLY public.cart_item DROP CONSTRAINT cart_item_pkey;
       public            postgres    false    261            m           2606    17840    cart cart_pkey 
   CONSTRAINT     Q   ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (cart_id);
 8   ALTER TABLE ONLY public.cart DROP CONSTRAINT cart_pkey;
       public            postgres    false    257            T           2606    17704 .   category_description category_description_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.category_description
    ADD CONSTRAINT category_description_pkey PRIMARY KEY (category_description_id);
 X   ALTER TABLE ONLY public.category_description DROP CONSTRAINT category_description_pkey;
       public            postgres    false    247            M           2606    17674    category category_pkey 
   CONSTRAINT     ]   ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_pkey PRIMARY KEY (category_id);
 @   ALTER TABLE ONLY public.category DROP CONSTRAINT category_pkey;
       public            postgres    false    245            �           2606    18091 .   cms_page_description cms_page_description_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.cms_page_description
    ADD CONSTRAINT cms_page_description_pkey PRIMARY KEY (cms_page_description_id);
 X   ALTER TABLE ONLY public.cms_page_description DROP CONSTRAINT cms_page_description_pkey;
       public            postgres    false    285            �           2606    18081    cms_page cms_page_pkey 
   CONSTRAINT     ]   ALTER TABLE ONLY public.cms_page
    ADD CONSTRAINT cms_page_pkey PRIMARY KEY (cms_page_id);
 @   ALTER TABLE ONLY public.cms_page DROP CONSTRAINT cms_page_pkey;
       public            postgres    false    283            Z           2606    17725    collection collection_pkey 
   CONSTRAINT     c   ALTER TABLE ONLY public.collection
    ADD CONSTRAINT collection_pkey PRIMARY KEY (collection_id);
 D   ALTER TABLE ONLY public.collection DROP CONSTRAINT collection_pkey;
       public            postgres    false    249            �           2606    18221    coupon coupon_pkey 
   CONSTRAINT     W   ALTER TABLE ONLY public.coupon
    ADD CONSTRAINT coupon_pkey PRIMARY KEY (coupon_id);
 <   ALTER TABLE ONLY public.coupon DROP CONSTRAINT coupon_pkey;
       public            postgres    false    297            �           2606    18164 &   customer_address customer_address_pkey 
   CONSTRAINT     u   ALTER TABLE ONLY public.customer_address
    ADD CONSTRAINT customer_address_pkey PRIMARY KEY (customer_address_id);
 P   ALTER TABLE ONLY public.customer_address DROP CONSTRAINT customer_address_pkey;
       public            postgres    false    293            �           2606    18130 "   customer_group customer_group_pkey 
   CONSTRAINT     o   ALTER TABLE ONLY public.customer_group
    ADD CONSTRAINT customer_group_pkey PRIMARY KEY (customer_group_id);
 L   ALTER TABLE ONLY public.customer_group DROP CONSTRAINT customer_group_pkey;
       public            postgres    false    289            �           2606    18143    customer customer_pkey 
   CONSTRAINT     ]   ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_pkey PRIMARY KEY (customer_id);
 @   ALTER TABLE ONLY public.customer DROP CONSTRAINT customer_pkey;
       public            postgres    false    291                       2606    17413    event event_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_pkey PRIMARY KEY (event_id);
 :   ALTER TABLE ONLY public.event DROP CONSTRAINT event_pkey;
       public            postgres    false    221            �           2606    17378    migration migration_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.migration
    ADD CONSTRAINT migration_pkey PRIMARY KEY (migration_id);
 B   ALTER TABLE ONLY public.migration DROP CONSTRAINT migration_pkey;
       public            postgres    false    218            �           2606    17912 "   order_activity order_activity_pkey 
   CONSTRAINT     o   ALTER TABLE ONLY public.order_activity
    ADD CONSTRAINT order_activity_pkey PRIMARY KEY (order_activity_id);
 L   ALTER TABLE ONLY public.order_activity DROP CONSTRAINT order_activity_pkey;
       public            postgres    false    265            �           2606    17929     order_address order_address_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.order_address
    ADD CONSTRAINT order_address_pkey PRIMARY KEY (order_address_id);
 J   ALTER TABLE ONLY public.order_address DROP CONSTRAINT order_address_pkey;
       public            postgres    false    267            �           2606    17941    order_item order_item_pkey 
   CONSTRAINT     c   ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_pkey PRIMARY KEY (order_item_id);
 D   ALTER TABLE ONLY public.order_item DROP CONSTRAINT order_item_pkey;
       public            postgres    false    269            }           2606    17896    order order_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_pkey PRIMARY KEY (order_id);
 <   ALTER TABLE ONLY public."order" DROP CONSTRAINT order_pkey;
       public            postgres    false    263            �           2606    17959 ,   payment_transaction payment_transaction_pkey 
   CONSTRAINT     ~   ALTER TABLE ONLY public.payment_transaction
    ADD CONSTRAINT payment_transaction_pkey PRIMARY KEY (payment_transaction_id);
 V   ALTER TABLE ONLY public.payment_transaction DROP CONSTRAINT payment_transaction_pkey;
       public            postgres    false    271            4           2606    17571 @   product_attribute_value_index product_attribute_value_index_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.product_attribute_value_index
    ADD CONSTRAINT product_attribute_value_index_pkey PRIMARY KEY (product_attribute_value_index_id);
 j   ALTER TABLE ONLY public.product_attribute_value_index DROP CONSTRAINT product_attribute_value_index_pkey;
       public            postgres    false    235            `           2606    17735 *   product_collection product_collection_pkey 
   CONSTRAINT     {   ALTER TABLE ONLY public.product_collection
    ADD CONSTRAINT product_collection_pkey PRIMARY KEY (product_collection_id);
 T   ALTER TABLE ONLY public.product_collection DROP CONSTRAINT product_collection_pkey;
       public            postgres    false    251            9           2606    17603 0   product_custom_option product_custom_option_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.product_custom_option
    ADD CONSTRAINT product_custom_option_pkey PRIMARY KEY (product_custom_option_id);
 Z   ALTER TABLE ONLY public.product_custom_option DROP CONSTRAINT product_custom_option_pkey;
       public            postgres    false    237            >           2606    17621 <   product_custom_option_value product_custom_option_value_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.product_custom_option_value
    ADD CONSTRAINT product_custom_option_value_pkey PRIMARY KEY (product_custom_option_value_id);
 f   ALTER TABLE ONLY public.product_custom_option_value DROP CONSTRAINT product_custom_option_value_pkey;
       public            postgres    false    239            F           2606    17637 ,   product_description product_description_pkey 
   CONSTRAINT     ~   ALTER TABLE ONLY public.product_description
    ADD CONSTRAINT product_description_pkey PRIMARY KEY (product_description_id);
 V   ALTER TABLE ONLY public.product_description DROP CONSTRAINT product_description_pkey;
       public            postgres    false    241            I           2606    17656     product_image product_image_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.product_image
    ADD CONSTRAINT product_image_pkey PRIMARY KEY (product_image_id);
 J   ALTER TABLE ONLY public.product_image DROP CONSTRAINT product_image_pkey;
       public            postgres    false    243            h           2606    17809 (   product_inventory product_inventory_pkey 
   CONSTRAINT     x   ALTER TABLE ONLY public.product_inventory
    ADD CONSTRAINT product_inventory_pkey PRIMARY KEY (product_inventory_id);
 R   ALTER TABLE ONLY public.product_inventory DROP CONSTRAINT product_inventory_pkey;
       public            postgres    false    255            -           2606    17546    product product_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (product_id);
 >   ALTER TABLE ONLY public.product DROP CONSTRAINT product_pkey;
       public            postgres    false    233            �           2606    18191 .   reset_password_token reset_password_token_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.reset_password_token
    ADD CONSTRAINT reset_password_token_pkey PRIMARY KEY (reset_password_token_id);
 X   ALTER TABLE ONLY public.reset_password_token DROP CONSTRAINT reset_password_token_pkey;
       public            postgres    false    295            �           2606    18269    setting setting_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.setting
    ADD CONSTRAINT setting_pkey PRIMARY KEY (setting_id);
 >   ALTER TABLE ONLY public.setting DROP CONSTRAINT setting_pkey;
       public            postgres    false    299            �           2606    17980    shipment shipment_pkey 
   CONSTRAINT     ]   ALTER TABLE ONLY public.shipment
    ADD CONSTRAINT shipment_pkey PRIMARY KEY (shipment_id);
 @   ALTER TABLE ONLY public.shipment DROP CONSTRAINT shipment_pkey;
       public            postgres    false    273            �           2606    18035 $   shipping_method shipping_method_pkey 
   CONSTRAINT     r   ALTER TABLE ONLY public.shipping_method
    ADD CONSTRAINT shipping_method_pkey PRIMARY KEY (shipping_method_id);
 N   ALTER TABLE ONLY public.shipping_method DROP CONSTRAINT shipping_method_pkey;
       public            postgres    false    279            �           2606    18053 .   shipping_zone_method shipping_zone_method_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.shipping_zone_method
    ADD CONSTRAINT shipping_zone_method_pkey PRIMARY KEY (shipping_zone_method_id);
 X   ALTER TABLE ONLY public.shipping_zone_method DROP CONSTRAINT shipping_zone_method_pkey;
       public            postgres    false    281            �           2606    17999     shipping_zone shipping_zone_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.shipping_zone
    ADD CONSTRAINT shipping_zone_pkey PRIMARY KEY (shipping_zone_id);
 J   ALTER TABLE ONLY public.shipping_zone DROP CONSTRAINT shipping_zone_pkey;
       public            postgres    false    275            �           2606    18016 2   shipping_zone_province shipping_zone_province_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.shipping_zone_province
    ADD CONSTRAINT shipping_zone_province_pkey PRIMARY KEY (shipping_zone_province_id);
 \   ALTER TABLE ONLY public.shipping_zone_province DROP CONSTRAINT shipping_zone_province_pkey;
       public            postgres    false    277            �           2606    18282    tax_class tax_class_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.tax_class
    ADD CONSTRAINT tax_class_pkey PRIMARY KEY (tax_class_id);
 B   ALTER TABLE ONLY public.tax_class DROP CONSTRAINT tax_class_pkey;
       public            postgres    false    301            �           2606    18306    tax_rate tax_rate_pkey 
   CONSTRAINT     ]   ALTER TABLE ONLY public.tax_rate
    ADD CONSTRAINT tax_rate_pkey PRIMARY KEY (tax_rate_id);
 @   ALTER TABLE ONLY public.tax_rate DROP CONSTRAINT tax_rate_pkey;
       public            postgres    false    303            d           2606    17786    url_rewrite url_rewrite_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.url_rewrite
    ADD CONSTRAINT url_rewrite_pkey PRIMARY KEY (url_rewrite_id);
 F   ALTER TABLE ONLY public.url_rewrite DROP CONSTRAINT url_rewrite_pkey;
       public            postgres    false    253            %           2606    17490     variant_group variant_group_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.variant_group
    ADD CONSTRAINT variant_group_pkey PRIMARY KEY (variant_group_id);
 J   ALTER TABLE ONLY public.variant_group DROP CONSTRAINT variant_group_pkey;
       public            postgres    false    231            �           2606    18116    widget widget_pkey 
   CONSTRAINT     W   ALTER TABLE ONLY public.widget
    ADD CONSTRAINT widget_pkey PRIMARY KEY (widget_id);
 <   ALTER TABLE ONLY public.widget DROP CONSTRAINT widget_pkey;
       public            postgres    false    287                       1259    17528    FK_ATTRIBUTE_GROUP_VARIANT    INDEX     d   CREATE INDEX "FK_ATTRIBUTE_GROUP_VARIANT" ON public.variant_group USING btree (attribute_group_id);
 0   DROP INDEX public."FK_ATTRIBUTE_GROUP_VARIANT";
       public            postgres    false    231                       1259    17482    FK_ATTRIBUTE_LINK    INDEX     \   CREATE INDEX "FK_ATTRIBUTE_LINK" ON public.attribute_group_link USING btree (attribute_id);
 '   DROP INDEX public."FK_ATTRIBUTE_LINK";
       public            postgres    false    229                       1259    17449    FK_ATTRIBUTE_OPTION    INDEX     Z   CREATE INDEX "FK_ATTRIBUTE_OPTION" ON public.attribute_option USING btree (attribute_id);
 )   DROP INDEX public."FK_ATTRIBUTE_OPTION";
       public            postgres    false    225            .           1259    17592    FK_ATTRIBUTE_OPTION_VALUE_LINK    INDEX     o   CREATE INDEX "FK_ATTRIBUTE_OPTION_VALUE_LINK" ON public.product_attribute_value_index USING btree (option_id);
 4   DROP INDEX public."FK_ATTRIBUTE_OPTION_VALUE_LINK";
       public            postgres    false    235            /           1259    17591    FK_ATTRIBUTE_VALUE_LINK    INDEX     k   CREATE INDEX "FK_ATTRIBUTE_VALUE_LINK" ON public.product_attribute_value_index USING btree (attribute_id);
 -   DROP INDEX public."FK_ATTRIBUTE_VALUE_LINK";
       public            postgres    false    235                       1259    17527    FK_ATTRIBUTE_VARIANT_FIVE    INDEX     _   CREATE INDEX "FK_ATTRIBUTE_VARIANT_FIVE" ON public.variant_group USING btree (attribute_five);
 /   DROP INDEX public."FK_ATTRIBUTE_VARIANT_FIVE";
       public            postgres    false    231                       1259    17526    FK_ATTRIBUTE_VARIANT_FOUR    INDEX     _   CREATE INDEX "FK_ATTRIBUTE_VARIANT_FOUR" ON public.variant_group USING btree (attribute_four);
 /   DROP INDEX public."FK_ATTRIBUTE_VARIANT_FOUR";
       public            postgres    false    231                       1259    17523    FK_ATTRIBUTE_VARIANT_ONE    INDEX     ]   CREATE INDEX "FK_ATTRIBUTE_VARIANT_ONE" ON public.variant_group USING btree (attribute_one);
 .   DROP INDEX public."FK_ATTRIBUTE_VARIANT_ONE";
       public            postgres    false    231                        1259    17525    FK_ATTRIBUTE_VARIANT_THREE    INDEX     a   CREATE INDEX "FK_ATTRIBUTE_VARIANT_THREE" ON public.variant_group USING btree (attribute_three);
 0   DROP INDEX public."FK_ATTRIBUTE_VARIANT_THREE";
       public            postgres    false    231            !           1259    17524    FK_ATTRIBUTE_VARIANT_TWO    INDEX     ]   CREATE INDEX "FK_ATTRIBUTE_VARIANT_TWO" ON public.variant_group USING btree (attribute_two);
 .   DROP INDEX public."FK_ATTRIBUTE_VARIANT_TWO";
       public            postgres    false    231            t           1259    17878    FK_CART_ITEM    INDEX     G   CREATE INDEX "FK_CART_ITEM" ON public.cart_item USING btree (cart_id);
 "   DROP INDEX public."FK_CART_ITEM";
       public            postgres    false    261            u           1259    17879    FK_CART_ITEM_PRODUCT    INDEX     R   CREATE INDEX "FK_CART_ITEM_PRODUCT" ON public.cart_item USING btree (product_id);
 *   DROP INDEX public."FK_CART_ITEM_PRODUCT";
       public            postgres    false    261            k           1259    18007    FK_CART_SHIPPING_ZONE    INDEX     T   CREATE INDEX "FK_CART_SHIPPING_ZONE" ON public.cart USING btree (shipping_zone_id);
 +   DROP INDEX public."FK_CART_SHIPPING_ZONE";
       public            postgres    false    257            R           1259    17714    FK_CATEGORY_DESCRIPTION    INDEX     v   CREATE INDEX "FK_CATEGORY_DESCRIPTION" ON public.category_description USING btree (category_description_category_id);
 -   DROP INDEX public."FK_CATEGORY_DESCRIPTION";
       public            postgres    false    247            �           1259    18101    FK_CMS_PAGE_DESCRIPTION    INDEX     v   CREATE INDEX "FK_CMS_PAGE_DESCRIPTION" ON public.cms_page_description USING btree (cms_page_description_cms_page_id);
 -   DROP INDEX public."FK_CMS_PAGE_DESCRIPTION";
       public            postgres    false    285            [           1259    17748    FK_COLLECTION_PRODUCT_LINK    INDEX     d   CREATE INDEX "FK_COLLECTION_PRODUCT_LINK" ON public.product_collection USING btree (collection_id);
 0   DROP INDEX public."FK_COLLECTION_PRODUCT_LINK";
       public            postgres    false    251            �           1259    18172    FK_CUSTOMER_ADDRESS    INDEX     Y   CREATE INDEX "FK_CUSTOMER_ADDRESS" ON public.customer_address USING btree (customer_id);
 )   DROP INDEX public."FK_CUSTOMER_ADDRESS";
       public            postgres    false    293            �           1259    18153    FK_CUSTOMER_GROUP    INDEX     L   CREATE INDEX "FK_CUSTOMER_GROUP" ON public.customer USING btree (group_id);
 '   DROP INDEX public."FK_CUSTOMER_GROUP";
       public            postgres    false    291            :           1259    17629    FK_CUSTOM_OPTION_VALUE    INDEX     e   CREATE INDEX "FK_CUSTOM_OPTION_VALUE" ON public.product_custom_option_value USING btree (option_id);
 ,   DROP INDEX public."FK_CUSTOM_OPTION_VALUE";
       public            postgres    false    239                       1259    17481    FK_GROUP_LINK    INDEX     T   CREATE INDEX "FK_GROUP_LINK" ON public.attribute_group_link USING btree (group_id);
 #   DROP INDEX public."FK_GROUP_LINK";
       public            postgres    false    229            �           1259    18067    FK_METHOD_ZONE    INDEX     V   CREATE INDEX "FK_METHOD_ZONE" ON public.shipping_zone_method USING btree (method_id);
 $   DROP INDEX public."FK_METHOD_ZONE";
       public            postgres    false    281            �           1259    17949    FK_ORDER    INDEX     P   CREATE INDEX "FK_ORDER" ON public.order_item USING btree (order_item_order_id);
    DROP INDEX public."FK_ORDER";
       public            postgres    false    269            ~           1259    17920    FK_ORDER_ACTIVITY    INDEX     a   CREATE INDEX "FK_ORDER_ACTIVITY" ON public.order_activity USING btree (order_activity_order_id);
 '   DROP INDEX public."FK_ORDER_ACTIVITY";
       public            postgres    false    265            �           1259    17988    FK_ORDER_SHIPMENT    INDEX     U   CREATE INDEX "FK_ORDER_SHIPMENT" ON public.shipment USING btree (shipment_order_id);
 '   DROP INDEX public."FK_ORDER_SHIPMENT";
       public            postgres    false    273            �           1259    17969    FK_PAYMENT_TRANSACTION_ORDER    INDEX     v   CREATE INDEX "FK_PAYMENT_TRANSACTION_ORDER" ON public.payment_transaction USING btree (payment_transaction_order_id);
 2   DROP INDEX public."FK_PAYMENT_TRANSACTION_ORDER";
       public            postgres    false    271            &           1259    17561    FK_PRODUCT_ATTRIBUTE_GROUP    INDEX     T   CREATE INDEX "FK_PRODUCT_ATTRIBUTE_GROUP" ON public.product USING btree (group_id);
 0   DROP INDEX public."FK_PRODUCT_ATTRIBUTE_GROUP";
       public            postgres    false    233            0           1259    17593    FK_PRODUCT_ATTRIBUTE_LINK    INDEX     k   CREATE INDEX "FK_PRODUCT_ATTRIBUTE_LINK" ON public.product_attribute_value_index USING btree (product_id);
 /   DROP INDEX public."FK_PRODUCT_ATTRIBUTE_LINK";
       public            postgres    false    235            \           1259    17749    FK_PRODUCT_COLLECTION_LINK    INDEX     a   CREATE INDEX "FK_PRODUCT_COLLECTION_LINK" ON public.product_collection USING btree (product_id);
 0   DROP INDEX public."FK_PRODUCT_COLLECTION_LINK";
       public            postgres    false    251            5           1259    17611    FK_PRODUCT_CUSTOM_OPTION    INDEX     x   CREATE INDEX "FK_PRODUCT_CUSTOM_OPTION" ON public.product_custom_option USING btree (product_custom_option_product_id);
 .   DROP INDEX public."FK_PRODUCT_CUSTOM_OPTION";
       public            postgres    false    237            ?           1259    17647    FK_PRODUCT_DESCRIPTION    INDEX     r   CREATE INDEX "FK_PRODUCT_DESCRIPTION" ON public.product_description USING btree (product_description_product_id);
 ,   DROP INDEX public."FK_PRODUCT_DESCRIPTION";
       public            postgres    false    241            G           1259    17664    FK_PRODUCT_IMAGE_LINK    INDEX     e   CREATE INDEX "FK_PRODUCT_IMAGE_LINK" ON public.product_image USING btree (product_image_product_id);
 +   DROP INDEX public."FK_PRODUCT_IMAGE_LINK";
       public            postgres    false    243            '           1259    17562    FK_PRODUCT_VARIANT_GROUP    INDEX     Z   CREATE INDEX "FK_PRODUCT_VARIANT_GROUP" ON public.product USING btree (variant_group_id);
 .   DROP INDEX public."FK_PRODUCT_VARIANT_GROUP";
       public            postgres    false    233            �           1259    18026    FK_SHIPPING_ZONE_PROVINCE    INDEX     a   CREATE INDEX "FK_SHIPPING_ZONE_PROVINCE" ON public.shipping_zone_province USING btree (zone_id);
 /   DROP INDEX public."FK_SHIPPING_ZONE_PROVINCE";
       public            postgres    false    277            �           1259    18066    FK_ZONE_METHOD    INDEX     T   CREATE INDEX "FK_ZONE_METHOD" ON public.shipping_zone_method USING btree (zone_id);
 $   DROP INDEX public."FK_ZONE_METHOD";
       public            postgres    false    281                        1259    17403    IDX_SESSION_EXPIRE    INDEX     J   CREATE INDEX "IDX_SESSION_EXPIRE" ON public.session USING btree (expire);
 (   DROP INDEX public."IDX_SESSION_EXPIRE";
       public            postgres    false    219            B           1259    17821    PRODUCT_SEARCH_INDEX    INDEX     �   CREATE INDEX "PRODUCT_SEARCH_INDEX" ON public.product_description USING gin (to_tsvector('simple'::regconfig, (((name)::text || ' '::text) || description)));
 *   DROP INDEX public."PRODUCT_SEARCH_INDEX";
       public            postgres    false    241    241    241                       2620    17790 +   category ADD_CATEGORY_CREATED_EVENT_TRIGGER    TRIGGER     �   CREATE TRIGGER "ADD_CATEGORY_CREATED_EVENT_TRIGGER" AFTER INSERT ON public.category FOR EACH ROW EXECUTE FUNCTION public.add_category_created_event();
 F   DROP TRIGGER "ADD_CATEGORY_CREATED_EVENT_TRIGGER" ON public.category;
       public          postgres    false    313    245                       2620    17794 +   category ADD_CATEGORY_DELETED_EVENT_TRIGGER    TRIGGER     �   CREATE TRIGGER "ADD_CATEGORY_DELETED_EVENT_TRIGGER" AFTER DELETE ON public.category FOR EACH ROW EXECUTE FUNCTION public.add_category_deleted_event();
 F   DROP TRIGGER "ADD_CATEGORY_DELETED_EVENT_TRIGGER" ON public.category;
       public          postgres    false    245    315                       2620    17792 +   category ADD_CATEGORY_UPDATED_EVENT_TRIGGER    TRIGGER     �   CREATE TRIGGER "ADD_CATEGORY_UPDATED_EVENT_TRIGGER" AFTER UPDATE ON public.category FOR EACH ROW EXECUTE FUNCTION public.add_category_updated_event();
 F   DROP TRIGGER "ADD_CATEGORY_UPDATED_EVENT_TRIGGER" ON public.category;
       public          postgres    false    314    245            "           2620    18178 +   customer ADD_CUSTOMER_CREATED_EVENT_TRIGGER    TRIGGER     �   CREATE TRIGGER "ADD_CUSTOMER_CREATED_EVENT_TRIGGER" AFTER INSERT ON public.customer FOR EACH ROW EXECUTE FUNCTION public.add_customer_created_event();
 F   DROP TRIGGER "ADD_CUSTOMER_CREATED_EVENT_TRIGGER" ON public.customer;
       public          postgres    false    291    330            #           2620    18182 +   customer ADD_CUSTOMER_DELETED_EVENT_TRIGGER    TRIGGER     �   CREATE TRIGGER "ADD_CUSTOMER_DELETED_EVENT_TRIGGER" AFTER DELETE ON public.customer FOR EACH ROW EXECUTE FUNCTION public.add_customer_deleted_event();
 F   DROP TRIGGER "ADD_CUSTOMER_DELETED_EVENT_TRIGGER" ON public.customer;
       public          postgres    false    332    291            $           2620    18180 +   customer ADD_CUSTOMER_UPDATED_EVENT_TRIGGER    TRIGGER     �   CREATE TRIGGER "ADD_CUSTOMER_UPDATED_EVENT_TRIGGER" AFTER UPDATE ON public.customer FOR EACH ROW EXECUTE FUNCTION public.add_customer_updated_event();
 F   DROP TRIGGER "ADD_CUSTOMER_UPDATED_EVENT_TRIGGER" ON public.customer;
       public          postgres    false    291    331                       2620    17820 5   product_inventory ADD_INVENTORY_UPDATED_EVENT_TRIGGER    TRIGGER     �   CREATE TRIGGER "ADD_INVENTORY_UPDATED_EVENT_TRIGGER" AFTER UPDATE ON public.product_inventory FOR EACH ROW EXECUTE FUNCTION public.add_product_inventory_updated_event();
 P   DROP TRIGGER "ADD_INVENTORY_UPDATED_EVENT_TRIGGER" ON public.product_inventory;
       public          postgres    false    320    255                       2620    18070 %   order ADD_ORDER_CREATED_EVENT_TRIGGER    TRIGGER     �   CREATE TRIGGER "ADD_ORDER_CREATED_EVENT_TRIGGER" AFTER INSERT ON public."order" FOR EACH ROW EXECUTE FUNCTION public.add_order_created_event();
 B   DROP TRIGGER "ADD_ORDER_CREATED_EVENT_TRIGGER" ON public."order";
       public          postgres    false    323    263                       2620    17796 )   product ADD_PRODUCT_CREATED_EVENT_TRIGGER    TRIGGER     �   CREATE TRIGGER "ADD_PRODUCT_CREATED_EVENT_TRIGGER" AFTER INSERT ON public.product FOR EACH ROW EXECUTE FUNCTION public.add_product_created_event();
 D   DROP TRIGGER "ADD_PRODUCT_CREATED_EVENT_TRIGGER" ON public.product;
       public          postgres    false    233    316                       2620    17800 )   product ADD_PRODUCT_DELETED_EVENT_TRIGGER    TRIGGER     �   CREATE TRIGGER "ADD_PRODUCT_DELETED_EVENT_TRIGGER" AFTER DELETE ON public.product FOR EACH ROW EXECUTE FUNCTION public.add_product_deleted_event();
 D   DROP TRIGGER "ADD_PRODUCT_DELETED_EVENT_TRIGGER" ON public.product;
       public          postgres    false    318    233                       2620    17798 )   product ADD_PRODUCT_UPDATED_EVENT_TRIGGER    TRIGGER     �   CREATE TRIGGER "ADD_PRODUCT_UPDATED_EVENT_TRIGGER" AFTER UPDATE ON public.product FOR EACH ROW EXECUTE FUNCTION public.add_product_updated_event();
 D   DROP TRIGGER "ADD_PRODUCT_UPDATED_EVENT_TRIGGER" ON public.product;
       public          postgres    false    233    317                       2620    17776 3   category_description BUILD_CATEGORY_URL_KEY_TRIGGER    TRIGGER     �   CREATE TRIGGER "BUILD_CATEGORY_URL_KEY_TRIGGER" BEFORE INSERT OR UPDATE ON public.category_description FOR EACH ROW EXECUTE FUNCTION public.build_url_key();
 N   DROP TRIGGER "BUILD_CATEGORY_URL_KEY_TRIGGER" ON public.category_description;
       public          postgres    false    247    312                       2620    17777 1   product_description BUILD_PRODUCT_URL_KEY_TRIGGER    TRIGGER     �   CREATE TRIGGER "BUILD_PRODUCT_URL_KEY_TRIGGER" BEFORE INSERT OR UPDATE ON public.product_description FOR EACH ROW EXECUTE FUNCTION public.build_url_key();
 L   DROP TRIGGER "BUILD_PRODUCT_URL_KEY_TRIGGER" ON public.product_description;
       public          postgres    false    312    241                       2620    17818 &   category DELETE_SUB_CATEGORIES_TRIGGER    TRIGGER     �   CREATE TRIGGER "DELETE_SUB_CATEGORIES_TRIGGER" AFTER DELETE ON public.category FOR EACH ROW EXECUTE FUNCTION public.delete_sub_categories();
 A   DROP TRIGGER "DELETE_SUB_CATEGORIES_TRIGGER" ON public.category;
       public          postgres    false    245    319                       2620    17753 A   product PREVENT_CHANGING_ATTRIBUTE_GROUP_OF_PRODUCT_WITH_VARIANTS    TRIGGER     �   CREATE TRIGGER "PREVENT_CHANGING_ATTRIBUTE_GROUP_OF_PRODUCT_WITH_VARIANTS" BEFORE UPDATE ON public.product FOR EACH ROW EXECUTE FUNCTION public.prevent_change_attribute_group();
 \   DROP TRIGGER "PREVENT_CHANGING_ATTRIBUTE_GROUP_OF_PRODUCT_WITH_VARIANTS" ON public.product;
       public          postgres    false    305    233                       2620    17751 <   attribute_group PREVENT_DELETING_THE_DEFAULT_ATTRIBUTE_GROUP    TRIGGER     �   CREATE TRIGGER "PREVENT_DELETING_THE_DEFAULT_ATTRIBUTE_GROUP" BEFORE DELETE ON public.attribute_group FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_default_attribute_group();
 W   DROP TRIGGER "PREVENT_DELETING_THE_DEFAULT_ATTRIBUTE_GROUP" ON public.attribute_group;
       public          postgres    false    304    227            !           2620    18174 :   customer_group PREVENT_DELETING_THE_DEFAULT_CUSTOMER_GROUP    TRIGGER     �   CREATE TRIGGER "PREVENT_DELETING_THE_DEFAULT_CUSTOMER_GROUP" BEFORE DELETE ON public.customer_group FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_default_customer_group();
 U   DROP TRIGGER "PREVENT_DELETING_THE_DEFAULT_CUSTOMER_GROUP" ON public.customer_group;
       public          postgres    false    324    289            &           2620    18291 0   tax_class PREVENT_DELETING_THE_DEFAULT_TAX_CLASS    TRIGGER     �   CREATE TRIGGER "PREVENT_DELETING_THE_DEFAULT_TAX_CLASS" BEFORE DELETE ON public.tax_class FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_default_tax_class();
 K   DROP TRIGGER "PREVENT_DELETING_THE_DEFAULT_TAX_CLASS" ON public.tax_class;
       public          postgres    false    301    341                       2620    17824 !   product_image PRODUCT_IMAGE_ADDED    TRIGGER     �   CREATE TRIGGER "PRODUCT_IMAGE_ADDED" AFTER INSERT ON public.product_image FOR EACH ROW EXECUTE FUNCTION public.product_image_insert_trigger();
 <   DROP TRIGGER "PRODUCT_IMAGE_ADDED" ON public.product_image;
       public          postgres    false    243    321            %           2620    18176 #   customer SET_DEFAULT_CUSTOMER_GROUP    TRIGGER     �   CREATE TRIGGER "SET_DEFAULT_CUSTOMER_GROUP" BEFORE INSERT ON public.customer FOR EACH ROW EXECUTE FUNCTION public.set_default_customer_group();
 >   DROP TRIGGER "SET_DEFAULT_CUSTOMER_GROUP" ON public.customer;
       public          postgres    false    325    291                       2620    17757 6   attribute_option TRIGGER_AFTER_ATTRIBUTE_OPTION_UPDATE    TRIGGER     �   CREATE TRIGGER "TRIGGER_AFTER_ATTRIBUTE_OPTION_UPDATE" AFTER UPDATE ON public.attribute_option FOR EACH ROW EXECUTE FUNCTION public.update_product_attribute_option_value_text();
 Q   DROP TRIGGER "TRIGGER_AFTER_ATTRIBUTE_OPTION_UPDATE" ON public.attribute_option;
       public          postgres    false    225    307                       2620    17759 6   attribute_option TRIGGER_AFTER_DELETE_ATTRIBUTE_OPTION    TRIGGER     �   CREATE TRIGGER "TRIGGER_AFTER_DELETE_ATTRIBUTE_OPTION" AFTER DELETE ON public.attribute_option FOR EACH ROW EXECUTE FUNCTION public.delete_product_attribute_value_index();
 Q   DROP TRIGGER "TRIGGER_AFTER_DELETE_ATTRIBUTE_OPTION" ON public.attribute_option;
       public          postgres    false    308    225                        2620    18068 *   order_item TRIGGER_AFTER_INSERT_ORDER_ITEM    TRIGGER     �   CREATE TRIGGER "TRIGGER_AFTER_INSERT_ORDER_ITEM" AFTER INSERT ON public.order_item FOR EACH ROW EXECUTE FUNCTION public.reduce_product_stock_when_order_placed();
 E   DROP TRIGGER "TRIGGER_AFTER_INSERT_ORDER_ITEM" ON public.order_item;
       public          postgres    false    322    269                       2620    17761 $   product TRIGGER_AFTER_INSERT_PRODUCT    TRIGGER     �   CREATE CONSTRAINT TRIGGER "TRIGGER_AFTER_INSERT_PRODUCT" AFTER INSERT ON public.product DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION public.update_variant_group_visibility();
 ?   DROP TRIGGER "TRIGGER_AFTER_INSERT_PRODUCT" ON public.product;
       public          postgres    false    309    233                       2620    17755 >   attribute_group_link TRIGGER_AFTER_REMOVE_ATTRIBUTE_FROM_GROUP    TRIGGER     �   CREATE TRIGGER "TRIGGER_AFTER_REMOVE_ATTRIBUTE_FROM_GROUP" AFTER DELETE ON public.attribute_group_link FOR EACH ROW EXECUTE FUNCTION public.remove_attribute_from_group();
 Y   DROP TRIGGER "TRIGGER_AFTER_REMOVE_ATTRIBUTE_FROM_GROUP" ON public.attribute_group_link;
       public          postgres    false    306    229                       2620    17767 (   attribute TRIGGER_AFTER_UPDATE_ATTRIBUTE    TRIGGER     �   CREATE TRIGGER "TRIGGER_AFTER_UPDATE_ATTRIBUTE" AFTER UPDATE ON public.attribute FOR EACH ROW EXECUTE FUNCTION public.delete_variant_group_after_attribute_type_changed();
 C   DROP TRIGGER "TRIGGER_AFTER_UPDATE_ATTRIBUTE" ON public.attribute;
       public          postgres    false    310    223                       2620    17768 $   product TRIGGER_PRODUCT_AFTER_UPDATE    TRIGGER     �   CREATE CONSTRAINT TRIGGER "TRIGGER_PRODUCT_AFTER_UPDATE" AFTER UPDATE ON public.product DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.update_attribute_index_and_variant_group_visibility();
 ?   DROP TRIGGER "TRIGGER_PRODUCT_AFTER_UPDATE" ON public.product;
       public          postgres    false    233    311                       2620    18227 8   order TRIGGER_UPDATE_COUPON_USED_TIME_AFTER_CREATE_ORDER    TRIGGER     �   CREATE TRIGGER "TRIGGER_UPDATE_COUPON_USED_TIME_AFTER_CREATE_ORDER" AFTER INSERT ON public."order" FOR EACH ROW EXECUTE FUNCTION public.set_coupon_used_time();
 U   DROP TRIGGER "TRIGGER_UPDATE_COUPON_USED_TIME_AFTER_CREATE_ORDER" ON public."order";
       public          postgres    false    339    263            �           2606    17493 (   variant_group FK_ATTRIBUTE_GROUP_VARIANT    FK CONSTRAINT     �   ALTER TABLE ONLY public.variant_group
    ADD CONSTRAINT "FK_ATTRIBUTE_GROUP_VARIANT" FOREIGN KEY (attribute_group_id) REFERENCES public.attribute_group(attribute_group_id) ON DELETE CASCADE;
 T   ALTER TABLE ONLY public.variant_group DROP CONSTRAINT "FK_ATTRIBUTE_GROUP_VARIANT";
       public          postgres    false    231    227    3605            �           2606    17471 &   attribute_group_link FK_ATTRIBUTE_LINK    FK CONSTRAINT     �   ALTER TABLE ONLY public.attribute_group_link
    ADD CONSTRAINT "FK_ATTRIBUTE_LINK" FOREIGN KEY (attribute_id) REFERENCES public.attribute(attribute_id) ON UPDATE CASCADE ON DELETE CASCADE;
 R   ALTER TABLE ONLY public.attribute_group_link DROP CONSTRAINT "FK_ATTRIBUTE_LINK";
       public          postgres    false    229    3596    223            �           2606    17444 $   attribute_option FK_ATTRIBUTE_OPTION    FK CONSTRAINT     �   ALTER TABLE ONLY public.attribute_option
    ADD CONSTRAINT "FK_ATTRIBUTE_OPTION" FOREIGN KEY (attribute_id) REFERENCES public.attribute(attribute_id) ON DELETE CASCADE;
 P   ALTER TABLE ONLY public.attribute_option DROP CONSTRAINT "FK_ATTRIBUTE_OPTION";
       public          postgres    false    3596    225    223            �           2606    17576 <   product_attribute_value_index FK_ATTRIBUTE_OPTION_VALUE_LINK    FK CONSTRAINT     �   ALTER TABLE ONLY public.product_attribute_value_index
    ADD CONSTRAINT "FK_ATTRIBUTE_OPTION_VALUE_LINK" FOREIGN KEY (option_id) REFERENCES public.attribute_option(attribute_option_id) ON DELETE CASCADE;
 h   ALTER TABLE ONLY public.product_attribute_value_index DROP CONSTRAINT "FK_ATTRIBUTE_OPTION_VALUE_LINK";
       public          postgres    false    3601    225    235            �           2606    17581 5   product_attribute_value_index FK_ATTRIBUTE_VALUE_LINK    FK CONSTRAINT     �   ALTER TABLE ONLY public.product_attribute_value_index
    ADD CONSTRAINT "FK_ATTRIBUTE_VALUE_LINK" FOREIGN KEY (attribute_id) REFERENCES public.attribute(attribute_id) ON DELETE CASCADE;
 a   ALTER TABLE ONLY public.product_attribute_value_index DROP CONSTRAINT "FK_ATTRIBUTE_VALUE_LINK";
       public          postgres    false    223    235    3596            �           2606    17498 '   variant_group FK_ATTRIBUTE_VARIANT_FIVE    FK CONSTRAINT     �   ALTER TABLE ONLY public.variant_group
    ADD CONSTRAINT "FK_ATTRIBUTE_VARIANT_FIVE" FOREIGN KEY (attribute_five) REFERENCES public.attribute(attribute_id) ON DELETE CASCADE;
 S   ALTER TABLE ONLY public.variant_group DROP CONSTRAINT "FK_ATTRIBUTE_VARIANT_FIVE";
       public          postgres    false    3596    231    223            �           2606    17503 '   variant_group FK_ATTRIBUTE_VARIANT_FOUR    FK CONSTRAINT     �   ALTER TABLE ONLY public.variant_group
    ADD CONSTRAINT "FK_ATTRIBUTE_VARIANT_FOUR" FOREIGN KEY (attribute_four) REFERENCES public.attribute(attribute_id) ON DELETE CASCADE;
 S   ALTER TABLE ONLY public.variant_group DROP CONSTRAINT "FK_ATTRIBUTE_VARIANT_FOUR";
       public          postgres    false    231    3596    223            �           2606    17508 &   variant_group FK_ATTRIBUTE_VARIANT_ONE    FK CONSTRAINT     �   ALTER TABLE ONLY public.variant_group
    ADD CONSTRAINT "FK_ATTRIBUTE_VARIANT_ONE" FOREIGN KEY (attribute_one) REFERENCES public.attribute(attribute_id) ON DELETE CASCADE;
 R   ALTER TABLE ONLY public.variant_group DROP CONSTRAINT "FK_ATTRIBUTE_VARIANT_ONE";
       public          postgres    false    231    223    3596            �           2606    17513 (   variant_group FK_ATTRIBUTE_VARIANT_THREE    FK CONSTRAINT     �   ALTER TABLE ONLY public.variant_group
    ADD CONSTRAINT "FK_ATTRIBUTE_VARIANT_THREE" FOREIGN KEY (attribute_three) REFERENCES public.attribute(attribute_id) ON DELETE CASCADE;
 T   ALTER TABLE ONLY public.variant_group DROP CONSTRAINT "FK_ATTRIBUTE_VARIANT_THREE";
       public          postgres    false    231    223    3596            �           2606    17518 &   variant_group FK_ATTRIBUTE_VARIANT_TWO    FK CONSTRAINT     �   ALTER TABLE ONLY public.variant_group
    ADD CONSTRAINT "FK_ATTRIBUTE_VARIANT_TWO" FOREIGN KEY (attribute_two) REFERENCES public.attribute(attribute_id) ON DELETE CASCADE;
 R   ALTER TABLE ONLY public.variant_group DROP CONSTRAINT "FK_ATTRIBUTE_VARIANT_TWO";
       public          postgres    false    3596    231    223            �           2606    17868    cart_item FK_CART_ITEM    FK CONSTRAINT     �   ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT "FK_CART_ITEM" FOREIGN KEY (cart_id) REFERENCES public.cart(cart_id) ON UPDATE CASCADE ON DELETE CASCADE;
 B   ALTER TABLE ONLY public.cart_item DROP CONSTRAINT "FK_CART_ITEM";
       public          postgres    false    3693    257    261            �           2606    17873    cart_item FK_CART_ITEM_PRODUCT    FK CONSTRAINT     �   ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT "FK_CART_ITEM_PRODUCT" FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;
 J   ALTER TABLE ONLY public.cart_item DROP CONSTRAINT "FK_CART_ITEM_PRODUCT";
       public          postgres    false    261    233    3629            �           2606    18002    cart FK_CART_SHIPPING_ZONE    FK CONSTRAINT     �   ALTER TABLE ONLY public.cart
    ADD CONSTRAINT "FK_CART_SHIPPING_ZONE" FOREIGN KEY (shipping_zone_id) REFERENCES public.shipping_zone(shipping_zone_id) ON DELETE SET NULL;
 F   ALTER TABLE ONLY public.cart DROP CONSTRAINT "FK_CART_SHIPPING_ZONE";
       public          postgres    false    257    275    3739            �           2606    17709 ,   category_description FK_CATEGORY_DESCRIPTION    FK CONSTRAINT     �   ALTER TABLE ONLY public.category_description
    ADD CONSTRAINT "FK_CATEGORY_DESCRIPTION" FOREIGN KEY (category_description_category_id) REFERENCES public.category(category_id) ON DELETE CASCADE;
 X   ALTER TABLE ONLY public.category_description DROP CONSTRAINT "FK_CATEGORY_DESCRIPTION";
       public          postgres    false    245    247    3661                       2606    18096 ,   cms_page_description FK_CMS_PAGE_DESCRIPTION    FK CONSTRAINT     �   ALTER TABLE ONLY public.cms_page_description
    ADD CONSTRAINT "FK_CMS_PAGE_DESCRIPTION" FOREIGN KEY (cms_page_description_cms_page_id) REFERENCES public.cms_page(cms_page_id) ON UPDATE CASCADE ON DELETE CASCADE;
 X   ALTER TABLE ONLY public.cms_page_description DROP CONSTRAINT "FK_CMS_PAGE_DESCRIPTION";
       public          postgres    false    3762    283    285            �           2606    17738 -   product_collection FK_COLLECTION_PRODUCT_LINK    FK CONSTRAINT     �   ALTER TABLE ONLY public.product_collection
    ADD CONSTRAINT "FK_COLLECTION_PRODUCT_LINK" FOREIGN KEY (collection_id) REFERENCES public.collection(collection_id) ON DELETE CASCADE;
 Y   ALTER TABLE ONLY public.product_collection DROP CONSTRAINT "FK_COLLECTION_PRODUCT_LINK";
       public          postgres    false    251    3674    249                       2606    18167 $   customer_address FK_CUSTOMER_ADDRESS    FK CONSTRAINT     �   ALTER TABLE ONLY public.customer_address
    ADD CONSTRAINT "FK_CUSTOMER_ADDRESS" FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE CASCADE;
 P   ALTER TABLE ONLY public.customer_address DROP CONSTRAINT "FK_CUSTOMER_ADDRESS";
       public          postgres    false    293    291    3782                       2606    18148    customer FK_CUSTOMER_GROUP    FK CONSTRAINT     �   ALTER TABLE ONLY public.customer
    ADD CONSTRAINT "FK_CUSTOMER_GROUP" FOREIGN KEY (group_id) REFERENCES public.customer_group(customer_group_id) ON DELETE SET NULL;
 F   ALTER TABLE ONLY public.customer DROP CONSTRAINT "FK_CUSTOMER_GROUP";
       public          postgres    false    291    289    3775            �           2606    17624 2   product_custom_option_value FK_CUSTOM_OPTION_VALUE    FK CONSTRAINT     �   ALTER TABLE ONLY public.product_custom_option_value
    ADD CONSTRAINT "FK_CUSTOM_OPTION_VALUE" FOREIGN KEY (option_id) REFERENCES public.product_custom_option(product_custom_option_id) ON DELETE CASCADE;
 ^   ALTER TABLE ONLY public.product_custom_option_value DROP CONSTRAINT "FK_CUSTOM_OPTION_VALUE";
       public          postgres    false    3641    239    237            �           2606    17476 "   attribute_group_link FK_GROUP_LINK    FK CONSTRAINT     �   ALTER TABLE ONLY public.attribute_group_link
    ADD CONSTRAINT "FK_GROUP_LINK" FOREIGN KEY (group_id) REFERENCES public.attribute_group(attribute_group_id) ON DELETE CASCADE;
 N   ALTER TABLE ONLY public.attribute_group_link DROP CONSTRAINT "FK_GROUP_LINK";
       public          postgres    false    227    229    3605                       2606    18061 #   shipping_zone_method FK_METHOD_ZONE    FK CONSTRAINT     �   ALTER TABLE ONLY public.shipping_zone_method
    ADD CONSTRAINT "FK_METHOD_ZONE" FOREIGN KEY (method_id) REFERENCES public.shipping_method(shipping_method_id) ON DELETE CASCADE;
 O   ALTER TABLE ONLY public.shipping_zone_method DROP CONSTRAINT "FK_METHOD_ZONE";
       public          postgres    false    279    281    3752                        2606    17944    order_item FK_ORDER    FK CONSTRAINT     �   ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT "FK_ORDER" FOREIGN KEY (order_item_order_id) REFERENCES public."order"(order_id) ON DELETE CASCADE;
 ?   ALTER TABLE ONLY public.order_item DROP CONSTRAINT "FK_ORDER";
       public          postgres    false    3709    263    269            �           2606    17915     order_activity FK_ORDER_ACTIVITY    FK CONSTRAINT     �   ALTER TABLE ONLY public.order_activity
    ADD CONSTRAINT "FK_ORDER_ACTIVITY" FOREIGN KEY (order_activity_order_id) REFERENCES public."order"(order_id) ON DELETE CASCADE;
 L   ALTER TABLE ONLY public.order_activity DROP CONSTRAINT "FK_ORDER_ACTIVITY";
       public          postgres    false    265    3709    263                       2606    17983    shipment FK_ORDER_SHIPMENT    FK CONSTRAINT     �   ALTER TABLE ONLY public.shipment
    ADD CONSTRAINT "FK_ORDER_SHIPMENT" FOREIGN KEY (shipment_order_id) REFERENCES public."order"(order_id) ON DELETE CASCADE;
 F   ALTER TABLE ONLY public.shipment DROP CONSTRAINT "FK_ORDER_SHIPMENT";
       public          postgres    false    3709    263    273                       2606    17964 0   payment_transaction FK_PAYMENT_TRANSACTION_ORDER    FK CONSTRAINT     �   ALTER TABLE ONLY public.payment_transaction
    ADD CONSTRAINT "FK_PAYMENT_TRANSACTION_ORDER" FOREIGN KEY (payment_transaction_order_id) REFERENCES public."order"(order_id) ON UPDATE CASCADE ON DELETE CASCADE;
 \   ALTER TABLE ONLY public.payment_transaction DROP CONSTRAINT "FK_PAYMENT_TRANSACTION_ORDER";
       public          postgres    false    271    3709    263            �           2606    17551 "   product FK_PRODUCT_ATTRIBUTE_GROUP    FK CONSTRAINT     �   ALTER TABLE ONLY public.product
    ADD CONSTRAINT "FK_PRODUCT_ATTRIBUTE_GROUP" FOREIGN KEY (group_id) REFERENCES public.attribute_group(attribute_group_id) ON DELETE SET NULL;
 N   ALTER TABLE ONLY public.product DROP CONSTRAINT "FK_PRODUCT_ATTRIBUTE_GROUP";
       public          postgres    false    227    3605    233            �           2606    17586 7   product_attribute_value_index FK_PRODUCT_ATTRIBUTE_LINK    FK CONSTRAINT     �   ALTER TABLE ONLY public.product_attribute_value_index
    ADD CONSTRAINT "FK_PRODUCT_ATTRIBUTE_LINK" FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;
 c   ALTER TABLE ONLY public.product_attribute_value_index DROP CONSTRAINT "FK_PRODUCT_ATTRIBUTE_LINK";
       public          postgres    false    233    3629    235            �           2606    17743 -   product_collection FK_PRODUCT_COLLECTION_LINK    FK CONSTRAINT     �   ALTER TABLE ONLY public.product_collection
    ADD CONSTRAINT "FK_PRODUCT_COLLECTION_LINK" FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;
 Y   ALTER TABLE ONLY public.product_collection DROP CONSTRAINT "FK_PRODUCT_COLLECTION_LINK";
       public          postgres    false    251    3629    233            �           2606    17606 .   product_custom_option FK_PRODUCT_CUSTOM_OPTION    FK CONSTRAINT     �   ALTER TABLE ONLY public.product_custom_option
    ADD CONSTRAINT "FK_PRODUCT_CUSTOM_OPTION" FOREIGN KEY (product_custom_option_product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;
 Z   ALTER TABLE ONLY public.product_custom_option DROP CONSTRAINT "FK_PRODUCT_CUSTOM_OPTION";
       public          postgres    false    233    3629    237            �           2606    17642 *   product_description FK_PRODUCT_DESCRIPTION    FK CONSTRAINT     �   ALTER TABLE ONLY public.product_description
    ADD CONSTRAINT "FK_PRODUCT_DESCRIPTION" FOREIGN KEY (product_description_product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;
 V   ALTER TABLE ONLY public.product_description DROP CONSTRAINT "FK_PRODUCT_DESCRIPTION";
       public          postgres    false    3629    233    241            �           2606    17659 #   product_image FK_PRODUCT_IMAGE_LINK    FK CONSTRAINT     �   ALTER TABLE ONLY public.product_image
    ADD CONSTRAINT "FK_PRODUCT_IMAGE_LINK" FOREIGN KEY (product_image_product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;
 O   ALTER TABLE ONLY public.product_image DROP CONSTRAINT "FK_PRODUCT_IMAGE_LINK";
       public          postgres    false    3629    243    233            �           2606    17556     product FK_PRODUCT_VARIANT_GROUP    FK CONSTRAINT     �   ALTER TABLE ONLY public.product
    ADD CONSTRAINT "FK_PRODUCT_VARIANT_GROUP" FOREIGN KEY (variant_group_id) REFERENCES public.variant_group(variant_group_id) ON DELETE SET NULL;
 L   ALTER TABLE ONLY public.product DROP CONSTRAINT "FK_PRODUCT_VARIANT_GROUP";
       public          postgres    false    3621    231    233            	           2606    18192 5   reset_password_token FK_RESET_PASSWORD_TOKEN_CUSTOMER    FK CONSTRAINT     �   ALTER TABLE ONLY public.reset_password_token
    ADD CONSTRAINT "FK_RESET_PASSWORD_TOKEN_CUSTOMER" FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE CASCADE;
 a   ALTER TABLE ONLY public.reset_password_token DROP CONSTRAINT "FK_RESET_PASSWORD_TOKEN_CUSTOMER";
       public          postgres    false    291    3782    295                       2606    18021 0   shipping_zone_province FK_SHIPPING_ZONE_PROVINCE    FK CONSTRAINT     �   ALTER TABLE ONLY public.shipping_zone_province
    ADD CONSTRAINT "FK_SHIPPING_ZONE_PROVINCE" FOREIGN KEY (zone_id) REFERENCES public.shipping_zone(shipping_zone_id) ON DELETE CASCADE;
 \   ALTER TABLE ONLY public.shipping_zone_province DROP CONSTRAINT "FK_SHIPPING_ZONE_PROVINCE";
       public          postgres    false    3739    277    275            �           2606    18285    product FK_TAX_CLASS    FK CONSTRAINT     �   ALTER TABLE ONLY public.product
    ADD CONSTRAINT "FK_TAX_CLASS" FOREIGN KEY (tax_class) REFERENCES public.tax_class(tax_class_id) ON DELETE SET NULL;
 @   ALTER TABLE ONLY public.product DROP CONSTRAINT "FK_TAX_CLASS";
       public          postgres    false    3805    233    301            
           2606    18311    tax_rate FK_TAX_RATE_TAX_CLASS    FK CONSTRAINT     �   ALTER TABLE ONLY public.tax_rate
    ADD CONSTRAINT "FK_TAX_RATE_TAX_CLASS" FOREIGN KEY (tax_class_id) REFERENCES public.tax_class(tax_class_id) ON DELETE CASCADE;
 J   ALTER TABLE ONLY public.tax_rate DROP CONSTRAINT "FK_TAX_RATE_TAX_CLASS";
       public          postgres    false    3805    301    303                       2606    18056 #   shipping_zone_method FK_ZONE_METHOD    FK CONSTRAINT     �   ALTER TABLE ONLY public.shipping_zone_method
    ADD CONSTRAINT "FK_ZONE_METHOD" FOREIGN KEY (zone_id) REFERENCES public.shipping_zone(shipping_zone_id) ON DELETE CASCADE;
 O   ALTER TABLE ONLY public.shipping_zone_method DROP CONSTRAINT "FK_ZONE_METHOD";
       public          postgres    false    281    3739    275            �           2606    17770 &   product PRODUCT_CATEGORY_ID_CONSTRAINT    FK CONSTRAINT     �   ALTER TABLE ONLY public.product
    ADD CONSTRAINT "PRODUCT_CATEGORY_ID_CONSTRAINT" FOREIGN KEY (category_id) REFERENCES public.category(category_id) ON DELETE SET NULL;
 R   ALTER TABLE ONLY public.product DROP CONSTRAINT "PRODUCT_CATEGORY_ID_CONSTRAINT";
       public          postgres    false    233    3661    245            �           2606    17812 =   product_inventory PRODUCT_INVENTORY_PRODUCT_ID_CONSTANTSRAINT    FK CONSTRAINT     �   ALTER TABLE ONLY public.product_inventory
    ADD CONSTRAINT "PRODUCT_INVENTORY_PRODUCT_ID_CONSTANTSRAINT" FOREIGN KEY (product_inventory_product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;
 i   ALTER TABLE ONLY public.product_inventory DROP CONSTRAINT "PRODUCT_INVENTORY_PRODUCT_ID_CONSTANTSRAINT";
       public          postgres    false    233    255    3629            �   �   x�}�M�0 �����ֻ�9�΂���n������?����"7��>���
�n�����4L�/=Å@3j��W����C�
N�m�?-}脴��e����w�2Á��>U䙘M�䍦�g��_f�a�ވ�`�2rF$	|�_�+�,�}�2\      �   p   x�]�=
�0@�Y�����v4�]����@�����g��m��V2�#cs�(WcCeYepc/�؏'\���M0!�LQ�Y/�n�Q�)j���I�J�\��+��寿/)�7��#�      �   V   x�}ɱ�  �����!P;�!PY��n�]W�"� �X�GQ�8��Le%��ι�{?��@��rK�"�)����� P��      �      x�3�4�4�2�4�1z\\\ 	      �   �   x�=��N1D��_��q6-�QQpH4��+N��ҁ���
�q�f޸$#q�
S �(�HuYD�n����؏{zy�}E�]�P�ظ��ڡ�p�bҺ������l
�*�|^�aF���mŊ�	�ƾߙSd�&����5UPõ�c�(����'��z�-1w���'h�E_A�*���4��z�,)�-d "hs����%�a��V���)�=�^�P&      �   `  x���[KBAǟ�O�{�a�gv�S���{;f���dاo%����v.;�IPtF[0H%Hj8XJ�l����ܷ��^=}��T�%�p�]���9��>�]�K8a䥊����jP��2_��/��!��B��tֺ�\�K����MA�J���s��� ��C��R�����$7#[7����+�W�\��s�a�l��p���r`N�ʁ�&�ł�,T
�H��~��D{�
N{K��%s�Ɯ��������x��f�m¬P��"C�s�x'�⫈㎕��0 HK#h-`t*��|�|�	ek�hyj��6�L�5��2��nGW��Y����_�i      �     x����n�1�י���Jl'�w U*-�%+6έ�Lۑ	����"~)J6��b��0��,�)���l�Zf�����%p$�DkΙ�p��n߆��x<�~|����ХI[sB��kN��j�ܵ-���!L�R1�e�#��ڀX����j�w���/O�/��<>��麟�/c��}E�B������U�r�A�99X/�RSo�pj���r�)�����';���ڳ����x:}�z�z�PJ��8P�Sh���8f��)��)m���W�I�b��Mo`}*D���P��"����kO�zZch$�f����Ӽ�9�W9��e�v�x�9@Cm��:�X����bA��5�`ɲ�bЂ�d�E����K�9�q2��p!jiD�)� #&�1-�>�Tm�j�I�![�%+ #`}�Z'���@�1�X�^�Cx�{<T��Ih�.���
��-���/���/�?'0q�mơu��=Pm��@Xc��Z��m���cl8{�HOԛ%^ĩ)kI�f���|���~ �c��      �   f  x�}��n�0�k�)�V�]��u��H��iH��8qNb���"9�,G�3�Y,�4�MB-��8(*I��4I�4X2B	#�;p���8цy�en�P��rlYJ��|;>�c���ޞc�������8���nd�!���y��FրD5��]c$*i�,k�me������=%P�EG�\��,���w��8]��ל�����K�}�P�&E�Z�ʶ�������g����'"�Cw����J�dK~�� Sn��2kdWm�y��n�Tx"�C4!iG$�`�?�;k�؟8c_T�<ՇK�4��Y�u���"���67�-�:�[�h��ec�3��uY=6UU}�;�      �   ~   x�}��B1 �d
z��v�9C0�k���/hh@�t��A�d�>�p3�u�Z`�c,���1<����� ��em��P�;��%��mX	j��
��ʋ2v��t�#n�k���v�5�)���P0�      �   t  x�}RMo�0=��b:[���[��a0���D%n�ؐ��[��>;����E�'>��H��;�'�����iʩJT�<����i-i�_��5Z�hY8��p��R"UF��
%+#HFB�I#3b������0�u�
ɧ&aYA�@G�tl)����o<#"���v7��yUUu����]o/�o��rs�ܲO�D�9�����,d`�m��<��\<�q{�{��4����Ǎ�{���1�-Έk;���bcX,N�C�0����UF~���"�<gԛ��l�G�.�XI����BQ��S(+^qˀ��b�{j&
������|�����v�g ��¢��q�N'�>>�A����J�p���7���4����      �   P   x�}��� �3�»��-%f�R&p�����$��u��Y�m7n+&�k}F{�7)�0���k�9_�
�����}�E��      �   _  x�M��N�0���S,�^���]��J�J	9��FecK[T$$��o��	�n�����9�Ѡ�ej�<�,HF�z]Q��"�"`!�A^�DLMRc�Ⰴ	�H2����f�I���5υ��(�ɔs�Y�&iNK΃T��F��Q����M�0e	OS��H^�b;�3��&n[�0�ξ (�t2�ựѼ�
v�=�ꖭr篨��e�s�?��y�+�>((���4wi5��ɻt�/f�Qn����-�p�+��6�p�����ZU�"Y	����T���X�Fl�JJi���lZ����o��_:�숧�G�^�\�!�'T	?���~�3z�G������      �   k   x�}ɻ�0 �Z��>'N�GHM���l���l�k����Ć�Lc?)*�bP�l�JT����ܭ6�ֳxa^�����OH��!����(Q�At���:�.�U!"         �   x�}�Mn� ����k�`�>D*u[G�����jE�{ �"��f1��FC�6u[��%���dTJ��ݨ�
����|��k��TA�'�g��6(��QF'��7�ym<:���'+�o�?���+�JL�g�O����� �=�e��I6��[�Y�`�K��xu��� r"]mL`�BIYG�N��s�a�#=�v[�UQ��J�           x�}��N�@E��W�`g��{}� +���"�����LU�P
�|��Ę�<�ɹ��f��(aZ)	�a&�)� P�X��
RN{˓|�aS�+O�©#�A֛�|�\���۝�p�R>����2�ʻ������Qֻ/h�{N|���j���@H kR�lx������S�P��&��N��!�C��
��|��v>�®��do�����6��Od��+�W���q�C8�&����F�M�����m�@;8�y�����/�z��~��d	         �   x���M
�0@����˔��4�;A�
v骛�R	���`o <��c#�tQd��L����$)�ne*��̳tp�۫�Os)�
� �4��#��}~g�؟vAHI��a9�)��օp �s����s��&�          U   x�}ɻ�0�:��9z�đ���!����ـk��г5�I��Af5�+@&Uf#�~�x�'	��|S�X����
�o>J�����      �   *  x��ko�6�?+�"�m���ş�u��ݺ!ݺ-`P�8�lɑ�i���#;�Ėc'Kl($�xxH�$��u��k�"�q�%�T0$E���W����r������O>��W�O��i:�4R�#��+�M��;��X!N���1kDH����֓�b�*'�y�0�� ���gy��ü�r5Fv<�(���'�>!�����������U=Q���b�cP���٫�/�^���#z����G�ŷ?���2��`�+�0@�WM;���K(�\��PB1SD��Xu�r�a�(ʾ���1�OF��e��fȁI�!ZE,��"�GFH�Ǳ��G��r*����u�e6���'{j����8T�Qӟv9�f& %		ZsO��x��`/Pp�J�Q4&yq���.{W� �ʁO���QU���{ˠF���`�fpV_NE���C����v�j��g�AN�僼	mJ>==L�p�(M_�Sw��R�1�p!�r��ik�e�L���`AZ +�8�.r�]c��1	|�>`���.�i������DIK��i�H��2c�SN�L[磻��tר�|T��%}���%e��UGbƦ���D3��Vp���jj�2�
�Îw�H~'EɮA�����+���o(J`�w(���FR�4f��G�	�(րјa��X	����%�")�ʻBu���\#�`�T�L�bVK�U�P��l�%��*���Ytq�K����̺0���s)	��{.�>{|���r4�n�x��ˋ�׷��U���W��HN�)�o��7�yc�'����0~6<�oO�}�n�����Lz,U|����2�p3�@��0c�����Q���A¢�r���������6���(Xҙx"��a��2&�êE�k�*�C�<3!&�r�-���u[���)��_`>���rG��vڻ:�+[�e�[�)@�s����*?���w�q��Ǘ��1�p���.~�$���d��
j���de>�� am5� �ϓ�
��͝�9n
�f~�|��-�6gq2nr��C�>l�z���)��PO��(/��B/�w�^mߧ]܁���X/���u��?+�&Y�.k;���/W2��^��io�z���t���y����鵌Pi���w�,Ĳ
+}�Х-���(�0�Z�[4��C}Z6�.��t�����5�D�Y
�0�nT�/�o�><���b���x�8���ĲI��_�������ï� ?Us��i���Κ�&X,�Q(<��n)ڊ�Ţ�&�����?���y�Τ��B&,��pb�e����L�!���ib�nU�%U	6:`�*��-H��F\a�.`�V�^a~4�w�)���Og;!���e��W�.Y�����Ӿ�|��{mIy�ŭ� my����ړ�f���}�����t��m�~>7�p"�3��p�	SL�E$���5�F�F��k���7xХo���I�l p��,r��'pY���H'z���Nj�	U�q�R�\h[��v�����H�#Ӄ*�˃���
�.��d/����^�@��z(�I΁I�0`�<�s*Z�5��~���U�*��I�(�H���+�v�!c��Jm����g�߯�T;�����w�m-_w������с΀���s����I���q��jڐ��w�$Jg����!N=p	[��f�G�eWp�e������Y���zJ`�ɚ���Co(�f�%M��2>"/�K<fY'��
/��߮7+���)B��w8UJ�i�X�e$.
��Q��+�te�N>X'�S �� @��>�����+�i�������      �   �   x�}�Kn� D�ݧ�>����%bY�Q�!c)�rb���Wzi-7`G�AH���B����z��D���2�i"S�M�N�ØJ����3҃o��)��x��ϼ��yu�d��m;P��y�"n^�F�����Z������f^8��(J���j/_���`�u�(=|?��=?�t�$ڽv�J�L��/i�������P�ϙh�>حv�o*��      �   E  x��Q�J�@}�|E�e��^�M��E�
_JA6�I��IlcK�z7�T-U+,�a�z�̐#�b�-��*.,O��\)(�Y��3l6f��e9�O�����URM��Q������u�� �i��O�`/��.�f޴�(o�O?k��|p�1��/=ߡ����D�dY�s0�'��м�InE�$J�n*ۅ��,o�����GT�kZn=��jW��
����!���H�V/��߳�3d^`Ayb8H���rc���1)x���ڣ?}�Vԑ�4�r�z(�>ß8��<�`nzv�-ݱ�z��3~Xr��ހY��ֹl      �     x���;N1�:9���#�yM�� \�&/�H<V3�p}B�bQR�H��vBʛ��4�*b��\!�����%T������-�[U��2M�+��q�Ő	w���U�%f�R��V��5p�J+դ�?4���!g��T�$4�� T=��r�N#B&��}���q~��)mu����T��<�
�Np��~��*�$-�b��@f�A�!6WЇz]�g:��y;���dg�!��+�Na4	� 0�\�cv����+\�����ۏ����a�ަ�q�Z����      �   �   x����N�@�k�)�>m�^�݁��8ЕT��� �8	��'%�I#�ͧ�	�X���Ƅ�c��{AR'����k��:�B���N���^ӵ��߱����@�Z4e4UA��0�7L:���� �5��WE�R1E�[�h���y8�y�S��?���/�w��z}�q���P�e�0�n�M$X�L�������ru�k7c·a~�k      �   �   x�}��j�0���S�[rb;�^v���^\ONRZ:b���2:	}|�ߏ@����&h���1a9&i�cj����Ǿ��;���r�⡗PF��#$�3�Ŗ�U%��r޳���t�d,���R_�d b]�%�Ć�W�V����++�S
"):�ͧ��[g#��@�����=�0��\V�lL���DԵ}������'h��\w���s]U��m�      �   g   x��A
1ϓWx�	ݓLH��`/a�ATD��n�����*ݨ��kFKZ�h��Q��Y����5���܅����m���}�S�
S�B[Ж���K�W �1����D      �   �   x���=k�0�Y�݋�,ٲ��J�p�%����
����球N�A6�B<�
*R�RF����1�`X�h�$%s�����s�����i~���H� ��y}�L��P�8NF�SLo{���rL�mZ%��>K�u傕�m�,��p<����7��q��Itr2�W�n��L;ʁH��1���г	f�Ye�b�n���C��;�~Qt-�<G�a5$J���6L�)n-��%�距i>��^��H�kZ�a> )Z}�      �      x������ � �      �   !   x�3�4�4�2�F\&@҄�H�q��qqq 4pv      �      x������ � �      �      x������ � �      �   �  x���Ko�8��� tًiȖdK�-�]�ݽ$=�E0��"B�I�q�|��N�` E�^�����?�f���^��}��}�7����6Y�-��ʮ�S���҆`�:�e�������i)�-��Z�EI�/�B�^�u%�e�Ճ�/�˜Y=��O>���y[�e�fK�rS�F̗��7����}p�_|˃�aW���v]6E������������	��pE����>�W��ه#�	�#zb'G�߇��'Z��p�J|Z!o�� �Yj�=�''#�bH�!�<n�H��-G-H����)HbA:�{�p��$$ts��(�d��gBka�oDZG4�SfO�4߂�UPր&^��ƧNh������_�$�'�x,Sev@�aN%�z�'����.ɡ��`��	m'���XmoA0����o�}��0�U���u��	�1C�,�U�^Ա�..=ΐ�ZIS+��o��C��&�d����~�M�R>Z���9���jJA�u[�
U@;)�.Q�z���%�o�]Q�?��2H�3�x݃A���FGV�ҁg2:1�i {a&e�ۧ�Kd]���|I��,�N�ϊK\%R��(^�͹���v>��0�y�to'�&U��0���a,HS%sH4�v���C��)2�pZ�)�-���S<�՚"��O�~�Qz��^�$�AŲx*�Y��Z��X�)�k�����SC�)ڛ���}���ٟ�:l�?p����W�׬l��;
M��j�$ל���i�V6��~�M�i7E��������T0�c��f����5�4쥶�y�F�+&�dL\���)�`L�bP<(��0*,�{;ă{p\�D��?�4�� �O:��}�+(���Hߣp������t���'팂�hc�����2,5��07��2����|
��S#ح�ZO���o�"����Nפ����k�=M�&��S�u�yT���i#5�����wH~�e�e�X,����      �   �   x���A� E�pP�]�AC,m�Io_�&6J����f���&`B�1@k����j%O���P�7��R,^�����.D7v�aF����
"SQ��R��8���܃g̴lz"�%����������t~W��''����YiK�VJ��J	�^�"�(�9�U����r�69�ב���,�T      �   .   x�3�4�445�,�,�2�Bۈӈ����6�4ㄈ��qqq ߩ�            x������ � �      �     x���Qo�0���_1��dvb;��(a�f�-�ҲMUp�Ɛ;���ҦJ}���fK��;:��&��.���}���u�E7
�LW�I�KO^�(�������T�jg�s�q��(�o���F�R\��6r'qs�t���*�ߒ8ӲRc6��l�)��}�t_�3x�uaT�DlT��W���*-˳p�z��'�r�rL���ы�7o��+s���i ���ٍ�w!h)�('�C0l+�=�����4_��IG�nZ_'"j��>��YM��|wz�a��/B�fЛU��� G���[�l4�ؾ�Hߕm�'���!�qm���?D�m>��wc-$iү_VK���	���4�q��w6�G=T���0������e�I~[�^d��pn�fT���Ja��|LuK57�� ��y���x��I�l�~��m��;���yqi��|�@	����l����v��1�, �w�6E~������Z�׹���}v[�����L��+���[���x��0|t�<�1�~8�e�l�ٮ      
   �  x�eTMo+7<+���y���S�$(��iд=<�BI�˶����u~}��S$�O�B3�4*�6�l�����j&h5����Ѩy�|O;V_����_X�Ť�����L�1-Ԃ���7<�ð_�iTW��jG���m���y\_�S�B��"T[�hi(h�K���>><M#�?�
T�B�Ƣ�xE٧�t���$Ⱥq��1t>���hت��2�O��Q����O�u�	UP�R)�pw|rJll��`B�|?Q]O��r8��{FUS�:K��_L�ĐrmuZ�9�Z;�<�?h��`Q���I�@�'�l5����>�;����?`R����r\�Q'�W�H��B!wV�p�^���ȅ���썎���bk��֝s�ٵ�i^h{=5V^KV�&�H�h��
���sA�lw�q�@R�t��<.�<�ʬY�*:k��uo��ت�֪�_D�3�[:�����mX6�th+�Q�5%���$Bk�dl�E"����h�e<��0?Q��O|T+�*�U|�A;�К��IG��0Pzo�끗w�S}p�=X��
ki�S!�h}o�oǶ������U4T�t���WDT��*���;����yB�����@6(J��HvS8��	j#�=B�sn��㞶���W|T�u� �����B1��ȺJ|mlg��)<�}XP%c}2) 9#9��!K|���;�"��p�D�]{�?��љL8�\"eq{cp]s,rcl͟���r�7�g��%?Af^�tN�������ގ/�a���Ӳ���|�� �˙�V�.O��w�i	wO��{�"MK������R{�l�ݸ���W������bT͒b-�E�wF.'�&�6�cPN����N�L.q��B'YKIC�Lk�/_�C�|V��?.�O�_��o����/������	=��      �   V   x�}ʱ� ��L�>2�7`fIf��Q��|�K]���g����f-)�)�f�@{�����haQhr����ȿ�;�^$&�      �   >   x�3�LM50OJ2K�5�05�51IKԵ400�M35ON4JJ1646�t�I,QJ,I����� {:�      �   ^   x�Ǳ�@ �v!���2�]��i ~$��c�S�ʔ�BZ��k�����X9:�۝q�{Gq��5h�Yԛק-̂�/jp|�}!���      �   L   x�3�4�4�,�47�3 �?4�eTaT�&]���_\�d��dn�������_P���
260P��i����� ba�      �   \   x�%ʱ�0�����,[��*���4X2��@����&a0����w3���#ӵp�n��ei��d��	�5w�z�����|�� ����         @   x�3�005�L15�5�4M�2t-�,t-�R�����M9C+�rR���S��b���� �jb         D   x����0����; ��AI��ĝ"Fߓ�G���isdW:��󔋏�l4|�z7U}@!      �   .  x����n�0Eg�_X�-���cJ�� N�.��}� N2z��{t	�(�$ƙ:�3-����XeP\b����,]���*U%vA[����N��G�9@�<�b<�V��2���! �*�j4���H,k���[���K;��{C���T�dI�a�A61K��*�.��P٫���⣐7&G/��	��RqeMJ>��t�����j�D�|�01-_�ajT�?m}���T �L"���h�g+�����v,K?��@n��N0_�p�`�#)�5*��*;�:�wb��m⏗a� ��i      �      x������ � �      �   �	  x��Yis���L��7�4�N���f�f�qk%�ة��h�6H0 (J����<p�Fk;��ܷ��܋{)>ЅѡP>�����$Vː��T�����[6!'��¤n���pٝ��:{?x}0�ga�'��-���wa������������͛�2ǯ!~��󌉢ȥK
�D��I.�ʨ��f'�Ӗ��DVW�ټ��m����΋"3^&R�H.�Bjr�t��O��w>�_W���+��RT9�����ݿ�.��gfú�Z���4�<4��[R��͙�eޒvZ����*d]Y�7W�p���oI=iԧ��hu_��7~����a��z�v�2�ڢ�g�Z^.�+2���sH*�}<�9��l;���&_�&���E9��vQ7�C��
�,�)�-��y�d�D6��`f+��Y4u]�o��.����"U9����Y݄j޵<�Ջ�{�C��[�����ݬ����=�6�������=��y&Y��v�3^v]='�����j����;�Lڅ����zA"��x�]�	�z�F�.��ud�"<4�{��3o���h�_2�EbE6N�\��d��ρ�{�����(������E`��q�S���Yw6�y�G�q��T���������*������̭�a�;@׸DJ>NƀR�3�r#9����H֌?���叿�z���{J� �����")�����$4�������lO��9���o?�=8$���,��%67ɪ̻���A7�����QB�P�!)g����>��BZϨ̒����ć�%�S���0+��{_"T~>ͭ^�m�V�UZ�٘�q������SPG�&�S�/�꫄�V��%�,��l�R�NR�-����X8f,���|(����^�=~|z����I����vWU�"h�ɴE��� F�r�t�bHф�1<���4�r�#��o$n^"S�̄���|�}���*=9&y�.*5$E��W�d��]��C��nh��;�kY\%��x�q��aN�^�?E��_�Q:$hz�$�:&����!������?"<��cQ����˦����o�J���Ş��2�ח��l��I�=Q�U�ݞ��]��U�]��v�bxt�Z�ҕH�fr��#��=~�@�nz�~�\��M\�@1%������B]�R�N',e�E�ƃ����T�SE-;���J9� ��:u���3�MJ�I�Ja4�D����?T�,'Z������hn�nr��%ʛ�Ģ9Z�sb�D������jR\z�R�L� ͠�p'Q+�S��Q���)�Fa-ש⎀6ԺQ���v�)�a��yJ� N��E\�J��M�6t�,�|mZT��T	vm9h����rMb[����m3"\
�G�*�F��M�G�?�0R�J�uڜp�jq�fZ�{!��6�Hx�sA�#G�'#'�#ףo�\#zum��Re�u�z��Rf�el�v%4�aNC�i%;ax�8��VY|�]A$l��l�C��8�
Ҍ?��9t�-�.��$���`�+�Ë��,$TE[.��58*�$F�INn���}�ɡ;�룘6��ONG�Q�=H��	T�B��@.�HiA��~�|�{J�%h�-GK�Z�i�|t��\%ũ��dV�˰�h/�n	���4�j�s�X�}虂S-��Y�\�=m���[�M9(c��� �9���Q�$D�_8_�68��j@�d�[�
d+h+b��"R�r�˱+4"n;�cI�I�۠���;�5�1,��p�F1�]t�&*}>���&�B� ؑ���m��=˩�ε5=�U��>@ �h-�(C����C:X`ݠ(��5�?r�X�]P1ڢji��c�``P�@j"��gʉu��B;��[�����km�tD�T�z?F[F��]�AK�w�ɭ�E�D�n�� F�]�c�8+ǭP|a��]���^Gq�����g�U(�=�G;B���;��s%�3�����۾⋢�r��U�l�L�q:z���є}wǾ�GY�=�7M�Z]Bo*|�yjF�E���<^!m�L�!X�[��:��͢N�*��<o|h�|�e�5eVbPm��W�;+1�u�n�	���E �,]GmO�n`_��v�g9��q�w�7���}}Ln4��-W�����CV7>��C�9\���Il��hnUd�{y�i��u��t��'Ϟ�����>��{K�ѿ%M���N���/�ŀ:�>�E(�Klዄ�"�&c�����7u�̺vp�Y��b��я�y�h>C��)���ъݭ/�v��H�����+/������0��3�t6�\^���}[f�ޗw5�D�����-�|�+FŨ�;�2�]�����(~�1&˦�[G��Q����&H�BW�H���{�5��oyN���!������8A6���"�c?-��	�i���m�#�����P�!��]Y�����7�G��]�k+     