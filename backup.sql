--
-- PostgreSQL database dump
--

\restrict G2ydLc57cDXbUyIBAtkNdTUFKv2KfQ5gzPfpEmaQvm8xCVUL1DSa0gPGlhaXjFa

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1 (Debian 18.1-1.pgdg13+2)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: badges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.badges (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    name text NOT NULL,
    description text,
    icon text,
    criteria text
);


ALTER TABLE public.badges OWNER TO postgres;

--
-- Name: badges_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.badges_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.badges_id_seq OWNER TO postgres;

--
-- Name: badges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.badges_id_seq OWNED BY public.badges.id;


--
-- Name: budgets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budgets (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    user_id bigint NOT NULL,
    category_id bigint NOT NULL,
    amount numeric NOT NULL,
    period text DEFAULT 'monthly'::text NOT NULL,
    start_date timestamp with time zone
);


ALTER TABLE public.budgets OWNER TO postgres;

--
-- Name: budgets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.budgets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.budgets_id_seq OWNER TO postgres;

--
-- Name: budgets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.budgets_id_seq OWNED BY public.budgets.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    user_id bigint NOT NULL,
    name text NOT NULL,
    icon text,
    color text,
    type text NOT NULL,
    is_default boolean DEFAULT false,
    is_essential boolean DEFAULT true
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: goal_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goal_items (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    goal_id bigint NOT NULL,
    name text NOT NULL,
    estimated_type text,
    estimated_price numeric NOT NULL,
    actual_price numeric DEFAULT 0,
    is_purchased boolean DEFAULT false,
    note text
);


ALTER TABLE public.goal_items OWNER TO postgres;

--
-- Name: goal_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.goal_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goal_items_id_seq OWNER TO postgres;

--
-- Name: goal_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.goal_items_id_seq OWNED BY public.goal_items.id;


--
-- Name: goal_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goal_members (
    goal_id bigint NOT NULL,
    user_id bigint NOT NULL,
    role text,
    joined_at timestamp with time zone
);


ALTER TABLE public.goal_members OWNER TO postgres;

--
-- Name: goal_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goal_transactions (
    id bigint NOT NULL,
    goal_id bigint NOT NULL,
    user_id bigint NOT NULL,
    amount numeric NOT NULL,
    date timestamp with time zone,
    notes text,
    created_at timestamp with time zone
);


ALTER TABLE public.goal_transactions OWNER TO postgres;

--
-- Name: goal_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.goal_transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goal_transactions_id_seq OWNER TO postgres;

--
-- Name: goal_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.goal_transactions_id_seq OWNED BY public.goal_transactions.id;


--
-- Name: goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goals (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    user_id bigint NOT NULL,
    name text NOT NULL,
    target_amount numeric NOT NULL,
    current_amount numeric DEFAULT 0,
    deadline timestamp with time zone,
    icon text,
    color text,
    description text
);


ALTER TABLE public.goals OWNER TO postgres;

--
-- Name: goals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.goals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goals_id_seq OWNER TO postgres;

--
-- Name: goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.goals_id_seq OWNED BY public.goals.id;


--
-- Name: recurring_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recurring_transactions (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    user_id bigint NOT NULL,
    wallet_id bigint NOT NULL,
    category_id bigint NOT NULL,
    amount numeric NOT NULL,
    type text NOT NULL,
    description text,
    frequency text NOT NULL,
    start_date timestamp with time zone NOT NULL,
    next_run_date timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true,
    last_run_date timestamp with time zone
);


ALTER TABLE public.recurring_transactions OWNER TO postgres;

--
-- Name: recurring_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recurring_transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recurring_transactions_id_seq OWNER TO postgres;

--
-- Name: recurring_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recurring_transactions_id_seq OWNED BY public.recurring_transactions.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    user_id bigint NOT NULL,
    category_id bigint NOT NULL,
    wallet_id bigint NOT NULL,
    amount numeric NOT NULL,
    type text NOT NULL,
    description text,
    date timestamp with time zone NOT NULL,
    notes text
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_id_seq OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_badges (
    user_id bigint NOT NULL,
    badge_id bigint NOT NULL,
    earned_at timestamp with time zone
);


