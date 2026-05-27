import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY no configurada' }, { status: 503 })
  }

  const body = await req.json()
  const { titulo, barrio, tipo, operacion, precio, moneda, ambientes, dormitorios, superficie } = body
  if (!titulo) return NextResponse.json({ error: 'titulo requerido' }, { status: 400 })

  const detalles = [
    barrio && `Barrio: ${barrio}`,
    tipo && `Tipo: ${tipo}`,
    operacion && `Operación: ${operacion}`,
    precio && `Precio: ${moneda || 'USD'} ${Number(precio).toLocaleString('es-AR')}`,
    ambientes && `Ambientes: ${ambientes}`,
    dormitorios && `Dormitorios: ${dormitorios}`,
    superficie && `Superficie: ${superficie} m²`,
  ].filter(Boolean).join('\n')

  const prompt = `Sos un experto en marketing inmobiliario argentino.
Escribí un post para Instagram/Facebook para esta propiedad:

Título: ${titulo}
${detalles}

Reglas:
- Español argentino (vos, no usted)
- Máximo 150 palabras
- Atractivo, llamada a la acción al final
- 3-5 hashtags relevantes al final
- Sin emojis excesivos (máximo 3-4)
- No inventes datos que no están en la info`

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    })
    if (!openaiRes.ok) {
      const err = await openaiRes.text()
      console.error('[OpenAI]', openaiRes.status, err)
      throw new Error('OpenAI error')
    }
    const data = await openaiRes.json()
    const copy = data.choices?.[0]?.message?.content?.trim() || ''
    return NextResponse.json({ copy })
  } catch (err: any) {
    console.error('[POST /api/social/generate-copy]', err)
    return NextResponse.json({ error: 'No se pudo generar el copy' }, { status: 500 })
  }
}
