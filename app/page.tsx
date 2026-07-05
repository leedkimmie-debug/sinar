'use client'
import { useState, useEffect, useRef } from 'react'

const CATEGORIES = [
  { id: 'all', label: 'Barchasi', icon: '◉', color: '#a78bfa' },
  { id: 'architecture', label: 'Arxitektura', icon: '🏛️', color: '#818cf8' },
  { id: 'programming', label: 'Dasturlash', icon: '⌨', color: '#06b6d4' },
  { id: 'islam', label: 'Islom', icon: '☪️', color: '#34d399' },
  { id: 'projects', label: 'Loyihalar', icon: '📁', color: '#f59e0b' },
  { id: 'ideas', label: "G'oyalar", icon: '💡', color: '#f472b6' },
  { id: 'personal', label: 'Shaxsiy', icon: '👤', color: '#fb923c' },
  { id: 'tasks', label: 'Vazifalar', icon: '✅', color: '#a3e635' },
  { id: 'files', label: 'Fayllar', icon: '📄', color: '#94a3b8' },
]

const RELIABILITY = {
  verified: { label: '🟢 Tasdiqlangan', color: '#22c55e' },
  observed: { label: '🔵 Kuzatilgan', color: '#3b82f6' },
  inferred: { label: '🟡 Xulosa', color: '#eab308' },
  hypothesis: { label: '🔴 Taxmin', color: '#ef4444' },
}

