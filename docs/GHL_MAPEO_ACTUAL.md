# 📊 MAPEO COMPLETO - CUENTA GHL CLIENTE
**Location ID:** `WWrBqekGJCsCmSSvPzEf`
**Última actualización:** 2026-01-02

---

## ✅ CUSTOM FIELDS IMPLEMENTADOS (30 campos)

### **GRUPO 1: Búsqueda IA** (Parent ID: `uB2Mmf4IM7grP0nIQnf0`)

| # | Nombre Campo | Field Key | ID | Tipo | Opciones |
|---|--------------|-----------|----|----- |----------|
| 1 | zona | `contact.zona` | `eG9pUwxa14BaJPcniff4` | TEXT | - |
| 2 | Operacion | `contact.intencion` | `eyaHssuX5zAXIAJWHLD7` | TEXT | - |
| 3 | Presupuesto_ia | `contact.presupuesto_ia` | `ihIevvOORQdZzHG1gAhB` | NUMERICAL | - |
| 4 | Ambientes | `contact.ambientes` | `KZrsvB6kjmH89d50RssM` | TEXT | - |
| 5 | Dormitorios | `contact.dormitorios` | `tia21zMjZpg6vssIeiAg` | NUMERICAL | - |
| 6 | Tipo de Propiedad 2 | `contact.tipo_de_propiedad_2` | `6MaFF03NbN1maNs2t6wp` | RADIO | Departamento, Casa, Local Comercial |
| 7 | Propiedad de Interes | `contact.propiedad_de_interes` | `JIVPrnwNHaa2xpwVF72s` | TEXT | - |
| 8 | **Propiedad Tokko ID** | `contact.propiedad_tokko_id` | `2kErmqUh8mG4DSiPLl4c` | NUMERICAL | **CRÍTICO** |
| 9 | Asesor Asignado | `contact.asesor` | `QrklwUOejneSuhN9WZEp` | TEXT | - |
| 10 | Estado Visita | `contact.estado_visita` | `wZdiUcCYudAst5wp8nxR` | SINGLE_OPTIONS | pendiente, coordinada, realizada |
| 11 | Origen Lead | `contact.origen_lead` | `JpyQySFLxOqx65JHYmEn` | TEXT | - |
| 12 | Fecha Primer Contacto | `contact.fecha_primer_contacto` | `nmjHXLuEaaidNamLXedw` | DATE | - |
| 13 | Última Propiedad Vista | `contact.ltima_propiedad_vista` | `SIxdiv7ssbhAzMAyIziu` | TEXT | - |
| 14 | Presupuesto Campana Meta | `contact.presupuesto_campana_meta` | `bT149d6z3mavz8Lfv0n2` | SINGLE_OPTIONS | De USD 200k-300k, 300k-400k, 400k-500k, +500k |
| 15 | Características Deseadas | `contact.caractersticas_deseadas` | `lgdH2EYqz6j7o1ZAUlCg` | LARGE_TEXT | - |
| 16 | titulo_propiedad | `contact.titulo_propiedad` | `M3VU50mqHUKb9alOKPvt` | TEXT | - |
| 17 | precio_propiedad | `contact.precio_propiedad` | `oMgcrl5b9LY1WOCVLiFI` | NUMERICAL | - |
| 18 | ubicacion_propiedad | `contact.ubicacion_propiedad` | `XJvbVGNyvhnghesdLIYd` | TEXT | - |

### **GRUPO 2: Formulario Captación** (Parent ID: `moZFGihE9YTNXOclSZvW`)

