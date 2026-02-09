--
-- PostgreSQL database cluster dump
--

-- Started on 2026-02-06 16:16:01

\restrict WX1nGqnldzSrZVgjHVxfz8Qbygxy4o0YNxGawGTVCYnPDVLOxKKn9tj9qT7UtFS

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:yNuB2gNriUQwU2XZdMvTRA==$HFQsoKrYtEra73im38JpfY0xmgASIU7MPy6Ly2xo+QA=:XCE59BiR/uAeniJwxw7F7ihTA8gCq8Tfw1vp/EITy0I=';

--
-- User Configurations
--








\unrestrict WX1nGqnldzSrZVgjHVxfz8Qbygxy4o0YNxGawGTVCYnPDVLOxKKn9tj9qT7UtFS

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict xMEoOa0jPhX8uU66WUhEesfF7Wzr69oeUmS2ZEGTSkrMxnlMf3PqBgaohlTi5eh

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2026-02-06 16:16:01

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Completed on 2026-02-06 16:16:01

--
-- PostgreSQL database dump complete
--

\unrestrict xMEoOa0jPhX8uU66WUhEesfF7Wzr69oeUmS2ZEGTSkrMxnlMf3PqBgaohlTi5eh

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict VlgtRTmcziljkufueJdQSacIMH4wTkojBbRp1TsbQirwe1fhGAPvPY3TCF20V9z

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2026-02-06 16:16:01

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Completed on 2026-02-06 16:16:01

--
-- PostgreSQL database dump complete
--

\unrestrict VlgtRTmcziljkufueJdQSacIMH4wTkojBbRp1TsbQirwe1fhGAPvPY3TCF20V9z

--
-- Database "salon_booking" dump
--

--
-- PostgreSQL database dump
--

\restrict 4gYX4PEKrbwCzieLKyBem9PIRAa7OpRMiCw9wveFrVEyxYqZOYwIpcdadQQ4at6

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2026-02-06 16:16:02

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5097 (class 1262 OID 16387)
-- Name: salon_booking; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE salon_booking WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.1252';


ALTER DATABASE salon_booking OWNER TO postgres;

\unrestrict 4gYX4PEKrbwCzieLKyBem9PIRAa7OpRMiCw9wveFrVEyxYqZOYwIpcdadQQ4at6
\connect salon_booking
\restrict 4gYX4PEKrbwCzieLKyBem9PIRAa7OpRMiCw9wveFrVEyxYqZOYwIpcdadQQ4at6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 243 (class 1255 OID 16599)
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_timestamp() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 234 (class 1259 OID 16603)
-- Name: appointment_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointment_status (
    id integer NOT NULL,
    status_name character varying(50) NOT NULL,
    description text
);


ALTER TABLE public.appointment_status OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16602)
-- Name: appointment_status_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.appointment_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointment_status_id_seq OWNER TO postgres;

--
-- TOC entry 5098 (class 0 OID 0)
-- Dependencies: 233
-- Name: appointment_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.appointment_status_id_seq OWNED BY public.appointment_status.id;


--
-- TOC entry 224 (class 1259 OID 16471)
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    id integer NOT NULL,
    customer_id integer,
    appointment_date timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    appointment_time time without time zone NOT NULL,
    service_id integer,
    staff_id integer,
    salon_id integer,
    total_amount numeric(10,2),
    payment_status character varying(20) DEFAULT 'Unpaid'::character varying,
    status_id integer NOT NULL,
    updated_at date,
    payment_id character varying(100),
    razorpay_order_id character varying(100),
    CONSTRAINT appointments_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['Paid'::character varying, 'Unpaid'::character varying, 'Refunded'::character varying])::text[])))
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16470)
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointments_id_seq OWNER TO postgres;

--
-- TOC entry 5099 (class 0 OID 0)
-- Dependencies: 223
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;


--
-- TOC entry 222 (class 1259 OID 16461)
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(20),
    password character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    gender character varying(10),
    date_of_birth date,
    address text,
    city character varying(100),
    avatar_url character varying(255),
    updated_at date,
    reset_token character varying(255),
    reset_expires timestamp without time zone
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16460)
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO postgres;

--
-- TOC entry 5100 (class 0 OID 0)
-- Dependencies: 221
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- TOC entry 236 (class 1259 OID 24795)
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 24794)
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_reset_tokens_id_seq OWNER TO postgres;

--
-- TOC entry 5101 (class 0 OID 0)
-- Dependencies: 235
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- TOC entry 228 (class 1259 OID 16494)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    role_name character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16493)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- TOC entry 5102 (class 0 OID 0)
-- Dependencies: 227
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 240 (class 1259 OID 33034)
-- Name: salon_date_overrides; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salon_date_overrides (
    id integer NOT NULL,
    salon_id integer,
    specific_date date NOT NULL,
    is_open boolean DEFAULT true,
    start_time time without time zone,
    end_time time without time zone,
    reason character varying(255),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.salon_date_overrides OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 33033)
