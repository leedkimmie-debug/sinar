import { prisma } from '@/lib/prisma'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req) {
  try {
    const { message, conversationId } = await req.json()
    const words = message.toLowerCase().split(' ').filter(w => w.length > 1)
    const relevantNodes = await prisma.node.findMany({
      where: {
        OR: [
          ...words.map(w => ({ title: { contains: w } })),
          ...words.map(w => ({ description: { contains: w } })),
          ...words.map(w => ({ content: { contains: w } })),
        ]
      },
      include: { tags: { include: { tag: true } } },
      orderBy: [{ importance: 'desc' }, { lastUsedAt: 'desc' }],
      take: 10,
    })
    const allNodes = await prisma.node.findMany({
      orderBy: [{ importance: 'desc' }],
      take: 30,
    })
    let convo
    if (conversationId) {
      convo = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 10 } }
      })
    }
    if (!convo) {
      convo = await prisma.conversation.create({
        data: { title: message.slice(0, 50) },
        include: { messages: true }
      })
    }
    const brainContext = relevantNodes.length > 0
      ? `\nBRAIN EVIDENCE (${relevantNodes.length} node):\n` +
        relevantNodes.map(n =>
          `[${n.category.toUpperCase()} | ${n.reliability} | ${n.importance}/10]\n` +
          `Sarlavha: ${n.title}\n` +
          (n.description ? `Tavsif: ${n.description}\n` : '') +
          (n.content ? `Kontent: ${n.content}\n` : '')
        ).join('\n---\n')
      : '\nBRAIN: Bu mavzuda hali malumot yoq.'
    const allContext = `\nBARCHA BILIMLAR:\n` +
      allNodes.map(n => `• [${n.category}] ${n.title}`).join('\n')
    const systemPrompt = `Sen SINAR — Ulmasjonning Raqamli Miyasisin.
QOIDALAR:
- Brain First — hech qachon Brainni chetlab otma
- Truth Above All — faktni xulosadan ajrat
- Never Ask Twice — bir marta aytilgan eslab qoladi
- O'zbek tilida javob ber
- 🟢 FAKT: Brain da yozilgan
- 🟡 XULOSA: Mening taxminim
FOYDALANUVCHI: Ulmasjon | Arxitektura talabasi | Toshkent
${brainContext}
${allContext}`
    const history = convo.messages.map(m => ({ role: m.role, content: m.content }))
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })
    const aiResponse = completion.choices[0].message.content
    const cleanResponse = aiResponse.replace(/\[XOTIRA:.*?\]/gs, '').trim()
    await prisma.message.createMany({
      data: [
        { conversationId: convo.id, role: 'user', content: message },
        { conversationId: convo.id, role: 'assistant', content: cleanResponse, nodesUsed: relevantNodes.map(n => n.id).join(',') },
      ]
    })
    await prisma.brainEvent.create({
      data: { type: 'ai_searched', meta: JSON.stringify({ query: message, nodesFound: relevantNodes.length }) }
    })
    if (relevantNodes.length > 0) {
      await prisma.node.updateMany({
        where: { id: { in: relevantNodes.map(n => n.id) } },
        data: { lastUsedAt: new Date() }
      })
    }
    return Response.json({
      response: cleanResponse,
      conversationId: convo.id,
      evidence: {
        nodesUsed: relevantNodes.map(n => ({ id: n.id, title: n.title, category: n.category, reliability: n.reliability })),
        totalNodes: allNodes.length,
      },
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}