| # | Nombre Campo | Field Key | ID | Tipo | Opciones |
|---|--------------|-----------|----|----- |----------|
| 19 | Zona Preferida | `contact.zona_preferida` | `cUzfZetJqA33ew3iDjLG` | TEXT | - |
| 20 | Tipo de Operacion | `contact.tipo_de_operacion` | `cUIIxVLP7fTlgw2b166V` | CHECKBOX | Venta, Compra, Alquiler (Propietario), Alquiler (Inquilino) |
| 21 | Cantidad de ambientes | `contact.cantidad_de_ambientes` | `13fnsejKJx99mtM7M7f3` | CHECKBOX | Monoambiente, 2, 3, 4 ambientes |
| 22 | Presupuesto | `contact.presupuesto` | `qy5iE9iTAvyABD0AF8ge` | SINGLE_OPTIONS | Menos de 150k, 150-200k, 200-250k, 250-300k, +300k |
| 23 | Ventana de tiempo | `contact.ventana_de_tiempo` | `cVcRbPqe4ayZgCSMCtEB` | CHECKBOX | De inmediato, 3-6 meses, +6 meses |

### **GRUPO 3: Servicios/Otros** (Parents: QqjzYjggyP1M1f4JX8jY, oALAy5jNP81IV5aiYqU7, Br8BcdWSi7VwhcZeyjH6)

| # | Nombre Campo | Field Key | ID | Tipo |
|---|--------------|-----------|----|----- |
| 24 | Tipo de servicio | `contact.tipo_de_servicio` | `3aU5pqTYEljfxJNb9JAC` | TEXT |
| 25 | Comentarios | `contact.comentarios` | `9FHAPEM3dAWLV7uui6sA` | LARGE_TEXT |
| 26 | Fecha en que se dio el servicio | `contact.fecha_en_que_se_dio_el_servicio` | `MJCT5OI4gSu4CtxUCT7j` | DATE |
| 27 | Medio de Contacto | `contact.medio_de_contacto` | `OCCE2BTpRSqRAQm9L9IC` | SINGLE_OPTIONS |
| 28 | Califícanos del 1 al 5 | `contact.califcanos_del_1_al_5` | `bdmJZWHNKr1SvGogwMjW` | RADIO |
| 29 | Score Lead | `contact.score_lead` | `zLRaEQ5pm9fWvKJsnoIo` | NUMERICAL |
| 30 | Tipo de Propiedad (old) | `contact.tipo_de_propiedad` | `yvKRmy4YtEHioOUoSGzb` | CHECKBOX |

---

## 📋 PIPELINES IMPLEMENTADOS (3 pipelines)

### **PIPELINE 1: "01 - Compradores - Seguimiento IA"** 
**ID:** `tDFS4eZP5Rliei09iGIK`

| # | Stage Name | Stage ID | Position |
|---|------------|----------|----------|
| 1 | Nuevo Lead IA | `d70da62a-d8ec-48c9-956c-3b7e00773964` | 0 |
| 2 | **En seguimiento** ⭐ | `6a4a44b3-2b0c-4aad-a00d-f62276fc4e0d` | 1 |
| 3 | Agendó Videollamada | `6514ae96-fffc-4853-bb57-34571bcae626` | 2 |
| 4 | Coordinando Visita | `68c65d3d-e448-4c16-9eae-191543796c05` | 3 |
| 5 | Visita Programada | `4df5040b-acad-476f-ad91-662e7dd06a00` | 4 |
| 6 | No contestó a seguimiento 1 mes | `8a141a3e-04a5-4159-9a50-d219774a21ed` | 5 |
| 7 | No se presentó | `af843526-4445-49ee-a603-32473af8ec4b` | 6 |
| 8 | Detener IA | `e5864d25-64ab-439d-9964-4d9de81457e9` | 7 |
| 9 | Reactivar IA | `477fb67b-b45d-4236-bef5-c17ea3784452` | 8 |
| 10 | Oferta/Contraoferta | `2bfb22cf-0bb6-445c-9df2-a4ad5d7d1ab5` | 9 |
| 11 | Nutrición | `12cd3dc6-d589-4427-a1c3-5821754191b7` | 10 |
| 12 | Perdido/Abandonado | `568c3c55-ae95-4c7d-9481-7c4df1e12cd3` | 11 |
| 13 | Ganado | `89e6f650-27c8-4857-9cd6-cb7ba46307dd` | 12 |

**⚠️ STAGE CRÍTICO PARA STALE OPPORTUNITY:**
- **"En seguimiento"** (ID: `6a4a44b3-2b0c-4aad-a00d-f62276fc4e0d`)
- Este es el stage donde los leads quedan "estancados" sin actividad