-- Name: salon_date_overrides_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.salon_date_overrides_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.salon_date_overrides_id_seq OWNER TO postgres;

--
-- TOC entry 5103 (class 0 OID 0)
-- Dependencies: 239
-- Name: salon_date_overrides_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.salon_date_overrides_id_seq OWNED BY public.salon_date_overrides.id;


--
-- TOC entry 232 (class 1259 OID 16558)
-- Name: salons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salons (
    salon_id integer NOT NULL,
    salon_name character varying(100) NOT NULL,
    owner_name character varying(100),
    email character varying(100),
    phone_number character varying(15),
    address text NOT NULL,
    city character varying(100) NOT NULL,
    state character varying(100),
    postal_code character varying(10),
    latitude numeric(9,6),
    longitude numeric(9,6),
    opening_time time without time zone,
    closing_time time without time zone,
    rating numeric(2,1) DEFAULT 0.0,
    total_reviews integer DEFAULT 0,
    image_url text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    parent_id integer,
    branch_name character varying(100),
    is_main_branch boolean DEFAULT false,
    admin_id integer,
    status boolean,
    CONSTRAINT salons_rating_check CHECK (((rating >= (0)::numeric) AND (rating <= (5)::numeric)))
);


ALTER TABLE public.salons OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16557)
-- Name: salons_salon_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.salons_salon_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.salons_salon_id_seq OWNER TO postgres;

--
-- TOC entry 5104 (class 0 OID 0)
-- Dependencies: 231
-- Name: salons_salon_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.salons_salon_id_seq OWNED BY public.salons.salon_id;


--
-- TOC entry 220 (class 1259 OID 16407)
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    duration_minutes integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    salon_id integer,
    category character varying(50),
    is_active boolean DEFAULT true,
    image_file character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE public.services OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16406)
-- Name: services_service_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.services_service_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_service_id_seq OWNER TO postgres;

--
-- TOC entry 5105 (class 0 OID 0)
-- Dependencies: 219
-- Name: services_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.services_service_id_seq OWNED BY public.services.id;


--
-- TOC entry 238 (class 1259 OID 33010)
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    platform_name character varying(255) DEFAULT 'Salon Booking Platform'::character varying,
    timezone character varying(50) DEFAULT 'Asia/Kolkata'::character varying,
    currency character varying(10) DEFAULT 'INR'::character varying,
    advance_booking_days integer DEFAULT 30,
    allow_cancellation boolean DEFAULT true,
    cancellation_window_hours integer DEFAULT 24,
    payment_mode character varying(50) DEFAULT 'Online & Cash'::character varying,
    tax_percentage numeric(5,2) DEFAULT 18.00,
    enable_invoices boolean DEFAULT true,
    email_notifications boolean DEFAULT true,
    sms_notifications boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 33009)
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_id_seq OWNER TO postgres;

--
-- TOC entry 5106 (class 0 OID 0)
-- Dependencies: 237
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- TOC entry 242 (class 1259 OID 33050)
-- Name: slot_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.slot_configs (
    id integer NOT NULL,
    salon_id integer NOT NULL,
    slot_duration integer DEFAULT 30,
    buffer_time integer DEFAULT 5,
    slot_capacity integer DEFAULT 1,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.slot_configs OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 33049)
-- Name: slot_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.slot_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.slot_configs_id_seq OWNER TO postgres;

--
-- TOC entry 5107 (class 0 OID 0)
-- Dependencies: 241
-- Name: slot_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.slot_configs_id_seq OWNED BY public.slot_configs.id;


--
-- TOC entry 218 (class 1259 OID 16399)
-- Name: staff; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    email character varying(150),
    phone character varying(20),
    joiningdate date,
    salon_id integer,
    is_available boolean DEFAULT true,
    image_file character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE public.staff OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16398)
-- Name: staff_staff_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.staff_staff_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staff_staff_id_seq OWNER TO postgres;

--
-- TOC entry 5108 (class 0 OID 0)
-- Dependencies: 217
-- Name: staff_staff_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.staff_staff_id_seq OWNED BY public.staff.id;


--
-- TOC entry 230 (class 1259 OID 16529)
-- Name: time_slots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.time_slots (
    id integer NOT NULL,
    salon_id integer,
    day_of_week character varying(15),
    is_open boolean DEFAULT true
);


ALTER TABLE public.time_slots OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16528)
-- Name: time_slots_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.time_slots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.time_slots_id_seq OWNER TO postgres;

--
-- TOC entry 5109 (class 0 OID 0)
-- Dependencies: 229
-- Name: time_slots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.time_slots_id_seq OWNED BY public.time_slots.id;


--
-- TOC entry 226 (class 1259 OID 16484)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    name character varying(100),
    role_id integer,
    email character varying(100),
    mobile character varying(15),
    avatar_url character varying(255),
    location character varying(255),
    salon_id integer,
    reset_token character varying(255),
    reset_expires timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16483)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5110 (class 0 OID 0)