ALTER TABLE public.user_badges OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    email text NOT NULL,
    name text NOT NULL,
    password text,
    avatar_url text,
    provider text DEFAULT 'local'::text,
    provider_id text,
    current_streak bigint DEFAULT 0,
    longest_streak bigint DEFAULT 0,
    last_transaction_date timestamp with time zone,
    level bigint DEFAULT 1,
    xp bigint DEFAULT 0
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: wallets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallets (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    user_id bigint NOT NULL,
    name text NOT NULL,
    icon text,
    color text,
    balance numeric DEFAULT 0,
    is_default boolean DEFAULT false,
    description text
);


ALTER TABLE public.wallets OWNER TO postgres;

--
-- Name: wallets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wallets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wallets_id_seq OWNER TO postgres;

--
-- Name: wallets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wallets_id_seq OWNED BY public.wallets.id;


--
-- Name: badges id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.badges ALTER COLUMN id SET DEFAULT nextval('public.badges_id_seq'::regclass);


--
-- Name: budgets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets ALTER COLUMN id SET DEFAULT nextval('public.budgets_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: goal_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goal_items ALTER COLUMN id SET DEFAULT nextval('public.goal_items_id_seq'::regclass);


--
-- Name: goal_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goal_transactions ALTER COLUMN id SET DEFAULT nextval('public.goal_transactions_id_seq'::regclass);


--
-- Name: goals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goals ALTER COLUMN id SET DEFAULT nextval('public.goals_id_seq'::regclass);


--
-- Name: recurring_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_transactions ALTER COLUMN id SET DEFAULT nextval('public.recurring_transactions_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: wallets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets ALTER COLUMN id SET DEFAULT nextval('public.wallets_id_seq'::regclass);


--
-- Data for Name: badges; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.badges (id, created_at, updated_at, deleted_at, name, description, icon, criteria) FROM stdin;
1	2026-01-25 07:33:40.057076+07	2026-01-25 07:33:40.057076+07	\N	Rookie Recorder	Log your first 10 transactions	📝	10 transactions
2	2026-01-25 07:33:40.07655+07	2026-01-25 07:33:40.07655+07	\N	Streak Master	Maintain a 7-day streak	🔥	7 day streak
3	2026-01-25 07:33:40.0781+07	2026-01-25 07:33:40.0781+07	\N	No Jajan Week	No "Wants" expenses for 7 days	🛡️	0 wants for 7 days
4	2026-01-25 07:33:40.080319+07	2026-01-25 07:33:40.080319+07	\N	Sultan	Reach Level 10	👑	Level 10
5	2026-01-25 07:33:40.082161+07	2026-01-25 07:33:40.082161+07	\N	Saver	Save 20% of income in a month	💰	20% savings rate
\.


--
-- Data for Name: budgets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budgets (id, created_at, updated_at, deleted_at, user_id, category_id, amount, period, start_date) FROM stdin;
1	2026-01-26 11:28:20.729398+07	2026-01-26 11:28:20.729398+07	\N	1	5	600000	monthly	0001-01-01 06:42:04+06:42:04
2	2026-01-26 11:28:38.037182+07	2026-01-26 11:28:38.037182+07	\N	1	11	1000000	monthly	0001-01-01 06:42:04+06:42:04
3	2026-01-26 11:28:58.900005+07	2026-01-26 11:28:58.900005+07	\N	1	8	500000	monthly	0001-01-01 06:42:04+06:42:04
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, created_at, updated_at, deleted_at, user_id, name, icon, color, type, is_default, is_essential) FROM stdin;
1	2026-01-24 17:53:40.17058+07	2026-01-24 17:53:40.17058+07	\N	1	Gaji	💰	#22c55e	income	t	t
2	2026-01-24 17:53:40.181246+07	2026-01-24 17:53:40.181246+07	\N	1	Freelance	💻	#3b82f6	income	t	t
3	2026-01-24 17:53:40.183321+07	2026-01-24 17:53:40.183321+07	\N	1	Investasi	📈	#8b5cf6	income	t	t
4	2026-01-24 17:53:40.184537+07	2026-01-24 17:53:40.184537+07	\N	1	Makanan	🍔	#f97316	expense	t	t
5	2026-01-24 17:53:40.186605+07	2026-01-24 17:53:40.186605+07	\N	1	Transport	🚗	#eab308	expense	t	t
6	2026-01-24 17:53:40.187772+07	2026-01-24 17:53:40.187772+07	\N	1	Belanja	🛒	#ec4899	expense	t	t
7	2026-01-24 17:53:40.189194+07	2026-01-24 17:53:40.189194+07	\N	1	Hiburan	🎬	#06b6d4	expense	t	t
8	2026-01-24 17:53:40.190442+07	2026-01-24 17:53:40.190442+07	\N	1	Tagihan	📄	#ef4444	expense	t	t
9	2026-01-24 17:53:40.19153+07	2026-01-24 17:53:40.19153+07	\N	1	Kesehatan	🏥	#14b8a6	expense	t	t
10	2026-01-24 19:02:37.096092+07	2026-01-24 19:02:37.096092+07	\N	1	Cipiran Kegiatan	💰	#3b82f6	income	f	t
11	2026-01-26 11:05:58.007853+07	2026-01-26 11:05:58.007853+07	\N	1	Investasi	💡	#3b82f6	expense	f	t
\.


--
-- Data for Name: goal_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goal_items (id, created_at, updated_at, deleted_at, goal_id, name, estimated_type, estimated_price, actual_price, is_purchased, note) FROM stdin;
1	2026-01-26 11:09:50.353523+07	2026-01-26 11:09:50.353523+07	2026-01-26 11:10:21.740911+07	1	Cincin 		500000	0	f	
2	2026-01-26 11:37:27.227767+07	2026-01-26 11:56:21.897402+07	2026-01-26 11:59:16.091695+07	1	Cincin		1000000	0	f	
\.


--
-- Data for Name: goal_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goal_members (goal_id, user_id, role, joined_at) FROM stdin;
\.


--
-- Data for Name: goal_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goal_transactions (id, goal_id, user_id, amount, date, notes, created_at) FROM stdin;
1	1	1	200000	2026-01-26 07:00:00+07	Reksadana Saham	2026-01-26 11:06:30.993507+07
\.


--
-- Data for Name: goals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goals (id, created_at, updated_at, deleted_at, user_id, name, target_amount, current_amount, deadline, icon, color, description) FROM stdin;
2	2026-01-26 11:06:57.786952+07	2026-01-26 11:06:57.786952+07	\N	1	Nikah Jihan	50000000	1000000	2028-01-26 07:00:00+07	🎯	#10B981	
1	2026-01-24 18:59:07.071145+07	2026-01-26 11:07:05.115244+07	\N	1	Nikah Arul	50000000	1392598	2028-12-24 07:00:00+07	🎯	#3B82F6	Semangat untuk menikahi Jihan
\.


--
-- Data for Name: recurring_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recurring_transactions (id, created_at, updated_at, deleted_at, user_id, wallet_id, category_id, amount, type, description, frequency, start_date, next_run_date, is_active, last_run_date) FROM stdin;
3	2026-01-25 06:30:41.553161+07	2026-01-25 06:30:41.553161+07	\N	1	5	8	235000	expense	WIFI	monthly	2026-02-05 07:00:00+07	2026-02-05 07:00:00+07	t	\N
1	2026-01-24 20:09:39.14578+07	2026-02-01 13:09:43.541218+07	\N	1	3	6	500000	expense	Ibuk	monthly	2026-02-01 07:00:00+07	2026-03-01 07:00:00+07	t	2026-02-01 13:09:43.456464+07
2	2026-01-25 06:30:22.252516+07	2026-02-01 13:09:43.568647+07	\N	1	5	8	200000	expense	Listrik	monthly	2026-02-01 07:00:00+07	2026-03-01 07:00:00+07	t	2026-02-01 13:09:43.456464+07
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, created_at, updated_at, deleted_at, user_id, category_id, wallet_id, amount, type, description, date, notes) FROM stdin;
2	2026-01-24 19:02:57.619332+07	2026-01-24 19:02:57.619332+07	\N	1	10	3	50000	income	Uang Jajan	2026-01-24 19:02:57.61881+07	
3	2026-01-26 11:06:17.246289+07	2026-01-26 11:06:17.246289+07	\N	1	11	5	200000	expense	Reksadana Saham	2026-01-26 11:06:17.245749+07	
4	2026-01-27 08:37:52.608964+07	2026-01-27 08:37:52.608964+07	\N	1	6	3	100000	expense	Belanja Ibuk	2026-01-27 08:37:52.607336+07	
5	2026-01-27 08:49:48.475641+07	2026-01-27 08:49:48.475641+07	\N	1	11	5	200000	expense	Dana Darurat	2026-01-27 08:49:48.47402+07	
6	2026-01-29 08:10:17.791297+07	2026-01-29 08:10:17.791297+07	\N	1	6	3	100000	expense	Belanja Ibuk	2026-01-29 08:10:17.789963+07	
7	2026-01-29 08:10:32.077913+07	2026-01-29 08:10:32.077913+07	\N	1	5	5	50000	expense	Gocar 	2026-01-29 08:10:32.076901+07	
8	2026-01-30 13:53:52.646621+07	2026-01-30 13:53:52.646621+07	\N	1	10	3	50000	income		2026-01-30 13:53:52.645536+07	
11	2026-01-31 19:25:38.180065+07	2026-01-31 19:25:38.180065+07	\N	1	1	5	2200000	income		2026-01-31 19:25:38.178987+07	
12	2026-01-31 19:25:53.555945+07	2026-01-31 19:25:53.555945+07	\N	1	9	5	70337	expense	Ganti Perban	2026-01-31 19:25:53.555945+07	
14	2026-02-01 13:09:43.553515+07	2026-02-01 13:11:31.233479+07	\N	1	8	5	194100	expense	Listrik (Otomatis)	2026-02-01 13:09:43.552789+07	
15	2026-02-01 13:11:45.994157+07	2026-02-01 13:11:45.994157+07	\N	1	9	5	70336	expense	Ganti Perban	2026-02-01 13:11:45.993147+07	
9	2026-01-30 13:54:18.131235+07	2026-02-01 13:12:19.953057+07	\N	1	10	5	260000	income	Pengembalian Pajak	2026-01-30 13:54:18.131235+07	
10	2026-01-30 13:54:37.596716+07	2026-02-01 13:13:07.031943+07	\N	1	9	5	70334	expense	Ganti Perban	2026-01-30 13:54:37.596182+07	
\.


