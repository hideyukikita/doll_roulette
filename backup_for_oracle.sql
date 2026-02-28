--
-- PostgreSQL database dump
--

\restrict NQJ5kGYLQe4WqDIeESefiYmdhpgtOIHURUh4y9hx3xS6d6Z7IDJCQ4HHCvebxuM

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

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

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: doll_images; Type: TABLE; Schema: public; Owner: doll_roulette
--

CREATE TABLE public.doll_images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    doll_id uuid NOT NULL,
    image_url character varying(255) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.doll_images OWNER TO doll_roulette;

--
-- Name: dolls; Type: TABLE; Schema: public; Owner: doll_roulette
--

CREATE TABLE public.dolls (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    color character varying(50) NOT NULL,
    is_selected boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.dolls OWNER TO doll_roulette;

--
-- Name: histories; Type: TABLE; Schema: public; Owner: doll_roulette
--

CREATE TABLE public.histories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    doll_id uuid NOT NULL,
    selected_at timestamp with time zone DEFAULT now(),
    doll_image_url character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE public.histories OWNER TO doll_roulette;

--
-- Name: outing_dolls; Type: TABLE; Schema: public; Owner: doll_roulette
--

CREATE TABLE public.outing_dolls (
    outing_id uuid NOT NULL,
    doll_id uuid NOT NULL
);


ALTER TABLE public.outing_dolls OWNER TO doll_roulette;

--
-- Name: outing_images; Type: TABLE; Schema: public; Owner: doll_roulette
--

CREATE TABLE public.outing_images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    outing_id uuid NOT NULL,
    image_url character varying(255) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.outing_images OWNER TO doll_roulette;

--
-- Name: outings; Type: TABLE; Schema: public; Owner: doll_roulette
--

CREATE TABLE public.outings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    place character varying(255) NOT NULL,
    outing_date timestamp with time zone NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.outings OWNER TO doll_roulette;

--
-- Data for Name: doll_images; Type: TABLE DATA; Schema: public; Owner: doll_roulette
--

COPY public.doll_images (id, doll_id, image_url, sort_order, created_at) FROM stdin;
68dbd811-4dcf-4958-ab96-a024a18c63d6	cf4c7788-5847-43f3-ae43-aa06b44b616c	/uploads/doll-cf4c7788-5847-43f3-ae43-aa06b44b616c-ff0a6f26.jpg	0	2026-02-12 11:42:36.980852+00
c94e3862-f559-4902-868c-4ae4514b5ccc	05b9bebe-ad22-41a1-aa1c-3230b12620e6	/uploads/doll-05b9bebe-ad22-41a1-aa1c-3230b12620e6-9adf9a83.jpg	0	2026-02-14 14:56:55.50641+00
d358b2f7-6c17-43f3-9d51-d88c956e1ff4	05b9bebe-ad22-41a1-aa1c-3230b12620e6	/uploads/doll-05b9bebe-ad22-41a1-aa1c-3230b12620e6-a672e51d.jpg	0	2026-02-14 14:59:12.406882+00
20710021-3cba-47fd-9509-b4fdf55ee194	05b9bebe-ad22-41a1-aa1c-3230b12620e6	/uploads/doll-05b9bebe-ad22-41a1-aa1c-3230b12620e6-27ab5de6.jpg	1	2026-02-14 14:59:12.412579+00
7b3c14e1-a9cb-4e56-95b9-ee26a5696317	05b9bebe-ad22-41a1-aa1c-3230b12620e6	/uploads/doll-05b9bebe-ad22-41a1-aa1c-3230b12620e6-9743a309.jpg	2	2026-02-14 14:59:12.415058+00
bbebf101-61b9-4d31-b944-e01f6d921ddc	05b9bebe-ad22-41a1-aa1c-3230b12620e6	/uploads/doll-05b9bebe-ad22-41a1-aa1c-3230b12620e6-f42f0e3e.jpg	3	2026-02-14 14:59:12.418888+00
acc3dcc1-9479-4dc1-bbba-173352bc2822	05b9bebe-ad22-41a1-aa1c-3230b12620e6	/uploads/doll-05b9bebe-ad22-41a1-aa1c-3230b12620e6-8298a87d.jpg	4	2026-02-14 14:59:12.425331+00
94217f9b-771b-4728-9dd2-e9f1d3de8013	05b9bebe-ad22-41a1-aa1c-3230b12620e6	/uploads/doll-05b9bebe-ad22-41a1-aa1c-3230b12620e6-053b13c4.jpg	5	2026-02-14 14:59:12.428035+00
b3d9b649-6bea-45d4-b0c5-2cace1b9881a	05b9bebe-ad22-41a1-aa1c-3230b12620e6	/uploads/doll-05b9bebe-ad22-41a1-aa1c-3230b12620e6-ed9b7d5d.jpg	6	2026-02-14 14:59:12.429985+00
ce9efe23-974e-4c95-88d2-8d3030005778	25830d5d-7bf6-42c6-9a02-8aee82f48afa	/uploads/doll-25830d5d-7bf6-42c6-9a02-8aee82f48afa-ab2dbafb.jpg	0	2026-02-14 15:01:39.372765+00
33af2438-ec24-40a2-a0f7-6737cccb78ae	25830d5d-7bf6-42c6-9a02-8aee82f48afa	/uploads/doll-25830d5d-7bf6-42c6-9a02-8aee82f48afa-e094dfca.jpg	1	2026-02-14 15:01:39.381203+00
924b946d-1608-4a44-a232-d2e8b4242ae0	25830d5d-7bf6-42c6-9a02-8aee82f48afa	/uploads/doll-25830d5d-7bf6-42c6-9a02-8aee82f48afa-a443f081.jpg	2	2026-02-14 15:01:39.38359+00
30052256-c907-4f32-a739-f70e4da567d6	4f819218-ce8f-49ac-bd47-ed9ca85a035b	/uploads/doll-4f819218-ce8f-49ac-bd47-ed9ca85a035b-69482bb1.jpg	0	2026-02-17 12:33:55.979869+00
ba2f49ad-84ca-4fd2-b332-54f4e669fc37	4f819218-ce8f-49ac-bd47-ed9ca85a035b	/uploads/doll-4f819218-ce8f-49ac-bd47-ed9ca85a035b-0d8739a2.jpg	1	2026-02-17 12:33:55.992755+00
e1c5ff8f-cc00-4050-afed-800d362f197d	4f819218-ce8f-49ac-bd47-ed9ca85a035b	/uploads/doll-4f819218-ce8f-49ac-bd47-ed9ca85a035b-f989f3ed.jpg	2	2026-02-17 12:33:55.994968+00
c6cdff55-9932-4471-8641-692482b38044	72de9206-13ca-45ac-93ae-751dba168cb1	/uploads/doll-72de9206-13ca-45ac-93ae-751dba168cb1-50fe729a.jpg	0	2026-02-17 12:35:05.288495+00
fb2ace2f-4083-409d-9f11-81d63c8c8772	72de9206-13ca-45ac-93ae-751dba168cb1	/uploads/doll-72de9206-13ca-45ac-93ae-751dba168cb1-75632f72.jpg	1	2026-02-17 12:35:05.295098+00
6c78b495-e473-4610-87bf-cc46e2dca122	72de9206-13ca-45ac-93ae-751dba168cb1	/uploads/doll-72de9206-13ca-45ac-93ae-751dba168cb1-bdb7b696.jpg	2	2026-02-17 12:35:05.297148+00
72aeb661-a4d9-4426-857a-4f65d20d6185	72de9206-13ca-45ac-93ae-751dba168cb1	/uploads/doll-72de9206-13ca-45ac-93ae-751dba168cb1-28d3374d.jpg	3	2026-02-17 12:35:05.299365+00
8d8f6156-9d99-470e-a655-99eb40b33c87	1135f5e2-ccc6-4ad6-b02e-ebbd74badaae	/uploads/doll-1135f5e2-ccc6-4ad6-b02e-ebbd74badaae-f102dfd2.jpg	0	2026-02-17 12:36:08.967491+00
aaed5947-acfc-41ed-b729-59e19fd76f65	1135f5e2-ccc6-4ad6-b02e-ebbd74badaae	/uploads/doll-1135f5e2-ccc6-4ad6-b02e-ebbd74badaae-ef0288c5.jpg	1	2026-02-17 12:36:08.972906+00
759f2865-0b87-4704-9321-63afa1d5ea18	1135f5e2-ccc6-4ad6-b02e-ebbd74badaae	/uploads/doll-1135f5e2-ccc6-4ad6-b02e-ebbd74badaae-ae8fbd79.jpg	2	2026-02-17 12:36:08.975069+00
ae5fbafb-5f6e-41aa-8f49-383299f81db8	dcd2b281-8dc4-4a97-ba3d-fd94c0f4774d	/uploads/doll-dcd2b281-8dc4-4a97-ba3d-fd94c0f4774d-28d2a4fb.jpg	0	2026-02-19 03:31:27.346032+00
249790fb-aa49-418f-b037-413061d532e2	dcd2b281-8dc4-4a97-ba3d-fd94c0f4774d	/uploads/doll-dcd2b281-8dc4-4a97-ba3d-fd94c0f4774d-2f761202.jpg	1	2026-02-19 03:31:27.356119+00
e250fe2a-e3a2-4756-8aa0-d4f4a0c82036	dcd2b281-8dc4-4a97-ba3d-fd94c0f4774d	/uploads/doll-dcd2b281-8dc4-4a97-ba3d-fd94c0f4774d-a8d1d5fd.jpg	2	2026-02-19 03:31:27.358348+00
7c1fe7bd-661a-4e85-8e1c-41813c0c33fd	dcd2b281-8dc4-4a97-ba3d-fd94c0f4774d	/uploads/doll-dcd2b281-8dc4-4a97-ba3d-fd94c0f4774d-d7adb5c2.jpg	3	2026-02-19 03:31:27.360921+00
dde1bf45-a334-4e8a-a766-ebeca23d25e6	339d3fbf-e66c-424f-8efc-5b0f07dd4e86	/uploads/doll-339d3fbf-e66c-424f-8efc-5b0f07dd4e86-4b21b4be.jpeg	0	2026-02-19 03:33:08.866139+00
870acfc2-2a84-4fba-8178-74db7c8cef36	339d3fbf-e66c-424f-8efc-5b0f07dd4e86	/uploads/doll-339d3fbf-e66c-424f-8efc-5b0f07dd4e86-59ff81c0.jpeg	1	2026-02-19 03:33:08.871292+00
9791f4a4-053e-4fde-94d0-92836a23431d	339d3fbf-e66c-424f-8efc-5b0f07dd4e86	/uploads/doll-339d3fbf-e66c-424f-8efc-5b0f07dd4e86-3d0110d5.jpeg	2	2026-02-19 03:33:08.874378+00
cb885364-6722-418f-b7e1-b1e144d2f1cc	339d3fbf-e66c-424f-8efc-5b0f07dd4e86	/uploads/doll-339d3fbf-e66c-424f-8efc-5b0f07dd4e86-d0b9bcac.jpeg	3	2026-02-19 03:33:08.876409+00
031a377e-4114-413c-a097-41083ac19594	f60d7bb5-c95a-4230-9b11-9ab94f0f79f6	/uploads/doll-f60d7bb5-c95a-4230-9b11-9ab94f0f79f6-c0f55ea9.jpg	0	2026-02-26 13:07:27.965274+00
de2cb5a4-ecb1-47af-bc32-a9a23f05bddb	e0e30efc-4c66-4953-acfd-5bf1e17dda71	/uploads/doll-e0e30efc-4c66-4953-acfd-5bf1e17dda71-f58080cb.jpg	0	2026-02-26 13:11:52.746246+00
80d6bda3-7ab7-47a9-99c0-3e5e7d1aaf69	e0e30efc-4c66-4953-acfd-5bf1e17dda71	/uploads/doll-e0e30efc-4c66-4953-acfd-5bf1e17dda71-418a22a5.jpg	1	2026-02-26 13:11:52.751592+00
aff00e7d-d1df-472d-8b68-e7bb39001b43	05b9bebe-ad22-41a1-aa1c-3230b12620e6	/uploads/05b9bebe-ad22-41a1-aa1c-3230b12620e6.jpg	0	2026-02-28 13:21:37.837678+00
d285d3a2-f680-4111-8baf-1ffb96b45d13	25830d5d-7bf6-42c6-9a02-8aee82f48afa	/uploads/25830d5d-7bf6-42c6-9a02-8aee82f48afa.jpg	0	2026-02-28 13:21:37.837678+00
a915936c-8d75-431f-997b-2df25a2c157d	aa7489ee-6820-48a1-a11b-8e2bbab990a8	/uploads/aa7489ee-6820-48a1-a11b-8e2bbab990a8.jpg	0	2026-02-28 13:21:37.837678+00
3a3a791a-cc3e-404a-ae08-ad3ed1305bb1	cf4c7788-5847-43f3-ae43-aa06b44b616c	/uploads/cf4c7788-5847-43f3-ae43-aa06b44b616c.jpg	0	2026-02-28 13:21:37.837678+00
45de3e5c-7c66-46fc-a7b1-6aa726441c99	072c31cd-e2f0-434f-801a-ae934fea7280	/uploads/072c31cd-e2f0-434f-801a-ae934fea7280.jpg	0	2026-02-28 13:21:37.837678+00
3e609099-b229-4392-a090-ae3f3a9bea4e	a1a4670f-8d87-416f-8535-0ce92aaea23f	/uploads/a1a4670f-8d87-416f-8535-0ce92aaea23f.jpg	0	2026-02-28 13:21:37.837678+00
951db0d0-d0cd-4596-9fff-c60f70bc2ccc	f38f6864-3e99-44fb-bc53-c78f829d98e7	/uploads/f38f6864-3e99-44fb-bc53-c78f829d98e7.jpg	0	2026-02-28 13:21:37.837678+00
95f8b39e-cd40-4339-ad55-3f361faa0a1f	7cadde2f-aa81-456e-a144-d3ce78eceae1	/uploads/7cadde2f-aa81-456e-a144-d3ce78eceae1.jpg	0	2026-02-28 13:21:37.837678+00
fedeb24c-f1e1-48b6-91eb-a6925212be8d	36ca1a71-15b4-49f9-9d43-ee47543a781e	/uploads/36ca1a71-15b4-49f9-9d43-ee47543a781e.jpg	0	2026-02-28 13:21:37.837678+00
0c3c152f-99f1-425f-8c07-b9b1400360c3	a149f34b-3025-48aa-b7cb-d9357cb3ff7f	/uploads/a149f34b-3025-48aa-b7cb-d9357cb3ff7f.jpg	0	2026-02-28 13:21:37.837678+00
4f21e9c4-eceb-420e-9152-18accd7e5261	077c3cf6-9093-40da-ba17-50eff82ec3a6	/uploads/077c3cf6-9093-40da-ba17-50eff82ec3a6.jpg	0	2026-02-28 13:21:37.837678+00
86845700-4058-4475-914e-1087116e98fe	4d5e6448-42e7-48a0-ac87-94581e423de9	/uploads/4d5e6448-42e7-48a0-ac87-94581e423de9.jpg	0	2026-02-28 13:21:37.837678+00
3082e4e4-60dd-4df3-ba30-5e97bcbff211	66e2dbfd-062e-43a3-bd51-b9655e0c1a0e	/uploads/66e2dbfd-062e-43a3-bd51-b9655e0c1a0e.jpeg	0	2026-02-28 13:21:37.837678+00
a1dae25f-fc2b-46b5-b14c-33827d085992	48a33958-1b0a-43ed-a8ff-fb19c0a38f95	/uploads/48a33958-1b0a-43ed-a8ff-fb19c0a38f95.jpg	0	2026-02-28 13:21:37.837678+00
fdd24a58-06b4-4619-ade7-32473fccb068	4f819218-ce8f-49ac-bd47-ed9ca85a035b	/uploads/4f819218-ce8f-49ac-bd47-ed9ca85a035b.jpg	0	2026-02-28 13:21:37.837678+00
93db86f5-ba4f-4c3e-b243-bd0681a9ba16	72de9206-13ca-45ac-93ae-751dba168cb1	/uploads/72de9206-13ca-45ac-93ae-751dba168cb1.jpg	0	2026-02-28 13:21:37.837678+00
1c427635-5e2b-4b83-96e1-c6bb68263555	1135f5e2-ccc6-4ad6-b02e-ebbd74badaae	/uploads/1135f5e2-ccc6-4ad6-b02e-ebbd74badaae.jpg	0	2026-02-28 13:21:37.837678+00
8b3e94eb-b638-48f6-badc-09ccc3e7e83b	dcd2b281-8dc4-4a97-ba3d-fd94c0f4774d	/uploads/dcd2b281-8dc4-4a97-ba3d-fd94c0f4774d.jpg	0	2026-02-28 13:21:37.837678+00
9dedc14e-5e85-4192-88d2-fdc17d179985	339d3fbf-e66c-424f-8efc-5b0f07dd4e86	/uploads/339d3fbf-e66c-424f-8efc-5b0f07dd4e86.jpg	0	2026-02-28 13:21:37.837678+00
268223ac-889b-4811-9b48-d1f6b986f37a	14bd360a-0764-4c42-908c-b1b5c6651371	/uploads/14bd360a-0764-4c42-908c-b1b5c6651371.jpg	0	2026-02-28 13:21:37.837678+00
2a5de4cb-fc1f-47d1-98a6-73f97e783678	8be6a404-22d2-4b16-af43-bb964fa13735	/uploads/8be6a404-22d2-4b16-af43-bb964fa13735.jpg	0	2026-02-28 13:21:37.837678+00
f59ff063-d201-4bd0-beae-52551c97363f	e1072333-c648-4ebe-a6b4-2f03c3dc3ecc	/uploads/e1072333-c648-4ebe-a6b4-2f03c3dc3ecc.jpg	0	2026-02-28 13:21:37.837678+00
c89c2ea4-0b1f-4707-9d11-1c63ec89be06	4e65ddf7-d0ed-4714-a4ae-5bf52357518a	/uploads/4e65ddf7-d0ed-4714-a4ae-5bf52357518a.jpg	0	2026-02-28 13:21:37.837678+00
423be09c-0625-4d95-b3bf-2b492c64b751	f60d7bb5-c95a-4230-9b11-9ab94f0f79f6	/uploads/f60d7bb5-c95a-4230-9b11-9ab94f0f79f6.jpg	0	2026-02-28 13:21:37.837678+00
e0265cba-eb85-4e3d-8006-d0e315415845	e0e30efc-4c66-4953-acfd-5bf1e17dda71	/uploads/e0e30efc-4c66-4953-acfd-5bf1e17dda71.jpg	0	2026-02-28 13:21:37.837678+00
\.


--
-- Data for Name: dolls; Type: TABLE DATA; Schema: public; Owner: doll_roulette
--

COPY public.dolls (id, name, color, is_selected, created_at) FROM stdin;
05b9bebe-ad22-41a1-aa1c-3230b12620e6	ありちゃん	黄	t	2026-02-09 12:37:08.869901+00
25830d5d-7bf6-42c6-9a02-8aee82f48afa	みるちゃそ	ピンク	f	2026-02-09 12:03:25.519379+00
aa7489ee-6820-48a1-a11b-8e2bbab990a8	めよ	茶色	t	2026-02-09 12:12:36.502669+00
cf4c7788-5847-43f3-ae43-aa06b44b616c	だぁこ	黄	t	2026-02-09 12:13:20.218213+00
072c31cd-e2f0-434f-801a-ae934fea7280	ふぅちゃん	茶色	f	2026-02-09 12:32:20.532115+00
a1a4670f-8d87-416f-8535-0ce92aaea23f	ぜにちゃん	青	f	2026-02-09 12:34:05.471103+00
f38f6864-3e99-44fb-bc53-c78f829d98e7	かっぴー先生	黒	f	2026-02-09 12:30:43.071597+00
7cadde2f-aa81-456e-a144-d3ce78eceae1	ぷよん	青	f	2026-02-09 12:04:22.49622+00
36ca1a71-15b4-49f9-9d43-ee47543a781e	こーん	白	f	2026-02-09 12:11:22.397788+00
a149f34b-3025-48aa-b7cb-d9357cb3ff7f	ひそちゃん	緑	f	2026-02-09 12:15:55.700763+00
077c3cf6-9093-40da-ba17-50eff82ec3a6	はむ	黒	f	2026-02-09 12:20:05.900698+00
4d5e6448-42e7-48a0-ac87-94581e423de9	おぱんつちゃん	ピンク	f	2026-02-09 12:27:57.982515+00
66e2dbfd-062e-43a3-bd51-b9655e0c1a0e	もるちゃん	黄	f	2026-02-09 12:07:40.838827+00
48a33958-1b0a-43ed-a8ff-fb19c0a38f95	おりちゃん	ピンク	t	2026-02-09 12:22:10.755731+00
4f819218-ce8f-49ac-bd47-ed9ca85a035b	らぅちゃん	白	t	2026-02-09 12:02:45.971882+00
72de9206-13ca-45ac-93ae-751dba168cb1	ぬこたま	緑	t	2026-02-09 12:21:22.880004+00
1135f5e2-ccc6-4ad6-b02e-ebbd74badaae	ぽたー	青	t	2026-02-09 12:25:45.423446+00
dcd2b281-8dc4-4a97-ba3d-fd94c0f4774d	もぅちゃん	緑	f	2026-02-09 12:28:54.119221+00
339d3fbf-e66c-424f-8efc-5b0f07dd4e86	ぱぴ	黄	t	2026-02-09 12:19:07.140796+00
14bd360a-0764-4c42-908c-b1b5c6651371	はみ	ピンク	t	2026-02-09 12:17:23.914407+00
8be6a404-22d2-4b16-af43-bb964fa13735	うさぴー	黄	t	2026-02-09 12:23:47.283368+00
e1072333-c648-4ebe-a6b4-2f03c3dc3ecc	ぷーまる	白	t	2026-02-09 12:09:53.763785+00
4e65ddf7-d0ed-4714-a4ae-5bf52357518a	ちーず	紫	t	2026-02-09 12:05:25.679273+00
f60d7bb5-c95a-4230-9b11-9ab94f0f79f6	なうちゃん	青	t	2026-02-09 12:15:05.725783+00
e0e30efc-4c66-4953-acfd-5bf1e17dda71	ぽて	グレー	t	2026-02-09 12:26:26.168063+00
\.


--
-- Data for Name: histories; Type: TABLE DATA; Schema: public; Owner: doll_roulette
--

COPY public.histories (id, doll_id, selected_at, doll_image_url) FROM stdin;
2c479cb4-9c88-4689-80fe-44d948a6ba45	48a33958-1b0a-43ed-a8ff-fb19c0a38f95	2026-02-10 10:43:22.068006+00	\N
6c49ace3-fbcb-4247-a4ed-95a873af0ea4	cf4c7788-5847-43f3-ae43-aa06b44b616c	2026-02-11 10:08:28.194061+00	\N
80e9abe2-f6cf-4ad5-89b4-b204dbdfd8a8	05b9bebe-ad22-41a1-aa1c-3230b12620e6	2026-02-13 11:29:58.208242+00	/uploads/05b9bebe-ad22-41a1-aa1c-3230b12620e6.jpg
eacd4793-be61-4645-9925-20b90325e6dd	1135f5e2-ccc6-4ad6-b02e-ebbd74badaae	2026-02-15 06:05:51.239196+00	/uploads/1135f5e2-ccc6-4ad6-b02e-ebbd74badaae.jpg
68266e5d-c463-4968-9759-260e75bc223f	72de9206-13ca-45ac-93ae-751dba168cb1	2026-02-16 10:29:53.539832+00	/uploads/72de9206-13ca-45ac-93ae-751dba168cb1.jpg
d900a365-1970-4eb0-91bc-0f77e423651b	4f819218-ce8f-49ac-bd47-ed9ca85a035b	2026-02-17 10:41:56.277082+00	/uploads/4f819218-ce8f-49ac-bd47-ed9ca85a035b.jpg
8f19bb49-f615-41b8-b2b8-83b6e7dcd256	339d3fbf-e66c-424f-8efc-5b0f07dd4e86	2026-02-18 11:10:19.763128+00	/uploads/339d3fbf-e66c-424f-8efc-5b0f07dd4e86.jpg
bdbbd0bc-188b-434b-9ea4-5cf6a6d9f22b	14bd360a-0764-4c42-908c-b1b5c6651371	2026-02-20 12:27:03.796785+00	/uploads/14bd360a-0764-4c42-908c-b1b5c6651371.jpg
013946c7-f23b-42d4-9a17-3b48fb5919c7	e0e30efc-4c66-4953-acfd-5bf1e17dda71	2026-02-21 11:34:11.356532+00	/uploads/e0e30efc-4c66-4953-acfd-5bf1e17dda71.jpg
e1ed677e-cafe-4b83-b938-b5e7e2ea252c	8be6a404-22d2-4b16-af43-bb964fa13735	2026-02-22 10:28:51.555871+00	/uploads/8be6a404-22d2-4b16-af43-bb964fa13735.jpg
fdb096ff-3e3c-4c5d-874f-82db34daf41b	e1072333-c648-4ebe-a6b4-2f03c3dc3ecc	2026-02-23 04:45:45.31737+00	/uploads/e1072333-c648-4ebe-a6b4-2f03c3dc3ecc.jpg
bd771027-b591-4f7d-b2ac-753f14505e3a	aa7489ee-6820-48a1-a11b-8e2bbab990a8	2026-02-24 12:08:50.396183+00	/uploads/aa7489ee-6820-48a1-a11b-8e2bbab990a8.jpg
f86a1e29-0bb6-4aad-8b47-14340e053e3e	4e65ddf7-d0ed-4714-a4ae-5bf52357518a	2026-02-25 10:49:23.676845+00	/uploads/4e65ddf7-d0ed-4714-a4ae-5bf52357518a.jpg
2d69588b-df50-49d0-8b01-e827bf60de88	f60d7bb5-c95a-4230-9b11-9ab94f0f79f6	2026-02-26 10:53:43.428097+00	/uploads/f60d7bb5-c95a-4230-9b11-9ab94f0f79f6.jpg
\.


--
-- Data for Name: outing_dolls; Type: TABLE DATA; Schema: public; Owner: doll_roulette
--

COPY public.outing_dolls (outing_id, doll_id) FROM stdin;
d4762bc4-a527-45a7-84b1-88d9cd950ae8	cf4c7788-5847-43f3-ae43-aa06b44b616c
d4762bc4-a527-45a7-84b1-88d9cd950ae8	48a33958-1b0a-43ed-a8ff-fb19c0a38f95
72e2dd29-1236-45ff-a54a-42423dbd5927	25830d5d-7bf6-42c6-9a02-8aee82f48afa
edb60ce8-8885-45bd-b087-66f1352bd279	05b9bebe-ad22-41a1-aa1c-3230b12620e6
baf64c87-ae8e-4981-b048-d64cf4f9b969	e0e30efc-4c66-4953-acfd-5bf1e17dda71
baf64c87-ae8e-4981-b048-d64cf4f9b969	8be6a404-22d2-4b16-af43-bb964fa13735
baf64c87-ae8e-4981-b048-d64cf4f9b969	14bd360a-0764-4c42-908c-b1b5c6651371
baf64c87-ae8e-4981-b048-d64cf4f9b969	339d3fbf-e66c-424f-8efc-5b0f07dd4e86
\.


--
-- Data for Name: outing_images; Type: TABLE DATA; Schema: public; Owner: doll_roulette
--

COPY public.outing_images (id, outing_id, image_url, sort_order, created_at) FROM stdin;
80f7f2a2-a0cf-45eb-8963-7a2dc6fc0978	72e2dd29-1236-45ff-a54a-42423dbd5927	/uploads/outing-72e2dd29-1236-45ff-a54a-42423dbd5927-cf8167b7.jpg	0	2026-02-12 04:42:31.038238+00
3337c530-799b-49b5-ad9b-cf93ce252ea5	72e2dd29-1236-45ff-a54a-42423dbd5927	/uploads/outing-72e2dd29-1236-45ff-a54a-42423dbd5927-f6be66ec.jpg	1	2026-02-12 04:42:31.043117+00
b0617b74-a3dd-4dae-93ff-8b6d2b8328e5	72e2dd29-1236-45ff-a54a-42423dbd5927	/uploads/outing-72e2dd29-1236-45ff-a54a-42423dbd5927-c1906605.jpg	2	2026-02-12 04:42:31.045004+00
ed5ffc44-45c4-4992-a59b-5274eab7624d	72e2dd29-1236-45ff-a54a-42423dbd5927	/uploads/outing-72e2dd29-1236-45ff-a54a-42423dbd5927-35a248c6.jpg	3	2026-02-12 04:42:31.046567+00
adea51bc-e312-4565-805c-37cd81e05192	72e2dd29-1236-45ff-a54a-42423dbd5927	/uploads/outing-72e2dd29-1236-45ff-a54a-42423dbd5927-98b3c6f4.jpg	4	2026-02-12 04:42:31.047994+00
130f2796-aba9-48d7-b56d-8fdd813beed9	72e2dd29-1236-45ff-a54a-42423dbd5927	/uploads/outing-72e2dd29-1236-45ff-a54a-42423dbd5927-82885dfa.jpg	5	2026-02-12 04:42:31.049833+00
56a25a43-1496-47ca-950c-38634e9b0911	72e2dd29-1236-45ff-a54a-42423dbd5927	/uploads/outing-72e2dd29-1236-45ff-a54a-42423dbd5927-ca56ac47.jpg	6	2026-02-12 04:42:31.051884+00
89aa475b-04b4-4059-ab1e-4c36925d285d	72e2dd29-1236-45ff-a54a-42423dbd5927	/uploads/outing-72e2dd29-1236-45ff-a54a-42423dbd5927-9a46e606.jpg	7	2026-02-12 04:42:31.053796+00
a663a4c8-33ec-46a8-89a2-eb27ca1f3164	72e2dd29-1236-45ff-a54a-42423dbd5927	/uploads/outing-72e2dd29-1236-45ff-a54a-42423dbd5927-5067af16.jpg	8	2026-02-12 04:42:31.055342+00
d02ec8cd-0e62-4134-bc81-30f65eb1dc54	72e2dd29-1236-45ff-a54a-42423dbd5927	/uploads/outing-72e2dd29-1236-45ff-a54a-42423dbd5927-a614bb93.jpg	9	2026-02-12 04:42:31.056945+00
65928bc7-1b99-4fb6-a2ac-2fd2cca12582	72e2dd29-1236-45ff-a54a-42423dbd5927	/uploads/outing-72e2dd29-1236-45ff-a54a-42423dbd5927-879de2c0.jpg	10	2026-02-12 04:42:31.058481+00
3154e20e-c7b3-4e83-b769-c085f4005329	72e2dd29-1236-45ff-a54a-42423dbd5927	/uploads/outing-72e2dd29-1236-45ff-a54a-42423dbd5927-cfbaa132.jpg	11	2026-02-12 04:42:31.060433+00
08e56951-784b-4b68-9364-044c8857aa37	72e2dd29-1236-45ff-a54a-42423dbd5927	/uploads/outing-72e2dd29-1236-45ff-a54a-42423dbd5927-f0ca0919.jpg	12	2026-02-12 04:42:31.062013+00
1d6ff1e3-50c6-4c68-9a3c-f0e354b75f98	72e2dd29-1236-45ff-a54a-42423dbd5927	/uploads/outing-72e2dd29-1236-45ff-a54a-42423dbd5927-4ae200d1.jpg	13	2026-02-12 04:42:31.063463+00
18ddc001-0b5b-4256-aceb-af7962502e38	72e2dd29-1236-45ff-a54a-42423dbd5927	/uploads/outing-72e2dd29-1236-45ff-a54a-42423dbd5927-6c286981.jpg	14	2026-02-12 04:42:31.064841+00
c3c1a5da-b37f-4d49-99c9-900aed2bd19a	d4762bc4-a527-45a7-84b1-88d9cd950ae8	/uploads/outing-d4762bc4-a527-45a7-84b1-88d9cd950ae8-5cea19cc.jpg	0	2026-02-12 11:39:56.732049+00
c53fd02a-990b-4ee0-bbd9-71c17a2b525c	d4762bc4-a527-45a7-84b1-88d9cd950ae8	/uploads/outing-d4762bc4-a527-45a7-84b1-88d9cd950ae8-208bea30.jpg	1	2026-02-12 11:39:56.73596+00
90fb1098-0613-4482-bc4e-025bc91d80ed	d4762bc4-a527-45a7-84b1-88d9cd950ae8	/uploads/outing-d4762bc4-a527-45a7-84b1-88d9cd950ae8-e88408cd.jpg	2	2026-02-12 11:39:56.73763+00
67e8d0fe-3a6e-45f6-822d-598a57a99c91	d4762bc4-a527-45a7-84b1-88d9cd950ae8	/uploads/outing-d4762bc4-a527-45a7-84b1-88d9cd950ae8-e66e07ee.jpg	3	2026-02-12 11:39:56.739284+00
c015bc4b-0eec-455d-88e9-11c24cafc796	d4762bc4-a527-45a7-84b1-88d9cd950ae8	/uploads/outing-d4762bc4-a527-45a7-84b1-88d9cd950ae8-39e3e5e1.jpg	4	2026-02-12 11:39:56.741058+00
77309024-6988-4594-beaa-37d3b4b7eb63	d4762bc4-a527-45a7-84b1-88d9cd950ae8	/uploads/outing-d4762bc4-a527-45a7-84b1-88d9cd950ae8-82dffc69.jpg	5	2026-02-12 11:39:56.742648+00
2dc93e64-c1da-4fb9-8aff-feb20202a49c	d4762bc4-a527-45a7-84b1-88d9cd950ae8	/uploads/outing-d4762bc4-a527-45a7-84b1-88d9cd950ae8-d4f7aa6a.jpg	6	2026-02-12 11:39:56.744366+00
2a04f100-1756-4887-a37a-386f2b30c748	72e2dd29-1236-45ff-a54a-42423dbd5927	/uploads/outing-72e2dd29-1236-45ff-a54a-42423dbd5927-b5c8ecae.jpeg	0	2026-02-12 11:41:19.676716+00
60b15df2-9252-4632-ab9c-564b89e3fe87	72e2dd29-1236-45ff-a54a-42423dbd5927	/uploads/outing-72e2dd29-1236-45ff-a54a-42423dbd5927-bfda4fb1.jpeg	1	2026-02-12 11:41:19.682267+00
9bfe84dc-7d2c-4521-b7e0-ec154578b52b	72e2dd29-1236-45ff-a54a-42423dbd5927	/uploads/outing-72e2dd29-1236-45ff-a54a-42423dbd5927-90d1873b.jpeg	2	2026-02-12 11:41:19.68419+00
3a6c04dc-0f76-4f4f-be5a-3fdd43d14189	72e2dd29-1236-45ff-a54a-42423dbd5927	/uploads/outing-72e2dd29-1236-45ff-a54a-42423dbd5927-1ea90495.jpeg	3	2026-02-12 11:41:19.685682+00
13272acd-e934-4d1b-b73d-476b25ee08b6	72e2dd29-1236-45ff-a54a-42423dbd5927	/uploads/outing-72e2dd29-1236-45ff-a54a-42423dbd5927-7e4ed788.jpeg	4	2026-02-12 11:41:19.687179+00
407142b8-7ec6-4846-8125-1f03d48988aa	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-4749254d.jpg	0	2026-02-14 14:44:22.062478+00
62fd024e-52be-4bc0-a18f-b35ffa10f9a7	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-d4b22d06.jpg	1	2026-02-14 14:44:22.066181+00
1c9038bc-09f5-4892-8370-4d99feaa1e83	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-264211d8.jpg	2	2026-02-14 14:44:22.067825+00
469728d6-8ed6-4b18-8c06-0064a2a61c29	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-fc3c0d38.jpg	3	2026-02-14 14:44:22.0694+00
0ca01c4f-c719-4fb1-b827-67c39c6e3caf	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-1f79b4af.jpg	4	2026-02-14 14:44:22.070892+00
0f355d86-e131-40e6-9806-32b6055f1312	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-c8ae76d9.jpg	5	2026-02-14 14:44:22.072581+00
deede5fc-064f-4a05-968a-fdacbdd67c69	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-7681ac54.jpg	6	2026-02-14 14:44:22.074142+00
2a240dc6-462e-4adc-8eca-95e66884ebc8	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-221d8ba6.jpg	7	2026-02-14 14:44:22.075572+00
bd5fdfbc-96f6-4a56-8e97-7ee45700523f	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-8d39930a.jpg	8	2026-02-14 14:44:22.077275+00
d80de6bf-7d83-4373-a6d6-6d0f088413f2	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-13db406e.jpg	9	2026-02-14 14:44:22.078841+00
20658bad-4fa3-4f0b-b60b-dc3296eae684	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-8de80a38.jpg	10	2026-02-14 14:44:22.080382+00
1e61d51f-723c-4c98-8184-a6c07155a2ce	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-51645a32.jpg	11	2026-02-14 14:44:22.081834+00
5ba0cbc5-a9c7-4292-a182-d48d00f0b33d	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-8c3a4268.jpg	12	2026-02-14 14:44:22.083326+00
b873c060-27cb-4b3f-9a33-3d9e5f8385e3	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-cdcd0d3c.jpg	13	2026-02-14 14:44:22.084747+00
e8f1ec49-88be-4605-9717-71a1b7d4d5a2	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-ec17a614.jpg	14	2026-02-14 14:44:22.086143+00
5c15f213-6616-4194-a2db-c96d761393c6	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-c884be0e.jpg	15	2026-02-14 14:44:22.089867+00
89e1364e-38ad-4a8f-b8ae-d9a4b5951c93	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-10a0d382.jpg	16	2026-02-14 14:44:22.091728+00
9fb46131-a576-4114-a41c-6545473dea31	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-962f6c7b.jpg	17	2026-02-14 14:44:22.09344+00
bc7e9783-460d-4b1d-a6dc-9f1fc5e08188	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-68951291.jpg	18	2026-02-14 14:44:22.09494+00
513debc7-3b68-4e4b-b6b8-2b44fc2c096c	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-4cdc9955.jpg	19	2026-02-14 14:44:22.096431+00
fc6adfca-a91c-4b95-99f3-e96bade077cd	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-67709bc2.jpeg	0	2026-02-14 16:10:10.110174+00
7b830a5c-2667-4f38-ad32-5a31deeb6c56	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-d0d1af10.jpeg	1	2026-02-14 16:10:10.117289+00
100f1cdd-e33f-4d65-941c-de4147571e1b	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-a7304360.jpeg	2	2026-02-14 16:10:10.119354+00
f55e7a09-9461-442b-91f8-69104bfa3ab3	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-b6ec46d8.jpeg	3	2026-02-14 16:10:10.121157+00
e1e258a4-42aa-49ea-a116-74d5f77f2859	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-d8d830ee.jpeg	4	2026-02-14 16:10:10.12314+00
b77825cd-1b8c-4b3f-b030-1bdd71505aef	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-5ecdd779.jpeg	5	2026-02-14 16:10:10.124784+00
1aa27407-7609-4312-854a-cf7b9c897593	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-8d2ab1c8.jpeg	6	2026-02-14 16:10:10.127003+00
6acef2d8-748f-4bd8-b0dc-5d99c019f422	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-4167c067.jpeg	7	2026-02-14 16:10:10.128851+00
d7d0317f-949b-4168-a286-a83f312c21e6	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-a4760f36.jpeg	8	2026-02-14 16:10:10.130443+00
bcc95c36-8d25-4517-98a7-9431a7266038	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-60069bd2.jpeg	9	2026-02-14 16:10:10.132392+00
c22e1eaf-ed11-4c10-9c40-5a90a1f46d05	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-71ed7f80.jpeg	10	2026-02-14 16:10:10.134169+00
77745a27-440f-4af1-bc16-1e837dd4956b	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-c594a260.jpeg	11	2026-02-14 16:10:10.135885+00
b60cda3a-e192-480e-b8de-187d6b8be96c	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-09be3c3b.jpeg	12	2026-02-14 16:10:10.13771+00
7b6fb2fb-4b31-4276-8c71-6255494e4106	edb60ce8-8885-45bd-b087-66f1352bd279	/uploads/outing-edb60ce8-8885-45bd-b087-66f1352bd279-c8985d16.jpeg	13	2026-02-14 16:10:10.139283+00
f12292eb-0193-4be2-a22b-c42a1c4cf750	baf64c87-ae8e-4981-b048-d64cf4f9b969	/uploads/outing-baf64c87-ae8e-4981-b048-d64cf4f9b969-1c25fbfe.jpg	0	2026-02-26 13:10:29.098405+00
2e87a93a-653e-4c8c-95d8-0937ef5a86a9	baf64c87-ae8e-4981-b048-d64cf4f9b969	/uploads/outing-baf64c87-ae8e-4981-b048-d64cf4f9b969-3589e8fa.jpg	1	2026-02-26 13:10:29.10556+00
c0d8c8b4-f466-4e6e-b42e-1a53bb2ccc80	baf64c87-ae8e-4981-b048-d64cf4f9b969	/uploads/outing-baf64c87-ae8e-4981-b048-d64cf4f9b969-f4ccd713.jpg	2	2026-02-26 13:10:29.107865+00
4560a56d-e4a7-4c36-bcfe-afaae09a2ed2	baf64c87-ae8e-4981-b048-d64cf4f9b969	/uploads/outing-baf64c87-ae8e-4981-b048-d64cf4f9b969-552fc65a.jpg	3	2026-02-26 13:10:29.111104+00
706d018b-0856-44ca-bc9f-e9c0dcc3c95e	baf64c87-ae8e-4981-b048-d64cf4f9b969	/uploads/outing-baf64c87-ae8e-4981-b048-d64cf4f9b969-0385aea1.jpg	4	2026-02-26 13:10:29.114441+00
e5383df4-bcf1-466f-aeb4-bbc25a9bb292	baf64c87-ae8e-4981-b048-d64cf4f9b969	/uploads/outing-baf64c87-ae8e-4981-b048-d64cf4f9b969-cd08a188.jpg	5	2026-02-26 13:10:29.116338+00
925321b8-4d0f-48c9-8525-6471bbca54df	baf64c87-ae8e-4981-b048-d64cf4f9b969	/uploads/outing-baf64c87-ae8e-4981-b048-d64cf4f9b969-c5cc392e.jpg	6	2026-02-26 13:10:29.118672+00
69262840-4e19-41f8-8092-707fb7d0f37b	baf64c87-ae8e-4981-b048-d64cf4f9b969	/uploads/outing-baf64c87-ae8e-4981-b048-d64cf4f9b969-5a43ae3d.jpg	7	2026-02-26 13:10:29.121417+00
ac328672-9f8c-4913-9df4-e1107405b27e	baf64c87-ae8e-4981-b048-d64cf4f9b969	/uploads/outing-baf64c87-ae8e-4981-b048-d64cf4f9b969-7fcd136d.jpg	8	2026-02-26 13:10:29.12361+00
1f5a5f6d-e66c-4678-85b4-f1ae379ed61e	baf64c87-ae8e-4981-b048-d64cf4f9b969	/uploads/outing-baf64c87-ae8e-4981-b048-d64cf4f9b969-8719dd4b.jpg	9	2026-02-26 13:10:29.125484+00
e168d0e6-572b-46d8-8a04-7f136c4e1bab	baf64c87-ae8e-4981-b048-d64cf4f9b969	/uploads/outing-baf64c87-ae8e-4981-b048-d64cf4f9b969-13860db8.jpg	10	2026-02-26 13:10:29.127229+00
855ef7d3-0973-40a4-90b5-f7dd397e7f93	baf64c87-ae8e-4981-b048-d64cf4f9b969	/uploads/outing-baf64c87-ae8e-4981-b048-d64cf4f9b969-2836945f.jpg	11	2026-02-26 13:10:29.129085+00
\.


--
-- Data for Name: outings; Type: TABLE DATA; Schema: public; Owner: doll_roulette
--

COPY public.outings (id, place, outing_date, comment, created_at) FROM stdin;
d4762bc4-a527-45a7-84b1-88d9cd950ae8	いつもの日常	2026-02-12 00:00:00+00	特別ボーナス2日目	2026-02-12 11:39:55.980778+00
72e2dd29-1236-45ff-a54a-42423dbd5927	近代美術館	2026-02-11 00:00:00+00	タコス、ビビンバ	2026-02-12 04:42:28.294763+00
edb60ce8-8885-45bd-b087-66f1352bd279	バレンタインデー	2026-02-14 00:00:00+00	中華、水族館、ハンバーグ	2026-02-14 14:44:18.747637+00
baf64c87-ae8e-4981-b048-d64cf4f9b969	ぱーちー	2026-02-22 00:00:00+00	コンビニぱーちー、カツオ	2026-02-26 13:10:27.56298+00
\.


--
-- Name: doll_images doll_images_pkey; Type: CONSTRAINT; Schema: public; Owner: doll_roulette
--

ALTER TABLE ONLY public.doll_images
    ADD CONSTRAINT doll_images_pkey PRIMARY KEY (id);


--
-- Name: dolls dolls_pkey; Type: CONSTRAINT; Schema: public; Owner: doll_roulette
--

ALTER TABLE ONLY public.dolls
    ADD CONSTRAINT dolls_pkey PRIMARY KEY (id);


--
-- Name: histories histories_pkey; Type: CONSTRAINT; Schema: public; Owner: doll_roulette
--

ALTER TABLE ONLY public.histories
    ADD CONSTRAINT histories_pkey PRIMARY KEY (id);


--
-- Name: outing_dolls outing_dolls_pkey; Type: CONSTRAINT; Schema: public; Owner: doll_roulette
--

ALTER TABLE ONLY public.outing_dolls
    ADD CONSTRAINT outing_dolls_pkey PRIMARY KEY (outing_id, doll_id);


--
-- Name: outing_images outing_images_pkey; Type: CONSTRAINT; Schema: public; Owner: doll_roulette
--

ALTER TABLE ONLY public.outing_images
    ADD CONSTRAINT outing_images_pkey PRIMARY KEY (id);


--
-- Name: outings outings_pkey; Type: CONSTRAINT; Schema: public; Owner: doll_roulette
--

ALTER TABLE ONLY public.outings
    ADD CONSTRAINT outings_pkey PRIMARY KEY (id);


--
-- Name: idx_doll_images_doll_id; Type: INDEX; Schema: public; Owner: doll_roulette
--

CREATE INDEX idx_doll_images_doll_id ON public.doll_images USING btree (doll_id);


--
-- Name: idx_histories_doll_id; Type: INDEX; Schema: public; Owner: doll_roulette
--

CREATE INDEX idx_histories_doll_id ON public.histories USING btree (doll_id);


--
-- Name: idx_histories_selected_at; Type: INDEX; Schema: public; Owner: doll_roulette
--

CREATE INDEX idx_histories_selected_at ON public.histories USING btree (selected_at DESC);


--
-- Name: idx_outing_images_outing_id; Type: INDEX; Schema: public; Owner: doll_roulette
--

CREATE INDEX idx_outing_images_outing_id ON public.outing_images USING btree (outing_id);


--
-- Name: idx_outings_outing_date; Type: INDEX; Schema: public; Owner: doll_roulette
--

CREATE INDEX idx_outings_outing_date ON public.outings USING btree (outing_date DESC);


--
-- Name: doll_images doll_images_doll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: doll_roulette
--

ALTER TABLE ONLY public.doll_images
    ADD CONSTRAINT doll_images_doll_id_fkey FOREIGN KEY (doll_id) REFERENCES public.dolls(id) ON DELETE CASCADE;


--
-- Name: histories histories_doll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: doll_roulette
--

ALTER TABLE ONLY public.histories
    ADD CONSTRAINT histories_doll_id_fkey FOREIGN KEY (doll_id) REFERENCES public.dolls(id) ON DELETE CASCADE;


--
-- Name: outing_dolls outing_dolls_doll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: doll_roulette
--

ALTER TABLE ONLY public.outing_dolls
    ADD CONSTRAINT outing_dolls_doll_id_fkey FOREIGN KEY (doll_id) REFERENCES public.dolls(id) ON DELETE CASCADE;


--
-- Name: outing_dolls outing_dolls_outing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: doll_roulette
--

ALTER TABLE ONLY public.outing_dolls
    ADD CONSTRAINT outing_dolls_outing_id_fkey FOREIGN KEY (outing_id) REFERENCES public.outings(id) ON DELETE CASCADE;


--
-- Name: outing_images outing_images_outing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: doll_roulette
--

ALTER TABLE ONLY public.outing_images
    ADD CONSTRAINT outing_images_outing_id_fkey FOREIGN KEY (outing_id) REFERENCES public.outings(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict NQJ5kGYLQe4WqDIeESefiYmdhpgtOIHURUh4y9hx3xS6d6Z7IDJCQ4HHCvebxuM