-- Dependencies: 225
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4827 (class 2604 OID 16606)
-- Name: appointment_status id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_status ALTER COLUMN id SET DEFAULT nextval('public.appointment_status_id_seq'::regclass);


--
-- TOC entry 4813 (class 2604 OID 16474)
-- Name: appointments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);


--
-- TOC entry 4811 (class 2604 OID 16464)
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- TOC entry 4828 (class 2604 OID 24798)
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- TOC entry 4817 (class 2604 OID 16497)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 4843 (class 2604 OID 33037)
-- Name: salon_date_overrides id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salon_date_overrides ALTER COLUMN id SET DEFAULT nextval('public.salon_date_overrides_id_seq'::regclass);


--
-- TOC entry 4820 (class 2604 OID 16561)
-- Name: salons salon_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salons ALTER COLUMN salon_id SET DEFAULT nextval('public.salons_salon_id_seq'::regclass);


--
-- TOC entry 4807 (class 2604 OID 16410)
-- Name: services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_service_id_seq'::regclass);


--
-- TOC entry 4830 (class 2604 OID 33013)
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- TOC entry 4846 (class 2604 OID 33053)
-- Name: slot_configs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.slot_configs ALTER COLUMN id SET DEFAULT nextval('public.slot_configs_id_seq'::regclass);


--
-- TOC entry 4803 (class 2604 OID 16402)
-- Name: staff id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff ALTER COLUMN id SET DEFAULT nextval('public.staff_staff_id_seq'::regclass);


--
-- TOC entry 4818 (class 2604 OID 16532)
-- Name: time_slots id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_slots ALTER COLUMN id SET DEFAULT nextval('public.time_slots_id_seq'::regclass);


--
-- TOC entry 4816 (class 2604 OID 16487)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5083 (class 0 OID 16603)
-- Dependencies: 234
-- Data for Name: appointment_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointment_status (id, status_name, description) FROM stdin;
1	Pending	\N
2	Confirmed	\N
3	Completed	\N
5	No-Show	\N
4	Cancelled	\N
\.