### **PIPELINE 2: "Campaña Reactivación Base de datos"**
**ID:** `U6uUIN1vzFsJwY3CvmF4`

| # | Stage Name | Stage ID | Position |
|---|------------|----------|----------|
| 1 | Mensaje enviado | `6d9e996c-8daa-44c8-95ed-2156110f555b` | 0 |
| 2 | Whatsapp inválido | `9c44333b-8ffb-48c7-b24f-350aac3d78fb` | 1 |
| 3 | Respuesta Recibida | `c069695f-fbc5-4978-a778-fdf6b4add8a6` | 2 |
| 4 | Seguimiento | `b68c7514-8b80-480f-b8f5-8738ab95f55f` | 3 |
| 5 | Votaron entre 1-3 | `6b2a300a-d15d-46e8-9869-86db8e0c1b4c` | 4 |
| 6 | Votaron 4-5 | `bfc4a1e8-8342-4466-b004-e91c785aa5b0` | 5 |

### **PIPELINE 3: "Captaciones"**
**ID:** `lv0Gmd8AxOe7Wi758SII`

| # | Stage Name | Stage ID | Position |
|---|------------|----------|----------|
| 1 | Nuevo Lead | `c4e98afc-6231-469a-ace1-5b2da91990c5` | 0 |
| 2 | Calificado (propiedad verificada) | `b23ff415-6d33-4849-b8cd-fd388815e535` | 1 |
| 3 | Valuación enviada | `69009d12-ab5b-4200-9afc-c6b689ab6ce3` | 2 |
| 4 | Listado firmado | `d79756fd-1726-4fe2-972d-8c210b2f2397` | 3 |
| 5 | En mercado | `b0f9f04d-cb0f-4f3c-8c84-6083c2f4b8c2` | 4 |
| 6 | Ofertas recibidas | `f58baab7-d62b-41fb-b862-684ad8f15651` | 5 |
| 7 | Vendido | `acd1cba7-327b-44de-a327-614affebea4b` | 6 |
| 8 | Perdido (con motivo) | `004670c9-b471-44b0-88d4-c3aac0e803c0` | 7 |

---

## 🏷️ TAGS IMPLEMENTADOS (110+ tags)

### **CATEGORÍA 1: CONTROL DE IA/BOT** (12 tags)
| Tag Name | Tag ID | Uso |
|----------|--------|-----|
| ia activa | `aVD3q1Ub2G2r5canpsiX` | IA del sistema activa |
| ia n8n activa | `cI9iXjGclu2Tui3yHl0a` | IA de n8n activa |
| detener ia | `GxSwNeDfHCo3LIVQ0f7C` | Detiene IA |
| detener_ia | `R9w6ZQUlQ8RYhtByBzpz` | Detiene IA (alt) |
| stop bot | `e4leD0HHY7wQ77DuPVxO` | Para bot general |
| stop_bot_ig | `vkerRxYUIuFGtXkWnUIQ` | Para bot Instagram |
| asistencia humana | `IdKjFPgZYmalZjM645e2` | Requiere humano |
| asistencia_humana | `8KL8Xoqb9dYOtbVzJaWU` | Requiere humano (alt) |
| human handover | `vhd7dyZJGssVWeQJIlGt` | Transferir a humano |
| ia_propiedades | `Z7q49RjIrI3tHINtbSMh` | IA búsqueda props |
| [device] - ia | `DF2tRi6Hg1KFq8KFNh5U` | Device IA |
| [device] - default | `uWpm76riN97pxOdC3x3b` | Device default |

### **CATEGORÍA 2: AGENTES ASIGNADOS** (7 tags)
| Tag Name | Tag ID | Uso |
|----------|--------|-----|
| agente: david juejati | `Js8IwrQjV3CivOsco9Dz` | Agente David |
| agente: ignacio j | `FtYy9GkQq1RwptVPFotG` | Agente Ignacio |
| agente: ignacio j. | `CkjG3YYRFi9Dz02qmyXn` | Agente Ignacio (alt) |
| agente: jonathan sardar | `33Ofs3xHwfO85EQb7Jop` | Agente Jonathan |
| agente: julieta levy | `jsU8soHvT6Vl6njIAPes` | Agente Julieta |
| agente: sara juejati | `quJoaajV4LO1w4RnrQD5` | Agente Sara |
| agente: sin agente | `K1tj3jVpuSiFCDa1E85b` | Sin agente asignado |

