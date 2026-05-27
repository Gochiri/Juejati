# Juejati CRM

CRM web para agentes inmobiliarios de Juejati Brokers.

**Backend:** GoHighLevel (contactos, conversaciones, calendario, social planner) + Supabase (propiedades sincronizadas desde Tokko Broker).
**Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui.

## Módulos

| Ruta | Función |
|------|---------|
| `/login` | Login por agente (email + password, NextAuth credentials) |
| `/` | Inbox: leads + chat (WhatsApp/SMS) + ficha completa del contacto |
| `/propiedades` | Grid de propiedades Tokko con filtros |
| `/agenda` | Calendario mensual de visitas (GHL Appointments) |
| `/social` | Social Planner con copy generado por IA (OpenAI) |

## Variables de entorno

Copiar `.env.local.example` a `.env.local` y completar:

```env
NEXTAUTH_URL=http://localhost:3000           # o https://crm.korvance.com en prod
NEXTAUTH_SECRET=<random 32+ chars>           # openssl rand -base64 32
DATABASE_URL=postgresql://...                # mismo que juejati-ai-backend
GHL_API_KEY=...                              # mismo que juejati-ai-backend
GHL_LOCATION_ID=WWrBqekGJCsCmSSvPzEf
OPENAI_API_KEY=sk-...                        # para generar copy de posts
NEXT_PUBLIC_GHL_LOCATION_ID=WWrBqekGJCsCmSSvPzEf
```

## Setup inicial

1. **Tabla de usuarios:** correr `scripts/schema.sql` en Supabase.
2. **Crear primer admin:**
   ```
   npm install
   npx tsx scripts/create-user.ts email@example.com password "Nombre Apellido"
   ```
3. **Desarrollo local:**
   ```
   npm run dev
   ```
   Abrir http://localhost:3000

## Deploy (Docker Swarm en korvance.com)

El workflow `.github/workflows/docker-crm.yml` builda automáticamente la imagen `ghcr.io/gochiri/juejati-crm:latest` al pushear cambios a `main`.

En el server:
```bash
# Asegurarse de tener .env con las variables
docker stack deploy -c docker-compose.yml juejati-crm

# O para actualizar después de un nuevo build
docker service update --image ghcr.io/gochiri/juejati-crm:latest juejati-crm_juejati-crm
```

Traefik enruta `crm.korvance.com` → contenedor (puerto 3000) con TLS automático.

## Notas

- El backend `juejati-ai-backend` (Express + Sofía AI) sigue corriendo independiente — maneja webhooks GHL, sync Tokko cada 6h y la conversación automatizada de Sofía.
- El toggle "Sofía ON/OFF" en la ficha del contacto agrega/quita el tag `sofia_activa`. El workflow de GHL debe condicionar a Sofía a ese tag para que el agente pueda pausar la IA.
- Las propiedades vienen de `propiedades_v2` de Supabase, sincronizada automáticamente desde Tokko Broker por el backend Express.