--
-- TOC entry 5073 (class 0 OID 16471)
-- Dependencies: 224
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointments (id, customer_id, appointment_date, created_at, appointment_time, service_id, staff_id, salon_id, total_amount, payment_status, status_id, updated_at, payment_id, razorpay_order_id) FROM stdin;
47	4	2026-02-12 00:00:00	2026-02-06 15:39:34.186015	11:00:00	15	18	3	499.00	Paid	2	2026-02-06	pay_SCp1iOoa5VNBbY	order_SCp1CKWLqbg1Zv
28	4	2025-12-09 00:00:00	2025-12-09 19:03:48.612953	12:00:00	11	15	1	999.00	Unpaid	3	\N	\N	\N
26	4	2025-12-15 00:00:00	2025-12-09 18:04:53.618994	09:00:00	14	17	2	799.00	Paid	4	2025-12-16	\N	\N
27	4	2025-12-23 00:00:00	2025-12-09 18:17:17.885297	10:00:00	12	15	1	699.00	Unpaid	3	2025-12-22	\N	\N
29	8	2025-12-17 00:00:00	2025-12-16 16:23:43.278712	10:00:00	12	15	1	699.00	Unpaid	4	2025-12-24	\N	\N
13	6	2025-11-01 00:00:00	2025-10-10 14:07:00.469629	11:30:00	12	16	3	1299.00	Unpaid	4	2025-12-24	\N	\N
12	5	2025-10-15 00:00:00	2025-10-10 14:07:00.469629	16:00:00	11	15	1	999.00	Paid	4	2025-12-24	\N	\N
30	4	2025-12-26 00:00:00	2025-12-22 18:04:04.567975	10:00:00	11	15	1	999.00	Unpaid	4	2026-01-20	\N	\N
48	4	2026-02-22 00:00:00	2026-02-06 15:54:34.258531	09:00:00	14	17	2	799.00	Paid	2	\N	pay_SCpHF9YOnFQ9Ae	order_SCpH2jhJ9OEmcr
36	4	2026-02-08 00:00:00	2026-02-02 16:59:38.28847	11:30:00	14	17	2	799.00	Unpaid	4	2026-02-02	\N	\N
44	4	2026-02-12 00:00:00	2026-02-02 18:03:20.225859	11:00:00	16	18	3	1299.00	Unpaid	4	2026-02-02	\N	1
14	4	2025-10-12 00:00:00	2025-10-10 14:07:00.469629	14:00:00	13	17	2	799.00	Paid	3	\N	\N	\N
15	5	2025-10-13 00:00:00	2025-10-13 15:16:16.530066	15:33:00	12	16	1	699.00	Paid	3	\N	\N	\N
16	5	2025-10-14 00:00:00	2025-10-13 15:50:50.308996	10:00:00	12	15	1	699.00	Paid	3	\N	\N	\N
17	5	2025-11-17 00:00:00	2025-11-17 16:36:48.041279	10:10:00	12	15	1	699.00	Paid	3	\N	\N	\N
43	4	2026-02-12 00:00:00	2026-02-02 17:59:56.464317	09:00:00	14	17	2	799.00	Unpaid	4	2026-02-02	\N	\N
45	4	2026-02-11 00:00:00	2026-02-02 18:08:36.340527	11:00:00	16	18	3	1299.00	Unpaid	4	2026-02-02	\N	order_SBHQB5o7sTSV6w
39	4	2026-02-09 00:00:00	2026-02-02 17:15:05.08835	11:00:00	16	18	3	1299.00	Unpaid	4	2026-02-02	\N	\N
37	4	2026-02-08 00:00:00	2026-02-02 17:04:44.159103	11:00:00	16	18	3	1299.00	Unpaid	4	2026-02-02	\N	\N
35	4	2026-02-08 00:00:00	2026-02-02 16:46:39.110754	10:40:00	14	17	2	799.00	Unpaid	4	2026-02-02	\N	\N
34	4	2026-02-08 00:00:00	2026-02-02 16:45:31.975776	09:50:00	14	17	2	799.00	Unpaid	4	2026-02-02	\N	\N
33	4	2026-02-08 00:00:00	2026-02-02 16:43:00.447764	09:00:00	13	17	2	499.00	Unpaid	4	2026-02-02	\N	\N
31	4	2026-02-07 00:00:00	2026-01-20 20:17:05.086215	10:40:00	13	17	2	499.00	Unpaid	4	2026-02-02	\N	\N
41	4	2026-02-06 00:00:00	2026-02-02 17:51:14.269249	11:00:00	15	18	3	499.00	Unpaid	4	2026-02-02	\N	\N
40	4	2026-02-05 00:00:00	2026-02-02 17:19:42.430296	11:50:00	15	18	3	499.00	Unpaid	4	2026-02-02	\N	\N
38	4	2026-02-05 00:00:00	2026-02-02 17:13:47.500083	11:00:00	15	18	3	499.00	Unpaid	4	2026-02-02	\N	\N
42	4	2026-02-04 00:00:00	2026-02-02 17:58:36.365947	11:50:00	16	18	3	1299.00	Unpaid	4	2026-02-02	\N	\N
32	4	2026-02-04 00:00:00	2026-01-30 14:51:43.350203	11:00:00	15	18	3	499.00	Unpaid	4	2026-02-02	\N	\N
46	4	2026-02-12 00:00:00	2026-02-02 18:11:23.756638	09:50:00	13	17	2	499.00	Paid	4	2026-02-02	pay_SBHW9cLD1i5FU7	order_SBHT63SlpU2ydo
\.


--
-- TOC entry 5071 (class 0 OID 16461)
-- Dependencies: 222
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, email, phone, password, created_at, gender, date_of_birth, address, city, avatar_url, updated_at, reset_token, reset_expires) FROM stdin;
3	as	as@as.com	135	$2b$10$1EHS7sphjoWJsgjiyiAZ6O90ynulLJaJaRiqFugikvI6qHopyTaNW	2025-09-22 15:57:35.178949	\N	\N	\N	\N	\N	\N	\N	\N
5	Priya Patel	priya.patel@example.com	9123456780	hashedpassword123	2025-10-10 14:00:02.237136	Female	1995-05-20	\N	Mumbai	\N	\N	\N	\N
6	Rahul Sharma	rahul.sharma@example.com	9123456781	hashedpassword456	2025-10-10 14:00:02.237136	Male	1992-10-10	\N	Mumbai	\N	\N	\N	\N
8	Rohit Sharma	Rohit.sharma@gmail.com	7896541230	$2b$10$JzQKtyFPBekVGMq279NAL.vFvlLP1ZyyEqdK/M4tqDwAZ1vzH51f2	2025-12-15 15:56:12.251504	\N	\N	\N	\N	\N	\N	\N	\N
4	Kishan Patel	kshnptl10@gmail.com	9662881965	$2b$10$hehvDYvpnX2vkLnbxunCK.RyufCmKAWI3LsncYMtj5NcSsQKEfZhG	2025-09-22 16:06:10.056074	male	1994-08-07	TEST	Vadodara	\N	\N	\N	\N
\.