--
-- Data for Name: user_badges; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_badges (user_id, badge_id, earned_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, created_at, updated_at, deleted_at, email, name, password, avatar_url, provider, provider_id, current_streak, longest_streak, last_transaction_date, level, xp) FROM stdin;
1	2026-01-24 17:53:40.157399+07	2026-02-01 13:11:46.016617+07	\N	masharul51@gmail.com	asharul	$2a$10$vxHEmJRWHXDFgBEvyec8qu0XLs309Xqb3T6zxsEtUEfrGwUub5sry		local		4	4	2026-02-01 13:11:45.993147+07	3	250
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wallets (id, created_at, updated_at, deleted_at, user_id, name, icon, color, balance, is_default, description) FROM stdin;
6	2026-01-24 19:04:50.891461+07	2026-01-24 19:04:50.891461+07	\N	1	Bank BSI	🛒	#3b82f6	35952	f	Tempat Kebutuhan
5	2026-01-24 19:04:10.532369+07	2026-02-01 13:11:46.006227+07	\N	1	Bank BCA	💳	#3b82f6	6097650	f	Tempat Keinginan
3	2026-01-24 18:08:26.285468+07	2026-02-01 13:09:43.524567+07	\N	1	Dompet	💵	#3b82f6	50000	t	Dompet Cash
\.