export default function SinarPage() {
  const [tab, setTab] = useState('brain')
  const [nodes, setNodes] = useState([])
  const [catFilter, setCatFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [newNode, setNewNode] = useState({ title: '', description: '', category: 'ideas', content: '', tags: '', importance: 5, reliability: 'verified' })
  const [messages, setMessages] = useState([{ role: 'assistant', content: "Assalomu alaykum, Ulmasjon.\n\nMen SINAR — sizning raqamli miyangizman.\nBrain hozir bo'sh. Menga birinchi bilimingizni bering.", time: '' }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const [saving, setSaving] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => { fetchNodes() }, [catFilter])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const fetchNodes = async () => {
    const res = await fetch(`/api/nodes?category=${catFilter}`)
    const data = await res.json()
    setNodes(data.nodes || [])
  }

  const addNode = async () => {
    if (!newNode.title.trim()) return
    setSaving(true)
    const tags = newNode.tags.split(',').map(t => t.trim()).filter(Boolean)
    await fetch('/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newNode, tags })
    })
    setShowAdd(false)
    setNewNode({ title: '', description: '', category: 'ideas', content: '', tags: '', importance: 5, reliability: 'verified' })
    setSaving(false)
    fetchNodes()
  }

  const deleteNode = async (id) => {
    await fetch(`/api/nodes?id=${id}`, { method: 'DELETE' })
    fetchNodes()
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const msg = input.trim()
    setInput('')
    setLoading(true)
    const time = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => [...prev, { role: 'user', content: msg, time }])
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, conversationId })
      })
      const data = await res.json()
      const t = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || data.error, time: t, evidence: data.evidence }])
      if (data.conversationId) setConversationId(data.conversationId)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Xatolik. Qayta urinib koring.', time: '' }])
    }
    setLoading(false)
  }

  const catColor = (cat) => CATEGORIES.find(c => c.id === cat)?.color || '#a78bfa'
  const catIcon = (cat) => CATEGORIES.find(c => c.id === cat)?.icon || '◉'

  return (
    <div style={{ minHeight: '100vh', background: '#030308', color: '#c4b5d4', fontFamily: 'monospace', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: #2a1f3d; }
        @keyframes slideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        textarea, input, select { font-family: monospace; }
      `}</style>

      {/* HEADER */}
      <div style={{ borderBottom: '1px solid #1a1225', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 20, background: '#08060f', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 4 }}>SINAR</div>
          <div style={{ fontSize: 8, color: '#3a2f4a', letterSpacing: 3 }}>THE LIVING DIGITAL MIND</div>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 4 }}>
          {[{ id: 'brain', label: '◈ BRAIN' }, { id: 'chat', label: '◉ CHAT' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '6px 20px', borderRadius: 6, border: `1px solid ${tab === t.id ? '#a78bfa44' : '#1a1225'}`, background: tab === t.id ? '#1a0f2e' : 'transparent', color: tab === t.id ? '#a78bfa' : '#3a2f4a', fontSize: 11, cursor: 'pointer', letterSpacing: 2 }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: '#a78bfa' }}>{nodes.length} nodes</span>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 8px #a78bfa', animation: 'pulse 2s infinite' }} />
        </div>
      </div>

      {/* BRAIN TAB */}
      {tab === 'brain' && (
        <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCatFilter(c.id)} style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${catFilter === c.id ? c.color + '60' : '#1a1225'}`, background: catFilter === c.id ? c.color + '12' : 'transparent', color: catFilter === c.id ? c.color : '#3a2f4a', fontSize: 10, cursor: 'pointer', letterSpacing: 1 }}>
                {c.icon} {c.label}
              </button>
            ))}
            <button onClick={() => setShowAdd(true)} style={{ marginLeft: 'auto', padding: '6px 16px', background: 'linear-gradient(135deg, #7c3aed, #4f1d96)', border: 'none', borderRadius: 6, color: '#e2d9f3', fontSize: 11, cursor: 'pointer' }}>+ NODE</button>
          </div>

          {showAdd && (
            <div style={{ background: '#08060f', border: '1px solid #a78bfa30', borderRadius: 10, padding: 16, marginBottom: 16, animation: 'slideIn 0.3s ease' }}>
              <div style={{ fontSize: 10, color: '#a78bfa', letterSpacing: 2, marginBottom: 12 }}>✦ YANGI NODE</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <input value={newNode.title} onChange={e => setNewNode(p => ({ ...p, title: e.target.value }))} placeholder="Sarlavha *" style={{ padding: '8px 12px', background: '#0d0a14', border: '1px solid #1a1225', borderRadius: 6, color: '#c4b5d4', fontSize: 13 }} />
                <select value={newNode.category} onChange={e => setNewNode(p => ({ ...p, category: e.target.value }))} style={{ padding: '8px 12px', background: '#0d0a14', border: '1px solid #1a1225', borderRadius: 6, color: '#c4b5d4', fontSize: 13 }}>
                  {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id} style={{ background: '#0d0a14' }}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <textarea value={newNode.description} onChange={e => setNewNode(p => ({ ...p, description: e.target.value }))} placeholder="Tavsif" rows={2} style={{ width: '100%', padding: '8px 12px', background: '#0d0a14', border: '1px solid #1a1225', borderRadius: 6, color: '#c4b5d4', fontSize: 13, resize: 'none', marginBottom: 10 }} />
              <textarea value={newNode.content} onChange={e => setNewNode(p => ({ ...p, content: e.target.value }))} placeholder="Kontent (ixtiyoriy)" rows={2} style={{ width: '100%', padding: '8px 12px', background: '#0d0a14', border: '1px solid #1a1225', borderRadius: 6, color: '#c4b5d4', fontSize: 13, resize: 'none', marginBottom: 10 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                <input value={newNode.tags} onChange={e => setNewNode(p => ({ ...p, tags: e.target.value }))} placeholder="teglar (vergul)" style={{ padding: '8px 12px', background: '#0d0a14', border: '1px solid #1a1225', borderRadius: 6, color: '#c4b5d4', fontSize: 12 }} />
                <select value={newNode.reliability} onChange={e => setNewNode(p => ({ ...p, reliability: e.target.value }))} style={{ padding: '8px 12px', background: '#0d0a14', border: '1px solid #1a1225', borderRadius: 6, color: '#c4b5d4', fontSize: 12 }}>
                  {Object.entries(RELIABILITY).map(([k, v]) => <option key={k} value={k} style={{ background: '#0d0a14' }}>{v.label}</option>)}
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: '#3a2f4a' }}>Muhimlik: {newNode.importance}</span>
                  <input type="range" min={1} max={10} value={newNode.importance} onChange={e => setNewNode(p => ({ ...p, importance: +e.target.value }))} style={{ flex: 1 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowAdd(false)} style={{ padding: '7px 16px', background: 'transparent', border: '1px solid #1a1225', borderRadius: 6, color: '#3a2f4a', fontSize: 12, cursor: 'pointer' }}>Bekor</button>
                <button onClick={addNode} disabled={saving} style={{ padding: '7px 20px', background: 'linear-gradient(135deg, #7c3aed, #4f1d96)', border: 'none', borderRadius: 6, color: '#e2d9f3', fontSize: 12, cursor: 'pointer' }}>{saving ? '...' : 'SAQLASH'}</button>
              </div>
            </div>
          )}

          {nodes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#1a1225' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🧠</div>
              <div style={{ fontSize: 12, letterSpacing: 2 }}>BRAIN BO'SH</div>
              <div style={{ fontSize: 11, marginTop: 8, color: '#2a1f3d' }}>Birinchi node ni yarating</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {nodes.map(node => (
                <div key={node.id} style={{ background: '#08060f', border: `1px solid ${catColor(node.category)}20`, borderLeft: `3px solid ${catColor(node.category)}`, borderRadius: 8, padding: 14, animation: 'slideIn 0.3s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>{catIcon(node.category)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: '#e2d9f3' }}>{node.title}</div>
                      <div style={{ fontSize: 9, color: catColor(node.category), letterSpacing: 1 }}>{node.category.toUpperCase()}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, color: '#a78bfa' }}>{node.importance}/10</span>
                      <button onClick={() => deleteNode(node.id)} style={{ background: 'none', border: 'none', color: '#2a1f3d', cursor: 'pointer', fontSize: 16 }} onMouseEnter={e => e.currentTarget.style.color='#ef4444'} onMouseLeave={e => e.currentTarget.style.color='#2a1f3d'}>×</button>
                    </div>
                  </div>
                  {node.description && <p style={{ fontSize: 12, color: '#7a6f8a', lineHeight: 1.6, marginBottom: 8 }}>{node.description}</p>}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, color: RELIABILITY[node.reliability]?.color }}>{RELIABILITY[node.reliability]?.label}</span>
                    {node.tags?.map(t => <span key={t.tagId} style={{ fontSize: 9, color: '#3a2f4a', background: '#1a1225', padding: '1px 6px', borderRadius: 3 }}>#{t.tag.name}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CHAT TAB */}
      {tab === 'chat' && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'slideIn 0.3s ease' }}>
                <div style={{ maxWidth: '72%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.role === 'user' ? '#1a0f2e' : '#08060f', border: `1px solid ${msg.role === 'user' ? '#7c3aed30' : '#1a1225'}` }}>
                  {msg.role === 'assistant' && <div style={{ fontSize: 9, color: '#a78bfa', letterSpacing: 2, marginBottom: 6 }}>◈ SINAR {msg.time && `· ${msg.time}`}</div>}
                  <div style={{ fontSize: 14, lineHeight: 1.8, color: msg.role === 'user' ? '#e2d9f3' : '#c4b5d4', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  {msg.evidence?.nodesUsed?.length > 0 && (
                    <div style={{ marginTop: 8, padding: '6px 10px', background: '#06b6d410', border: '1px solid #06b6d420', borderRadius: 6 }}>
                      <div style={{ fontSize: 9, color: '#06b6d4', marginBottom: 4 }}>EVIDENCE — {msg.evidence.nodesUsed.length} node ishlatildi</div>
                      {msg.evidence.nodesUsed.map(n => <div key={n.id} style={{ fontSize: 10, color: '#7a6f8a' }}>◈ {n.title}</div>)}
                    </div>
                  )}
                  {msg.role === 'user' && <div style={{ fontSize: 9, color: '#3a2f4a', marginTop: 4, textAlign: 'right' }}>{msg.time}</div>}
                </div>
              </div>
            ))}
            {loading && <div style={{ display: 'flex', gap: 5, paddingLeft: 8 }}>{[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#a78bfa', animation: `blink 1s infinite ${i*0.2}s` }} />)}</div>}
            <div ref={messagesEndRef} />
          </div>
          <div style={{ padding: '14px 20px', borderTop: '1px solid #1a1225', background: '#08060f', display: 'flex', gap: 10 }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }} placeholder="SINAR ga yozing... (Brain First)" rows={1} style={{ flex: 1, background: '#0d0a14', border: '1px solid #1a1225', borderRadius: 8, padding: '10px 14px', color: '#c4b5d4', fontSize: 14, resize: 'none', minHeight: 44 }} onFocus={e => e.target.style.borderColor='#a78bfa'} onBlur={e => e.target.style.borderColor='#1a1225'} />
            <button onClick={sendMessage} disabled={loading} style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #7c3aed', background: loading ? '#0d0a14' : 'linear-gradient(135deg, #7c3aed, #4f1d96)', color: '#e2d9f3', fontSize: 18, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>⬆</button>
          </div>
        </>
      )}
    </div>
  )
}