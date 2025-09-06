--
-- PostgreSQL database dump
--

\restrict VkR2mbPcKDKTBSttyzvyVb1vD6MlvouDDgzU4VZaFpBjRgYCF6996GhCbdYCWjU

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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
-- Name: categories; Type: TABLE; Schema: public; Owner: juicer_postgres_user
--

CREATE TABLE public.categories (
    category_id integer NOT NULL,
    server_id bigint NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.categories OWNER TO juicer_postgres_user;

--
-- Name: categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: juicer_postgres_user
--

CREATE SEQUENCE public.categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categories_category_id_seq OWNER TO juicer_postgres_user;

--
-- Name: categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: juicer_postgres_user
--

ALTER SEQUENCE public.categories_category_id_seq OWNED BY public.categories.category_id;


--
-- Name: game_roles; Type: TABLE; Schema: public; Owner: juicer_postgres_user
--

CREATE TABLE public.game_roles (
    game_id integer NOT NULL,
    role_id bigint NOT NULL
);


ALTER TABLE public.game_roles OWNER TO juicer_postgres_user;

--
-- Name: game_tags; Type: TABLE; Schema: public; Owner: juicer_postgres_user
--

CREATE TABLE public.game_tags (
    game_id integer NOT NULL,
    tag_id integer NOT NULL
);


ALTER TABLE public.game_tags OWNER TO juicer_postgres_user;

--
-- Name: games; Type: TABLE; Schema: public; Owner: juicer_postgres_user
--

CREATE TABLE public.games (
    game_id integer NOT NULL,
    server_id bigint NOT NULL,
    category_id integer,
    name character varying(255) NOT NULL,
    description text
);


ALTER TABLE public.games OWNER TO juicer_postgres_user;

--
-- Name: games_game_id_seq; Type: SEQUENCE; Schema: public; Owner: juicer_postgres_user
--

CREATE SEQUENCE public.games_game_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.games_game_id_seq OWNER TO juicer_postgres_user;

--
-- Name: games_game_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: juicer_postgres_user
--

ALTER SEQUENCE public.games_game_id_seq OWNED BY public.games.game_id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: juicer_postgres_user
--

CREATE TABLE public.roles (
    role_id bigint NOT NULL,
    server_id bigint NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.roles OWNER TO juicer_postgres_user;

--
-- Name: servers; Type: TABLE; Schema: public; Owner: juicer_postgres_user
--

CREATE TABLE public.servers (
    server_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.servers OWNER TO juicer_postgres_user;

--
-- Name: tags; Type: TABLE; Schema: public; Owner: juicer_postgres_user
--

CREATE TABLE public.tags (
    tag_id integer NOT NULL,
    server_id bigint NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.tags OWNER TO juicer_postgres_user;

--
-- Name: tags_tag_id_seq; Type: SEQUENCE; Schema: public; Owner: juicer_postgres_user
--

CREATE SEQUENCE public.tags_tag_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tags_tag_id_seq OWNER TO juicer_postgres_user;

--
-- Name: tags_tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: juicer_postgres_user
--

ALTER SEQUENCE public.tags_tag_id_seq OWNED BY public.tags.tag_id;


--
-- Name: categories category_id; Type: DEFAULT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.categories ALTER COLUMN category_id SET DEFAULT nextval('public.categories_category_id_seq'::regclass);


--
-- Name: games game_id; Type: DEFAULT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.games ALTER COLUMN game_id SET DEFAULT nextval('public.games_game_id_seq'::regclass);


--
-- Name: tags tag_id; Type: DEFAULT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.tags ALTER COLUMN tag_id SET DEFAULT nextval('public.tags_tag_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: juicer_postgres_user
--

COPY public.categories (category_id, server_id, name) FROM stdin;
\.


--
-- Data for Name: game_roles; Type: TABLE DATA; Schema: public; Owner: juicer_postgres_user
--

COPY public.game_roles (game_id, role_id) FROM stdin;
\.


--
-- Data for Name: game_tags; Type: TABLE DATA; Schema: public; Owner: juicer_postgres_user
--

COPY public.game_tags (game_id, tag_id) FROM stdin;
\.


--
-- Data for Name: games; Type: TABLE DATA; Schema: public; Owner: juicer_postgres_user
--

COPY public.games (game_id, server_id, category_id, name, description) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: juicer_postgres_user
--

COPY public.roles (role_id, server_id, name) FROM stdin;
\.


--
-- Data for Name: servers; Type: TABLE DATA; Schema: public; Owner: juicer_postgres_user
--

COPY public.servers (server_id, created_at) FROM stdin;
\.


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: juicer_postgres_user
--

COPY public.tags (tag_id, server_id, name) FROM stdin;
\.


--
-- Name: categories_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: juicer_postgres_user
--

SELECT pg_catalog.setval('public.categories_category_id_seq', 1, false);


--
-- Name: games_game_id_seq; Type: SEQUENCE SET; Schema: public; Owner: juicer_postgres_user
--

SELECT pg_catalog.setval('public.games_game_id_seq', 1, false);


--
-- Name: tags_tag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: juicer_postgres_user
--

SELECT pg_catalog.setval('public.tags_tag_id_seq', 1, false);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (category_id);


--
-- Name: categories categories_server_id_name_key; Type: CONSTRAINT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_server_id_name_key UNIQUE (server_id, name);


--
-- Name: game_roles game_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.game_roles
    ADD CONSTRAINT game_roles_pkey PRIMARY KEY (game_id, role_id);


--
-- Name: game_tags game_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.game_tags
    ADD CONSTRAINT game_tags_pkey PRIMARY KEY (game_id, tag_id);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (game_id);


--
-- Name: games games_server_id_name_key; Type: CONSTRAINT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_server_id_name_key UNIQUE (server_id, name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- Name: servers servers_pkey; Type: CONSTRAINT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.servers
    ADD CONSTRAINT servers_pkey PRIMARY KEY (server_id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (tag_id);


--
-- Name: tags tags_server_id_name_key; Type: CONSTRAINT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_server_id_name_key UNIQUE (server_id, name);


--
-- Name: categories categories_server_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(server_id) ON DELETE CASCADE;


--
-- Name: game_roles game_roles_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.game_roles
    ADD CONSTRAINT game_roles_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(game_id) ON DELETE CASCADE;


--
-- Name: game_roles game_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.game_roles
    ADD CONSTRAINT game_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE;


--
-- Name: game_tags game_tags_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.game_tags
    ADD CONSTRAINT game_tags_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(game_id) ON DELETE CASCADE;


--
-- Name: game_tags game_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.game_tags
    ADD CONSTRAINT game_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(tag_id) ON DELETE CASCADE;


--
-- Name: games games_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id) ON DELETE SET NULL;


--
-- Name: games games_server_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(server_id) ON DELETE CASCADE;


--
-- Name: roles roles_server_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(server_id) ON DELETE CASCADE;


--
-- Name: tags tags_server_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: juicer_postgres_user
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(server_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict VkR2mbPcKDKTBSttyzvyVb1vD6MlvouDDgzU4VZaFpBjRgYCF6996GhCbdYCWjU

