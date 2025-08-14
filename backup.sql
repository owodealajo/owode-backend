--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

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
-- Name: Transaction; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public."Transaction" (
    id text NOT NULL,
    amount double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "senderId" integer NOT NULL,
    "recipientId" integer NOT NULL
);


ALTER TABLE public."Transaction" OWNER TO app_user;

--
-- Name: User; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public."User" (
    "firstName" text NOT NULL,
    "lastName" text,
    email text NOT NULL,
    password text,
    "phoneNumber" text NOT NULL,
    id integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    otp text,
    "otpExpires" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone
);


ALTER TABLE public."User" OWNER TO app_user;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: app_user
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."User_id_seq" OWNER TO app_user;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: app_user
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: Wallet; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public."Wallet" (
    id text NOT NULL,
    balance double precision DEFAULT 0.0 NOT NULL,
    currency text DEFAULT 'NGN'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "userId" integer NOT NULL
);


ALTER TABLE public."Wallet" OWNER TO app_user;

--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: app_user
--

COPY public."Transaction" (id, amount, "createdAt", "senderId", "recipientId") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: app_user
--

COPY public."User" ("firstName", "lastName", email, password, "phoneNumber", id, "createdAt", "isVerified", otp, "otpExpires", "updatedAt") FROM stdin;
iyiola	Qozeem	iyiolar9@gmail.com	$2b$10$BvcuLh8TljEUTLmqHCsNDey3/0STGJJ.ErFFH.8ANC6TOwvew8R8m	+2348085806038	11	2025-08-09 05:01:15.753	t	\N	\N	2025-08-09 05:23:38.528
\.


--
-- Data for Name: Wallet; Type: TABLE DATA; Schema: public; Owner: app_user
--

COPY public."Wallet" (id, balance, currency, status, "userId") FROM stdin;
\.


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: app_user
--

SELECT pg_catalog.setval('public."User_id_seq"', 11, true);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Wallet Wallet_pkey; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public."Wallet"
    ADD CONSTRAINT "Wallet_pkey" PRIMARY KEY (id);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: app_user
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Transaction Transaction_recipientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Wallet Wallet_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public."Wallet"
    ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