--
-- TOC entry 5085 (class 0 OID 24795)
-- Dependencies: 236
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (id, user_id, token, expires_at, created_at) FROM stdin;
1	21	6fed5b3b224319bf0aec5e420fbcb8ae455a99c6a34594809f077ceace7fdcd3	2025-12-11 19:26:31.311+05:30	2025-12-11 18:26:31.322928+05:30
2	21	e32d516e7c46bf8ce1a04b6a7099f6dec9f97b474d2a0c17d25c03989148dc0b	2025-12-11 20:40:02.296+05:30	2025-12-11 19:40:02.298373+05:30
3	21	008d6d87cfe76e02818aad3fe123e7b37663117eebb52dfd9cf51b071c7ae651	2025-12-11 20:45:36.898+05:30	2025-12-11 19:45:36.900515+05:30
4	21	3e93cb713646056b1879eb4dac37e32846b7602407e1760a77e8c42355376b53	2025-12-11 20:47:12.203+05:30	2025-12-11 19:47:12.203564+05:30
5	21	29ba201014ed343c1ae9dd0b1c4c52bea5f23d5c3fcb07b4bf2327a87fdfa9d8	2025-12-11 20:48:10.96+05:30	2025-12-11 19:48:10.964116+05:30
6	21	f583fdfd83f0a9eada876d4d3d0c95003ab48ab95978903f2956f19a55f88ecc	2025-12-11 21:45:14.649+05:30	2025-12-11 20:45:14.651653+05:30
\.


--
-- TOC entry 5077 (class 0 OID 16494)
-- Dependencies: 228
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, role_name) FROM stdin;
1	superadmin
2	admin
4	manager
\.


--
-- TOC entry 5089 (class 0 OID 33034)
-- Dependencies: 240
-- Data for Name: salon_date_overrides; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.salon_date_overrides (id, salon_id, specific_date, is_open, start_time, end_time, reason, created_at) FROM stdin;
\.


--
-- TOC entry 5081 (class 0 OID 16558)
-- Dependencies: 232
-- Data for Name: salons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.salons (salon_id, salon_name, owner_name, email, phone_number, address, city, state, postal_code, latitude, longitude, opening_time, closing_time, rating, total_reviews, image_url, is_active, created_at, updated_at, parent_id, branch_name, is_main_branch, admin_id, status) FROM stdin;
1	X-One	Priya Sharma	glowstudio@example.com	9876543210	123 Main Street	Vadodara	Maharashtra	390025	22.278659	73.231023	09:00:00	21:00:00	4.8	120	../images/salons/xone.jpg	t	2025-10-10 13:49:41.737393	2026-01-12 17:39:22.553579	\N	\N	t	38	\N
6	X-One	\N	xone_tarsali@gmail.com	9879879870	Tarsali	Vadodara	\N	\N	\N	\N	10:00:00	21:00:00	0.0	0	\N	t	2026-01-05 14:03:51.814771	2026-01-20 16:13:31.368522	1	Tarsali	f	38	t
9	X-One	\N	Xone_bodeli@gmail.com	8796543210	Bodeli	Chhotaudepur	\N	\N	\N	\N	09:00:00	21:00:00	0.0	0	\N	t	2026-01-05 14:16:17.406612	2026-01-20 16:13:31.368522	1	Bodeli	f	38	t
7	X-One	\N	xone_kaladarshan@gmail.com	8989898989	Kaladarshan	Vadodara	\N	\N	\N	\N	09:00:00	21:00:00	0.0	0	\N	t	2026-01-05 14:07:01.903023	2026-01-20 16:13:31.368522	1	Kaladarshan	f	38	f
5	X-One	\N	xone_somatalav@gmail.com	9898989898	TEST	Vadodara	\N	\N	\N	\N	09:00:00	21:00:00	0.0	0	\N	t	2025-12-24 16:54:52.422452	2026-01-20 16:13:31.368522	1	Somatalav	f	38	t
11	test	Parth Patel	test@test.com	0000000000	test	test	\N	\N	\N	\N	10:00:00	22:00:00	0.0	0	\N	t	2026-01-09 15:30:52.823773	2026-01-20 16:13:31.368522	1	test	f	38	\N
2	Beard Hub	Rohan Mehta	hairbeyond@example.com	9876543211	45 Palm Road	Vadodara	Maharashtra	390025	22.282053	73.231896	09:00:00	21:00:00	4.5	95	../images/salons/beardhub.jpg	t	2025-10-10 13:49:41.737393	2026-01-30 14:05:17.494752	\N	\N	t	\N	\N
3	Raj Saloon	Anita Verma	prettyyou@example.com	9876543212	78 Ocean Drive	Vadodara	Maharashtra	390025	22.284382	73.237524	11:00:00	19:00:00	4.7	110	../images/salons/raj.jpg	t	2025-10-10 13:49:41.737393	2026-01-30 14:06:24.085348	\N	\N	t	\N	\N
8	X-One	\N	xone_dabhoi@gmail.com	7899876789	Dabhoi	Vadodara	\N	\N	22.135197	73.409765	\N	\N	0.0	0	\N	t	2026-01-05 14:10:39.844056	2026-01-30 14:07:32.019377	1	Dabhoi	f	38	t
\.