--
-- Name: badges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.badges_id_seq', 5, true);


--
-- Name: budgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.budgets_id_seq', 3, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 11, true);


--
-- Name: goal_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.goal_items_id_seq', 2, true);


--
-- Name: goal_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.goal_transactions_id_seq', 1, true);


--
-- Name: goals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.goals_id_seq', 2, true);


--
-- Name: recurring_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recurring_transactions_id_seq', 3, true);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transactions_id_seq', 15, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: wallets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wallets_id_seq', 6, true);


--
-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);


--
-- Name: budgets budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: goal_items goal_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goal_items
    ADD CONSTRAINT goal_items_pkey PRIMARY KEY (id);


--
-- Name: goal_members goal_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goal_members
    ADD CONSTRAINT goal_members_pkey PRIMARY KEY (goal_id, user_id);


--
-- Name: goal_transactions goal_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goal_transactions
    ADD CONSTRAINT goal_transactions_pkey PRIMARY KEY (id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: recurring_transactions recurring_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_transactions
    ADD CONSTRAINT recurring_transactions_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: badges uni_badges_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT uni_badges_name UNIQUE (name);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (user_id, badge_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: idx_badges_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_badges_deleted_at ON public.badges USING btree (deleted_at);


--
-- Name: idx_budgets_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budgets_deleted_at ON public.budgets USING btree (deleted_at);


--
-- Name: idx_categories_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_categories_deleted_at ON public.categories USING btree (deleted_at);


--
-- Name: idx_goal_items_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_goal_items_deleted_at ON public.goal_items USING btree (deleted_at);


--
-- Name: idx_goals_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_goals_deleted_at ON public.goals USING btree (deleted_at);


--
-- Name: idx_recurring_transactions_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recurring_transactions_deleted_at ON public.recurring_transactions USING btree (deleted_at);


--
-- Name: idx_transactions_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_deleted_at ON public.transactions USING btree (deleted_at);


--
-- Name: idx_users_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_deleted_at ON public.users USING btree (deleted_at);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_wallets_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wallets_deleted_at ON public.wallets USING btree (deleted_at);


--
-- Name: budgets fk_budgets_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT fk_budgets_category FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: transactions fk_categories_transactions; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_categories_transactions FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: goal_items fk_goal_items_goal; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goal_items
    ADD CONSTRAINT fk_goal_items_goal FOREIGN KEY (goal_id) REFERENCES public.goals(id);


--
-- Name: goal_members fk_goal_members_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goal_members
    ADD CONSTRAINT fk_goal_members_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: goal_transactions fk_goal_transactions_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goal_transactions
    ADD CONSTRAINT fk_goal_transactions_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: goal_members fk_goals_members; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goal_members
    ADD CONSTRAINT fk_goals_members FOREIGN KEY (goal_id) REFERENCES public.goals(id);


--
-- Name: goal_transactions fk_goals_transactions; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goal_transactions
    ADD CONSTRAINT fk_goals_transactions FOREIGN KEY (goal_id) REFERENCES public.goals(id);


--
-- Name: goals fk_goals_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: recurring_transactions fk_recurring_transactions_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_transactions
    ADD CONSTRAINT fk_recurring_transactions_category FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: recurring_transactions fk_recurring_transactions_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_transactions
    ADD CONSTRAINT fk_recurring_transactions_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: recurring_transactions fk_recurring_transactions_wallet; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_transactions
    ADD CONSTRAINT fk_recurring_transactions_wallet FOREIGN KEY (wallet_id) REFERENCES public.wallets(id);


--
-- Name: budgets fk_users_budgets; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT fk_users_budgets FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: categories fk_users_categories; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT fk_users_categories FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: transactions fk_users_transactions; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_users_transactions FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: transactions fk_wallets_transactions; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_wallets_transactions FOREIGN KEY (wallet_id) REFERENCES public.wallets(id);


--
-- Name: wallets fk_wallets_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict G2ydLc57cDXbUyIBAtkNdTUFKv2KfQ5gzPfpEmaQvm8xCVUL1DSa0gPGlhaXjFa