### **CATEGORÍA 3: ORIGEN DEL LEAD** (15 tags)
| Tag Name | Tag ID | Uso |
|----------|--------|-----|
| [whatsapp] - fb ads | `KR8LzyY8CH6Ak0WLHPji` | Origen: FB Ads WA |
| [whatsapp] - lead capture | `sEmN5stT7kP4PadgdPGe` | Origen: Lead Capture WA |
| ingreso por ia | `gX89S0Ymc1aVNwIWSMnC` | Ingresó por IA |
| ingreso por zonaprop | `kvXgHdz94glfkM7jkb5i` | Origen: ZonaProp |
| ingreso sofia | `jY5mazAbMIuT7XbVYvWh` | Origen: Sofia |
| ingreso_formulario | `cGxeVRaUBSp0jXcu6row` | Origen: Formulario |
| lead nuevo fb | `Pla8QZbhKi18uP5xiNck` | Nuevo lead FB |
| lead nuevo ig | `4PPRBhm0acwqWEf6k1Br` | Nuevo lead IG |
| juejati.com.ar | `RbAi3qDG1StbQXdl0ENc` | Origen: Web Juejati |
| red tokko broker | `05ko31el5UTj984D7SVJ` | Origen: Red Tokko |
| ig_bot_ficha | `yaYqZP8ZNZqntmMbdwwV` | Bot IG ficha prop |
| tag facebook | `AZAsKsih4L8qlvMT3HXD` | Origen: Facebook |
| web | `xjU8Jw3VhXQVL1HG7GCz` | Origen: Web |
| whatsapp | `5UJoi2a6DxOVF2f2N6hj` | Origen: WhatsApp |
| tokko | `CpGiVF0a8nHFCNtAfqRP` | Origen: Tokko |

### **CATEGORÍA 4: ESTADO DE VISITAS/CITAS** (9 tags)
| Tag Name | Tag ID | Uso |
|----------|--------|-----|
| agendo | `QspjvCrQYngJyVSWW57o` | Agendó cita |
| agendo - sin whatsapp | `cNka6YT2DyIJDRTAsBZI` | Agendó sin WA |
| agendó reunión | `CZVDdDhylt6XvLd2gHv5` | Reunión agendada |
| no agendó | `zoQffRlkzrh5SON5OYt0` | No agendó |
| cita cancelada | `T1xo7RjP4TfkYO2i6sir` | Cita cancelada |
| no show | `6fplCZs0o1VhwvCCGnTN` | No se presentó |
| visita_en_coordinacion | `aaVHL3BC4vXOO7QRDJSH` | Coordinando visita |
| visita_programada | `1NTvHG2lb7fr0wSq81C9` | Visita programada |
| quiere visitar | `FtpAiZdShudIfr6EMeoX` | Quiere visitar |

### **CATEGORÍA 5: ESTADO DE RESPUESTA/ENGAGEMENT** (10 tags)
| Tag Name | Tag ID | Uso |
|----------|--------|-----|
| no dio respuesta | `v6GAQLm1HqPnHb6o6MmJ` | Sin respuesta |
| no hubo respuesta | `7jDa56WB1NRnmOe8KQSa` | Sin respuesta (alt) |
| oportunidad estancada 7 dias | `h77DAbGrkv1BS4ieCUD2` | **⭐ STALE OPP** |
| respondió a campana reactivacion bd | `O5O65Ra3frmsMhNJpMpF` | Respondió reactivación |
| campana de reactivación | `DNP29u7EdNWLxHg0FcGy` | En campaña reactivación |
| en nutricion | `GniL6BLNrjctf4zgXnbw` | En nutrición |
| seguimiento manual | `LOZIEvltoNVY9j47M39F` | Requiere seguimiento manual |
| quiere que lo llamen | `4kT6JV3iKouDB8LeZ1th` | Solicita llamada |
| contacto por whatsapp | `dmqMCTFBsiikIgXexlZB` | Contactado por WA |
| like_prop | `3mGFOjgwdYP2zMYoiW7H` | Le gustó propiedad |

