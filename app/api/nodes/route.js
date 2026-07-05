import { prisma } from '@/lib/prisma'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const where = {}
    if (category && category !== 'all') where.category = category
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { content: { contains: search } },
      ]
    }
    const nodes = await prisma.node.findMany({
      where,
      include: {
        tags: { include: { tag: true } },
        connectionsFrom: { include: { toNode: true } },
        files: true,
      },
      orderBy: [{ importance: 'desc' }, { updatedAt: 'desc' }],
    })
    return Response.json({ nodes })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { title, description, category, content, tags = [], importance, source, reliability } = await req.json()
    if (!title?.trim()) return Response.json({ error: 'Title kerak' }, { status: 400 })
    const tagRecords = await Promise.all(
      tags.filter(Boolean).map(name =>
        prisma.tag.upsert({
          where: { name: name.trim().toLowerCase() },
          update: {},
          create: { name: name.trim().toLowerCase() },
        })
      )
    )
    const node = await prisma.node.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        category: category || 'ideas',
        content: content?.trim(),
        importance: importance || 5,
        source: source || 'manual',
        reliability: reliability || 'verified',
        tags: { create: tagRecords.map(t => ({ tagId: t.id })) },
      },
      include: { tags: { include: { tag: true } } },
    })
    await prisma.nodeVersion.create({
      data: {
        nodeId: node.id, version: 1,
        title: node.title, description: node.description,
        content: node.content, importance: node.importance,
        reliability: node.reliability, changedBy: 'user',
      }
    })
    await prisma.brainEvent.create({
      data: { type: 'node_created', nodeId: node.id, meta: JSON.stringify({ title: node.title, category: node.category }) }
    })
    return Response.json({ node }, { status: 201 })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    await prisma.node.delete({ where: { id } })
    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}