--
-- TOC entry 5069 (class 0 OID 16407)
-- Dependencies: 220
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, name, description, price, duration_minutes, created_at, salon_id, category, is_active, image_file) FROM stdin;
11	Facial Treatment	Deep cleansing facial for glowing skin	999.00	60	2025-10-10 13:51:53.10523	1	Skin	t	\N
12	Hair Spa	Relaxing hair spa with essential oils	699.00	45	2025-10-10 13:51:53.10523	1	Hair	t	\N
13	Manicure	Premium manicure treatment	499.00	30	2025-10-10 13:51:53.10523	2	Nails	t	\N
14	Haircut & Styling	Professional haircut and styling	799.00	60	2025-10-10 13:51:53.10523	2	Hair	t	\N
15	Pedicure	Deluxe pedicure for smooth feet	499.00	40	2025-10-10 13:51:53.10523	3	Nails	t	\N
16	Hair Coloring	Modern hair coloring services	1299.00	90	2025-10-10 13:51:53.10523	3	Hair	t	\N
\.


--
-- TOC entry 5087 (class 0 OID 33010)
-- Dependencies: 238
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id, platform_name, timezone, currency, advance_booking_days, allow_cancellation, cancellation_window_hours, payment_mode, tax_percentage, enable_invoices, email_notifications, sms_notifications, updated_at) FROM stdin;
1	Salon Booking	Asia/Kolkata	INR	30	t	24	Online & Cash	18.00	t	t	t	2026-01-09 17:37:16.419388
\.


--
-- TOC entry 5091 (class 0 OID 33050)
-- Dependencies: 242
-- Data for Name: slot_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.slot_configs (id, salon_id, slot_duration, buffer_time, slot_capacity, updated_at) FROM stdin;
1	1	45	1	1	2026-01-12 16:32:08.786909
3	2	45	5	1	2026-01-20 18:54:09.007806
4	3	45	5	1	2026-01-20 18:54:14.247835
\.


--
-- TOC entry 5067 (class 0 OID 16399)
-- Dependencies: 218
-- Data for Name: staff; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff (id, name, created_at, email, phone, joiningdate, salon_id, is_available, image_file) FROM stdin;
15	Simran Kaur	2025-10-10 13:59:11.480025	simran@example.com	900000001	2024-10-05	1	t	\N
16	Ravi Joshi	2025-10-10 13:59:11.480025	ravi@example.com	900000002	2023-04-25	1	t	\N
17	Ananya Singh	2025-10-10 13:59:11.480025	ananya@example.com	900000003	2024-01-01	2	t	\N
18	Karan Mehta	2025-10-10 13:59:11.480025	karan@example.com	900000004	2023-10-05	3	t	\N
19	Suraj Valand	2025-11-21 14:46:06.030845	suraj.valand@gmail.com	8521479630	\N	\N	f	\N
20	test	2025-12-22 18:23:16.637669	test@test.com	8521478520	\N	\N	f	\N
\.


--
-- TOC entry 5079 (class 0 OID 16529)
-- Dependencies: 230
-- Data for Name: time_slots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.time_slots (id, salon_id, day_of_week, is_open) FROM stdin;
21	1	Monday	t
22	1	Tuesday	t
23	1	Wednesday	t
24	1	Thursday	t
25	1	Friday	t
26	1	Saturday	t
27	1	Sunday	f
35	2	Monday	t
36	2	Tuesday	t
37	2	Wednesday	t
38	2	Thursday	t
39	2	Friday	t
40	2	Saturday	t
41	2	Sunday	t
42	3	Monday	t
43	3	Tuesday	t
44	3	Wednesday	t
45	3	Thursday	t
46	3	Friday	t
47	3	Saturday	t
48	3	Sunday	t
\.


--
-- TOC entry 5075 (class 0 OID 16484)
-- Dependencies: 226
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, name, role_id, email, mobile, avatar_url, location, salon_id, reset_token, reset_expires) FROM stdin;
63	Gajendra.Verma@gmail.com	$2b$10$E6HRcQdSPCpmW84oCqIGEOXRn65K55QoAX7ZllumQjeSjbmr5FEdO	Gajendra Verma	4	Gajendra.Verma@gmail.com	8769045321	\N	\N	8	\N	\N
53	sachin123	12345	Sachin Patel	4	sachin.patel@gmail.com	9856147230	\N	\N	7	\N	\N
62	Jay_patel@gmail.com	$2b$10$VjsZ4B1L5c3/5gIGkdM21ulzGkPr2U/cVeImlwmDxOllwlXbNZwSa	Jay Patel	4	Jay_patel@gmail.com	9789803214	\N	\N	5	\N	\N
61	NewManager	$2b$10$yLpKuGomdxNE5o0ReRhJYedZc.u7WtpPNU5UJn1oi/4F7rUnglcka	New Manager	4	New_manager@gmail.com	8745963210	\N	\N	6	\N	\N
18	margi191	$2b$10$Q7PAKuWIXbwL56MtnnZU..GGDcflMi5xmiuKOuReTkPeGvxacZWLG	Margi Patel	4	margi191@gmail.com	9874563210	/uploads/caa5d091be7445e0960328c4c0acd4af	Vadodara	1	\N	\N
38	parth0808	$2b$10$vi0Zk41DMbaCAj8XZ35rl.S3UPRHeWVN3TgFkKkMRKDZeXuHj3V4e	Parth Patel	2	parth0808@gmail.com	7894561230	\N	\N	\N	\N	\N
21	kshnptl10	$2b$10$6Qo1IDVFF6TkMknw.w0NkeqaQQXPUVjXxXna56.TEn/AYfPzXtMKO	Kishan Patel	1	kshnptl10@gmail.com	\N	\N	\N	\N	\N	\N
\.