### **CATEGORÍA 6: BÚSQUEDA/PROPIEDADES** (23 tags)
| Tag Name | Tag ID | Uso |
|----------|--------|-----|
| busqueda tokko | `WSF3lp2CWeD8DVuJ3osU` | Búsqueda en Tokko |
| busqueda zp | `BlUTporkwZU08Lecg3kP` | Búsqueda ZonaProp |
| departamento | `CM6vmB6v4H2wOWy3Ea3Q` | Tipo: Departamento |
| local comercial | `kQaVnT8Og2oD7bLY008D` | Tipo: Local |
| local | `F1GlzRpHnfaEl4U5Iv7H` | Tipo: Local (alt) |
| terreno | `7mr0DPxrZ1ib5eao7bso` | Tipo: Terreno |
| torre | `11n9AgviTJj8gGZ82t31` | Tipo: Torre |
| **Zonas:** | | |
| botanico | `dsflDrjA8DKfkcpcEU28` | Zona: Botánico |
| recoleta | `blxxazskRXers3Qvf9lX` | Zona: Recoleta |
| retiro | `41oM9xhvtncLh7rhFNnE` | Zona: Retiro |
| tribunales | `XIc0yHsRPuK4iriTZFx7` | Zona: Tribunales |
| villa crespo | `WwAE4eEowOU168CrKpM5` | Zona: Villa Crespo |
| 4 ambientes palermo | `lOf58N1h2cxsGuiPXkXB` | 4 amb Palermo |
| **Rangos de presupuesto:** | | |
| rango 200 a 300k | `iD5UTtz6SiCCYn9CGyAR` | USD 200-300k |
| rango 300 a 400k | `OZGsqpNhKcVTkdJ3YNPf` | USD 300-400k |
| rango 400 a 500k | `1VWRYgufxhFWpQD7NPRu` | USD 400-500k |
| +500k | `V626DiTWeTkp9gKq0CXA` | Más de USD 500k |
| **Características:** | | |
| 2 cocheras | `1JIgRlDrUYuRIvDIGf7V` | 2 cocheras |
| 100 m2 | `Q5tTEZhOs7hp5pGCZTr5` | 100 m² |
| 130 metros | `NyLwZJVKO9S7tsFDfV1O` | 130 m² |
| 150 metros | `Rff9YE7BEeqazzuqV0nS` | 150 m² |
| 200 m2 | `h96JsuidKEwdN9eIcXsF` | 200 m² |
| 10 años antiguedad | `8DKsCycL0TfFuIG3cwo9` | Antigüedad 10 años |

### **CATEGORÍA 7: FEEDBACK/REVIEWS** (5 tags)
| Tag Name | Tag ID | Uso |
|----------|--------|-----|
| google_review | `QBEsHZrxZIPQAFLstsp2` | Review en Google |
| dejó reseña en google | `Ywghjxu78c1lBcaxawMe` | Dejó review |
| dio clic trigger link google review | `swX1EkJdWEHUvAyzDrP0` | Clic link review |
| link directo google | `ie7BIhkvF9Ba9P2rVxK8` | Link directo Google |
| voto 1-3 | `gxKNPaGM2kB6PY1rj9RB` | Votó bajo (1-3) |
| votó 4-5 | `NB4HZozMgwc0qBd5zDt6` | Votó alto (4-5) |

### **CATEGORÍA 8: WHATSAPP TÉCNICOS** (3 tags)
| Tag Name | Tag ID | Uso |
|----------|--------|-----|
| [whatsapp] - contact is not registered | `slsgDt9ojsvpBL1JvW9L` | No registrado en WA |
| [whatsapp] - phone device disconnected | `3EdVnSw69J0TH0Hm6OwG` | Device WA desconectado |
| vio telefono | `FKUJgYUqfbQkffZ8Tm8O` | Vio número telefónico |

