--
-- PostgreSQL database dump
--


-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    category_id integer NOT NULL,
    server_id text NOT NULL,
    name character varying(100) NOT NULL
);


--
-- Name: categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_category_id_seq OWNED BY public.categories.category_id;


--
-- Name: games; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.games (
    game_id integer NOT NULL,
    server_id text NOT NULL,
    category_id integer,
    name character varying(255) NOT NULL,
    description text,
    thumbnail bytea,
    channels text[],
    CONSTRAINT thumbnail_size CHECK ((octet_length(thumbnail) <= 1048576))
);


--
-- Name: games_game_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.games_game_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: games_game_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.games_game_id_seq OWNED BY public.games.game_id;


--
-- Name: games_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.games_roles (
    game_id integer NOT NULL,
    role_id text NOT NULL
);


--
-- Name: games_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.games_tags (
    game_id integer NOT NULL,
    tag_id integer NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    role_id text NOT NULL,
    server_id text NOT NULL,
    role_category_id integer,
    self_assignable boolean DEFAULT false NOT NULL,
    description text
);


--
-- Name: roles_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles_categories (
    role_category_id integer NOT NULL,
    server_id text NOT NULL,
    name character varying(100) NOT NULL,
    is_verification boolean DEFAULT false NOT NULL
);


--
-- Name: roles_categories_role_category_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_categories_role_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_categories_role_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_categories_role_category_id_seq OWNED BY public.roles_categories.role_category_id;


--
-- Name: servers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servers (
    server_id text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    verification_required boolean DEFAULT false NOT NULL
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    tag_id integer NOT NULL,
    server_id text NOT NULL,
    name character varying(50) NOT NULL
);


--
-- Name: tags_tag_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tags_tag_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tags_tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tags_tag_id_seq OWNED BY public.tags.tag_id;


--
-- Name: categories category_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN category_id SET DEFAULT nextval('public.categories_category_id_seq'::regclass);


--
-- Name: games game_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games ALTER COLUMN game_id SET DEFAULT nextval('public.games_game_id_seq'::regclass);


--
-- Name: roles_categories role_category_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles_categories ALTER COLUMN role_category_id SET DEFAULT nextval('public.roles_categories_role_category_id_seq'::regclass);


--
-- Name: tags tag_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags ALTER COLUMN tag_id SET DEFAULT nextval('public.tags_tag_id_seq'::regclass);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (category_id);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (game_id);


--
-- Name: games_roles games_roles_game_id_role_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games_roles
    ADD CONSTRAINT games_roles_game_id_role_id_pk PRIMARY KEY (game_id, role_id);


--
-- Name: games_tags games_tags_game_id_tag_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games_tags
    ADD CONSTRAINT games_tags_game_id_tag_id_pk PRIMARY KEY (game_id, tag_id);


--
-- Name: roles_categories roles_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles_categories
    ADD CONSTRAINT roles_categories_pkey PRIMARY KEY (role_category_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- Name: servers servers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servers
    ADD CONSTRAINT servers_pkey PRIMARY KEY (server_id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (tag_id);


--
-- Name: categories categories_server_id_servers_server_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_server_id_servers_server_id_fk FOREIGN KEY (server_id) REFERENCES public.servers(server_id) ON DELETE CASCADE;


--
-- Name: games games_category_id_categories_category_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_category_id_categories_category_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(category_id) ON DELETE SET NULL;


--
-- Name: games_roles games_roles_game_id_games_game_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games_roles
    ADD CONSTRAINT games_roles_game_id_games_game_id_fk FOREIGN KEY (game_id) REFERENCES public.games(game_id) ON DELETE CASCADE;


--
-- Name: games_roles games_roles_role_id_roles_role_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games_roles
    ADD CONSTRAINT games_roles_role_id_roles_role_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE;


--
-- Name: games games_server_id_servers_server_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_server_id_servers_server_id_fk FOREIGN KEY (server_id) REFERENCES public.servers(server_id) ON DELETE CASCADE;


--
-- Name: games_tags games_tags_game_id_games_game_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games_tags
    ADD CONSTRAINT games_tags_game_id_games_game_id_fk FOREIGN KEY (game_id) REFERENCES public.games(game_id) ON DELETE CASCADE;


--
-- Name: games_tags games_tags_tag_id_tags_tag_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games_tags
    ADD CONSTRAINT games_tags_tag_id_tags_tag_id_fk FOREIGN KEY (tag_id) REFERENCES public.tags(tag_id) ON DELETE CASCADE;


--
-- Name: roles_categories roles_categories_server_id_servers_server_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles_categories
    ADD CONSTRAINT roles_categories_server_id_servers_server_id_fk FOREIGN KEY (server_id) REFERENCES public.servers(server_id);


--
-- Name: roles roles_role_category_id_roles_categories_role_category_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_category_id_roles_categories_role_category_id_fk FOREIGN KEY (role_category_id) REFERENCES public.roles_categories(role_category_id) ON DELETE SET NULL;


--
-- Name: roles roles_server_id_servers_server_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_server_id_servers_server_id_fk FOREIGN KEY (server_id) REFERENCES public.servers(server_id) ON DELETE CASCADE;


--
-- Name: tags tags_server_id_servers_server_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_server_id_servers_server_id_fk FOREIGN KEY (server_id) REFERENCES public.servers(server_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