--
-- TOC entry 5111 (class 0 OID 0)
-- Dependencies: 233
-- Name: appointment_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.appointment_status_id_seq', 5, true);


--
-- TOC entry 5112 (class 0 OID 0)
-- Dependencies: 223
-- Name: appointments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.appointments_id_seq', 48, true);


--
-- TOC entry 5113 (class 0 OID 0)
-- Dependencies: 221
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 13, true);


--
-- TOC entry 5114 (class 0 OID 0)
-- Dependencies: 235
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 6, true);


--
-- TOC entry 5115 (class 0 OID 0)
-- Dependencies: 227
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);


--
-- TOC entry 5116 (class 0 OID 0)
-- Dependencies: 239
-- Name: salon_date_overrides_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.salon_date_overrides_id_seq', 1, false);


--
-- TOC entry 5117 (class 0 OID 0)
-- Dependencies: 231
-- Name: salons_salon_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.salons_salon_id_seq', 11, true);


--
-- TOC entry 5118 (class 0 OID 0)
-- Dependencies: 219
-- Name: services_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.services_service_id_seq', 16, true);


--
-- TOC entry 5119 (class 0 OID 0)
-- Dependencies: 237
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settings_id_seq', 1, false);


--
-- TOC entry 5120 (class 0 OID 0)
-- Dependencies: 241
-- Name: slot_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.slot_configs_id_seq', 4, true);


--
-- TOC entry 5121 (class 0 OID 0)
-- Dependencies: 217
-- Name: staff_staff_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.staff_staff_id_seq', 20, true);


--
-- TOC entry 5122 (class 0 OID 0)
-- Dependencies: 229
-- Name: time_slots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.time_slots_id_seq', 48, true);


--
-- TOC entry 5123 (class 0 OID 0)
-- Dependencies: 225
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 63, true);


--
-- TOC entry 4888 (class 2606 OID 16610)
-- Name: appointment_status appointment_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_status
    ADD CONSTRAINT appointment_status_pkey PRIMARY KEY (id);


--
-- TOC entry 4890 (class 2606 OID 16612)
-- Name: appointment_status appointment_status_status_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_status
    ADD CONSTRAINT appointment_status_status_name_key UNIQUE (status_name);


--
-- TOC entry 4866 (class 2606 OID 16477)
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- TOC entry 4862 (class 2606 OID 16469)
-- Name: customers customers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_email_key UNIQUE (email);


--
-- TOC entry 4864 (class 2606 OID 16467)
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- TOC entry 4892 (class 2606 OID 24801)
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4894 (class 2606 OID 24803)
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- TOC entry 4874 (class 2606 OID 16499)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4876 (class 2606 OID 16501)
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- TOC entry 4898 (class 2606 OID 33041)
-- Name: salon_date_overrides salon_date_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salon_date_overrides
    ADD CONSTRAINT salon_date_overrides_pkey PRIMARY KEY (id);


--
-- TOC entry 4900 (class 2606 OID 33043)
-- Name: salon_date_overrides salon_date_overrides_salon_id_specific_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salon_date_overrides
    ADD CONSTRAINT salon_date_overrides_salon_id_specific_date_key UNIQUE (salon_id, specific_date);


--
-- TOC entry 4884 (class 2606 OID 16573)
-- Name: salons salons_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salons
    ADD CONSTRAINT salons_email_key UNIQUE (email);


--
-- TOC entry 4886 (class 2606 OID 16571)
-- Name: salons salons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salons
    ADD CONSTRAINT salons_pkey PRIMARY KEY (salon_id);


--
-- TOC entry 4860 (class 2606 OID 16415)
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- TOC entry 4896 (class 2606 OID 33027)
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- TOC entry 4902 (class 2606 OID 33059)
-- Name: slot_configs slot_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.slot_configs
    ADD CONSTRAINT slot_configs_pkey PRIMARY KEY (id);


--
-- TOC entry 4904 (class 2606 OID 33061)
-- Name: slot_configs slot_configs_salon_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.slot_configs
    ADD CONSTRAINT slot_configs_salon_id_key UNIQUE (salon_id);