### **CATEGORÍA 9: OTROS/VARIOS** (10 tags)
| Tag Name | Tag ID | Uso |
|----------|--------|-----|
| lead | `uJZAm2bBG2QECXXpGxtv` | Lead genérico |
| lead nuevo | `Xer3TSjdTGo7nxy5j5Wn` | Lead nuevo |
| nuevo ia | `D2LPSPxg1JtTueiLq2Tj` | Nuevo IA |
| consulta | `weQQQdkMGBttLFrh4nIR` | Consulta |
| contacto | `ubcATYe9iZtU6LMa24pH` | Contacto |
| depósito | `18QRiKssD1JcLO1eRR7N` | Depósito |
| seguridad | `VAoYzh7AAb5Zw3TI3jFS` | Seguridad |
| vista | `z5fPtcUiQsvZCImWjh1G` | Vista |
| asistente | `mxUh7cs4YitOM6vdPsP2` | Asistente |
| autoclonia | `3yXKLw4Mb1ZtJPkw7W82` | Autoclonia |

### **CATEGORÍA 10: TESTING/DEBUG** (4 tags)
| Tag Name | Tag ID | Uso |
|----------|--------|-----|
| n8n prueba | `HSMrynMsLL4ViiGVCHNq` | Prueba n8n |
| test a | `fot9zQg7bNqKOcoGf12d` | Test A |
| test b | `7cLCTcwxWuaXzHG2ccQK` | Test B |
| bot nico | `Gx8hbpc6l4e0wAkHylSe` | Bot Nico (test) |
| juan ia | `kixlt07RJna7D8T6CT3y` | Juan IA (test) |

---

## 🔴 PENDIENTE DE MAPEO:

1. ✅ **TAGS** del sistema - **COMPLETADO** (110+ tags mapeados)
2. ❌ **WORKFLOWS** activos
3. ❌ **CUSTOM OBJECTS** (si existen propiedades)

---

## 📝 NOTAS IMPORTANTES:

1. **Custom Field crítico identificado:**
   - `Propiedad Tokko ID` (2kErmqUh8mG4DSiPLl4c) - NUMERICAL
   - Este campo es clave para asociar propiedades con oportunidades

2. **Pipeline principal para automatización:**
   - "01 - Compradores - Seguimiento IA" (tDFS4eZP5Rliei09iGIK)
   - Stage crítico: "En seguimiento" (position 1)

3. **⭐ TAG CRÍTICO PARA STALE OPPORTUNITIES:**
   - **"oportunidad estancada 7 dias"** (ID: `h77DAbGrkv1BS4ieCUD2`)
   - Este tag ya existe y puede ser reutilizado para la función Stale Opportunities
   - Indica que un lead lleva 7+ días sin actividad

4. **Tags de control de IA identificados:**
   - `ia activa` - IA del sistema activa
   - `detener ia` / `detener_ia` - Para pausar IA
   - `asistencia humana` / `human handover` - Transferir a humano
   - Estos tags pueden ser usados en workflows de seguimiento automatizado

5. **Tags de origen críticos para atribución:**
   - Sistema tiene 15+ tags de origen (FB Ads, IG, ZonaProp, Web, etc.)
   - Permite rastrear fuente exacta de cada lead
   - Útil para reportes y optimización de campañas

6. **Campos duplicados detectados:**
   - `Ambientes` (TEXT) vs `Cantidad de ambientes` (CHECKBOX)
   - `Presupuesto_ia` (NUMERICAL) vs `Presupuesto` (SINGLE_OPTIONS) vs `Presupuesto Campana Meta` (SINGLE_OPTIONS)
   - `Tipo de Propiedad 2` (RADIO) vs `Tipo de Propiedad` (CHECKBOX)

7. **Estructura de grupos:**
   - Parent ID `uB2Mmf4IM7grP0nIQnf0` = Campos de "Búsqueda IA" (18 campos)
   - Parent ID `moZFGihE9YTNXOclSZvW` = Campos de "Formulario Captación" (5 campos)
