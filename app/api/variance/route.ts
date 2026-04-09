import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { season_id, farm_id, month, year, budget_lines, actuals } = await req.json()
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ explanation_fr: 'Clé API non configurée.' }, { status: 500 })

  const prompt = `Tu es un expert-comptable agricole. Analyse les écarts budgétaires suivants pour un domaine maraîcher au Maroc (mois: ${month}/${year}).

Budget prévu (MAD):
${JSON.stringify(budget_lines, null, 2)}

Réalisé (MAD):
${JSON.stringify(actuals, null, 2)}

En 3-4 phrases concises en français, explique :
1. Les principaux postes qui ont divergé du budget
2. Les causes probables de ces écarts
3. Les points de vigilance pour le mois suivant

Réponse directe, sans introduction ni conclusion.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const explanation_fr = data.content?.[0]?.text ?? 'Analyse non disponible.'
    return NextResponse.json({ explanation_fr })
  } catch (err) {
    return NextResponse.json({ explanation_fr: 'Erreur lors de la génération de l\'analyse.' }, { status: 500 })
  }
}