--
-- TOC entry 4855 (class 2606 OID 16511)
-- Name: staff staff_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_email_key UNIQUE (email);


--
-- TOC entry 4857 (class 2606 OID 16405)
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- TOC entry 4878 (class 2606 OID 16535)
-- Name: time_slots time_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_slots
    ADD CONSTRAINT time_slots_pkey PRIMARY KEY (id);


--
-- TOC entry 4880 (class 2606 OID 33068)
-- Name: time_slots unique_salon_day; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_slots
    ADD CONSTRAINT unique_salon_day UNIQUE (salon_id, day_of_week);


--
-- TOC entry 4870 (class 2606 OID 16490)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4872 (class 2606 OID 16492)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4867 (class 1259 OID 16597)
-- Name: idx_appointment_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointment_customer ON public.appointments USING btree (customer_id);


--
-- TOC entry 4868 (class 1259 OID 16598)
-- Name: idx_appointment_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointment_date ON public.appointments USING btree (appointment_date);


--
-- TOC entry 4881 (class 1259 OID 16594)
-- Name: idx_salon_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_salon_city ON public.salons USING btree (city);


--
-- TOC entry 4882 (class 1259 OID 41220)
-- Name: idx_salon_lat_long; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_salon_lat_long ON public.salons USING btree (latitude, longitude);


--
-- TOC entry 4858 (class 1259 OID 16595)
-- Name: idx_service_salon; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_salon ON public.services USING btree (salon_id);


--
-- TOC entry 4853 (class 1259 OID 16596)
-- Name: idx_staff_salon; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_salon ON public.staff USING btree (salon_id);


--
-- TOC entry 4920 (class 2620 OID 16600)
-- Name: salons update_salon_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_salon_timestamp BEFORE UPDATE ON public.salons FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 4907 (class 2606 OID 16478)
-- Name: appointments appointments_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- TOC entry 4908 (class 2606 OID 16587)
-- Name: appointments appointments_salon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_salon_id_fkey FOREIGN KEY (salon_id) REFERENCES public.salons(salon_id) ON DELETE CASCADE;


--
-- TOC entry 4909 (class 2606 OID 16542)
-- Name: appointments appointments_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- TOC entry 4910 (class 2606 OID 16547)
-- Name: appointments appointments_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE;


--
-- TOC entry 4911 (class 2606 OID 16613)
-- Name: appointments fk_appointment_status; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT fk_appointment_status FOREIGN KEY (status_id) REFERENCES public.appointment_status(id) ON DELETE RESTRICT;


--
-- TOC entry 4919 (class 2606 OID 33062)
-- Name: slot_configs fk_salon_config; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.slot_configs
    ADD CONSTRAINT fk_salon_config FOREIGN KEY (salon_id) REFERENCES public.salons(salon_id) ON DELETE CASCADE;


--
-- TOC entry 4914 (class 2606 OID 33028)
-- Name: time_slots fk_salon_timeslot; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_slots
    ADD CONSTRAINT fk_salon_timeslot FOREIGN KEY (salon_id) REFERENCES public.salons(salon_id) ON DELETE CASCADE;


--
-- TOC entry 4917 (class 2606 OID 24804)
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4918 (class 2606 OID 33044)
-- Name: salon_date_overrides salon_date_overrides_salon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salon_date_overrides
    ADD CONSTRAINT salon_date_overrides_salon_id_fkey FOREIGN KEY (salon_id) REFERENCES public.salons(salon_id) ON DELETE CASCADE;


--
-- TOC entry 4915 (class 2606 OID 24827)
-- Name: salons salons_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salons
    ADD CONSTRAINT salons_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- TOC entry 4916 (class 2606 OID 24821)
-- Name: salons salons_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salons
    ADD CONSTRAINT salons_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.salons(salon_id) ON DELETE CASCADE;


--
-- TOC entry 4906 (class 2606 OID 16574)
-- Name: services services_salon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_salon_id_fkey FOREIGN KEY (salon_id) REFERENCES public.salons(salon_id) ON DELETE CASCADE;


--
-- TOC entry 4905 (class 2606 OID 16580)
-- Name: staff staff_salon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_salon_id_fkey FOREIGN KEY (salon_id) REFERENCES public.salons(salon_id) ON DELETE CASCADE;


--
-- TOC entry 4912 (class 2606 OID 16502)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 4913 (class 2606 OID 24816)
-- Name: users users_salon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_salon_id_fkey FOREIGN KEY (salon_id) REFERENCES public.salons(salon_id);


-- Completed on 2026-02-06 16:16:02

--
-- PostgreSQL database dump complete
--

\unrestrict 4gYX4PEKrbwCzieLKyBem9PIRAa7OpRMiCw9wveFrVEyxYqZOYwIpcdadQQ4at6

-- Completed on 2026-02-06 16:16:02

--
-- PostgreSQL database cluster dump complete
--

