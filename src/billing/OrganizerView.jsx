import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { callApi } from './api'
import { buildPixCopyPaste, chargeStatus, formatBRL, payLink, todayISO, whatsappReminderLink } from './pix'
import './billing.css'
import { PLANS, planState, salesWhatsAppLink } from '../saas/plans'

const KIND_LABEL = { escolinha: 'Escolinha', campeonato: 'Organizador de campeonato', quadra: 'Quadra / Arena', time: 'Time de várzea' }
const CHARGE_KIND = { mensalidade: 'Mensalidade', inscricao_campeonato: 'Inscrição em campeonato', inscricao_jogo: 'Inscrição em jogo', aluguel_quadra: 'Aluguel de quadra', outro: 'Outro' }
const STATUS_LABEL = { pago: 'Pago', pendente: 'Pendente', atrasado: 'Atrasado', cancelado: 'Cancelado' }

function monthId(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function dueDateFor(month, day) {
  return `${month}-${String(Math.min(Math.max(Number(day) || 10, 1), 28)).padStart(2, '0')}`
}

export default function OrganizerView({ user, showToast }) {
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('resumo')
  const [athletes, setAthletes] = useState([])
  const [charges, setCharges] = useState([])
  const [schedule, setSchedule] = useState([])
  const [error, setError] = useState('')

  const toast = (m, t = 'info') => (showToast ? showToast(m, t) : alert(m))

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const { data: orgs, error: e1 } = await supabase.from('organizations').select('*').eq('owner_id', user.id).order('created_at').limit(1)
      if (e1) throw e1
      const o = orgs?.[0] || null
      setOrg(o)
      if (o) {
        const [a, c, s] = await Promise.all([
          supabase.from('athletes').select('*').eq('organization_id', o.id).order('name'),
          supabase.from('charges').select('*').eq('organization_id', o.id).order('due_date', { ascending: false }),
          supabase.from('schedule_items').select('*').eq('organization_id', o.id).order('starts_at')
        ])
        for (const r of [a, c, s]) if (r.error) throw r.error
        setAthletes(a.data || [])
        setCharges(c.data || [])
        setSchedule(s.data || [])
      }
    } catch (e) {
      console.error(e)
      setError('Não foi possível carregar a gestão. Verifique se as migrations do Supabase foram aplicadas (veja o README).')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (user?.id) loadAll() }, [user?.id])

  if (loading) return <section className="view billing"><p className="lead">Carregando gestão...</p></section>
  if (error) return <section className="view billing"><div className="b-card b-error">{error}</div><button className="primary" onClick={loadAll}>Tentar de novo</button></section>
  if (!org) return (
    <section className="view billing">
      <div className="b-steps"><span className="on">1. Sua organização</span><span>2. Primeiro atleta</span><span>3. Primeira cobrança</span></div>
      <p className="lead">Bem-vindo ao FitHub! Você tem <b>14 dias grátis</b> com todos os recursos. Comece cadastrando sua escolinha, campeonato ou quadra.</p>
      <OrgForm user={user} onSaved={loadAll} toast={toast} embedded />
    </section>
  )

  const ps = planState(org)
  const activeCount = athletes.filter(a => a.active).length
  const tabs = [['resumo', 'Resumo'], ['atletas', 'Atletas'], ['cobrancas', 'Cobranças'], ['agenda', 'Agenda'], ['plano', 'Plano'], ['config', 'Configurações']]
  return (
    <section className="view billing">
      <div className="section-head">
        <p className="eyebrow">{KIND_LABEL[org.kind]}</p>
        <h2>{org.name}</h2>
      </div>
      <PlanBanner ps={ps} activeCount={activeCount} goPlan={() => setTab('plano')} />
      {!org.onboarding_done && <Onboarding org={org} athletes={athletes} charges={charges} setTab={setTab} reload={loadAll} toast={toast} />}
      <div className="b-tabs">
        {tabs.map(([id, label]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {tab === 'resumo' && <Summary org={org} charges={charges} athletes={athletes} schedule={schedule} goCharges={() => setTab('cobrancas')} />}
      {tab === 'plano' && <PlanTab org={org} ps={ps} activeCount={activeCount} reload={loadAll} toast={toast} />}
      {tab === 'atletas' && <Athletes org={org} ps={ps} athletes={athletes} reload={loadAll} toast={toast} />}
      {tab === 'cobrancas' && <Charges org={org} athletes={athletes} charges={charges} reload={loadAll} toast={toast} />}
      {tab === 'agenda' && <Schedule org={org} items={schedule} reload={loadAll} toast={toast} />}
      {tab === 'config' && <OrgForm user={user} org={org} onSaved={loadAll} toast={toast} />}
    </section>
  )
}

function OrgForm({ user, org, onSaved, toast, embedded }) {
  const [f, setF] = useState(org || { name: '', kind: 'escolinha', city: 'Salvador', whatsapp: '', pix_key: '', pix_merchant_name: '', default_fee: '', default_due_day: 10 })
  const [saving, setSaving] = useState(false)
  const up = (k, v) => setF(p => ({ ...p, [k]: v }))

  async function save(e) {
    e.preventDefault()
    if (!f.name.trim()) return toast('Informe o nome.', 'warn')
    setSaving(true)
    const payload = {
      owner_id: user.id, name: f.name.trim(), kind: f.kind, city: f.city, whatsapp: f.whatsapp,
      pix_key: f.pix_key?.trim() || null, pix_merchant_name: f.pix_merchant_name || f.name,
      default_fee: Number(f.default_fee) || 0, default_due_day: Number(f.default_due_day) || 10
    }
    const { error } = org
      ? await supabase.from('organizations').update(payload).eq('id', org.id)
      : await supabase.from('organizations').insert(payload)
    setSaving(false)
    if (error) return toast('Erro ao salvar: ' + error.message, 'error')
    toast('Dados salvos!', 'success')
    onSaved()
  }

  return (
    <section className={org || embedded ? '' : 'view billing'}>
      {!org && !embedded && (
        <div className="section-head">
          <p className="eyebrow">Gestão e cobrança</p>
          <h2>Cadastre sua escolinha, campeonato ou quadra</h2>
          <p className="lead">Controle atletas, mensalidades e inscrições com Pix e lembrete no WhatsApp.</p>
        </div>
      )}
      <form className="b-card b-form" onSubmit={save}>
        <label>Nome<input value={f.name} onChange={e => up('name', e.target.value)} placeholder="Ex.: Escolinha Bola de Ouro" /></label>
        <label>Tipo
          <select value={f.kind} onChange={e => up('kind', e.target.value)}>
            {Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Cidade<input value={f.city || ''} onChange={e => up('city', e.target.value)} /></label>
        <label>WhatsApp do responsável<input value={f.whatsapp || ''} onChange={e => up('whatsapp', e.target.value)} placeholder="71999999999" /></label>
        <label>Chave Pix (para receber direto, sem provedor)<input value={f.pix_key || ''} onChange={e => up('pix_key', e.target.value)} placeholder="CPF, CNPJ, e-mail, telefone (+55...) ou chave aleatória" /></label>
        <label>Nome do recebedor no Pix<input value={f.pix_merchant_name || ''} onChange={e => up('pix_merchant_name', e.target.value)} /></label>
        <label>Mensalidade padrão (R$)<input type="number" min="0" step="0.01" value={f.default_fee} onChange={e => up('default_fee', e.target.value)} /></label>
        <label>Dia de vencimento padrão<input type="number" min="1" max="28" value={f.default_due_day} onChange={e => up('default_due_day', e.target.value)} /></label>
        <button className="primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
      </form>
    </section>
  )
}

function Summary({ charges, athletes, schedule, goCharges }) {
  const stats = useMemo(() => {
    const m = monthId()
    const r = { recebidoMes: 0, pendente: 0, atrasado: 0, qtdAtrasado: 0 }
    charges.forEach(c => {
      const st = chargeStatus(c)
      if (st === 'pago' && (c.paid_at || '').slice(0, 7) === m) r.recebidoMes += Number(c.amount)
      if (st === 'pendente') r.pendente += Number(c.amount)
      if (st === 'atrasado') { r.atrasado += Number(c.amount); r.qtdAtrasado++ }
    })
    return r
  }, [charges])
  const next = schedule.filter(s => new Date(s.starts_at) >= new Date()).slice(0, 3)
  return (
    <div className="b-grid">
      <div className="b-card b-stat"><span>Recebido no mês</span><strong>{formatBRL(stats.recebidoMes)}</strong></div>
      <div className="b-card b-stat"><span>A receber</span><strong>{formatBRL(stats.pendente)}</strong></div>
      <div className="b-card b-stat b-late" onClick={goCharges}><span>Atrasado ({stats.qtdAtrasado})</span><strong>{formatBRL(stats.atrasado)}</strong></div>
      <div className="b-card b-stat"><span>Atletas ativos</span><strong>{athletes.filter(a => a.active).length}</strong></div>
      <div className="b-card b-wide">
        <h3>Próximos compromissos</h3>
        {next.length === 0 ? <p className="meta">Nada agendado.</p> : next.map(s => (
          <p key={s.id} className="meta">{new Date(s.starts_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · {s.title} {s.location ? `· ${s.location}` : ''}</p>
        ))}
      </div>
    </div>
  )
}

function Athletes({ org, ps, athletes, reload, toast }) {
  const empty = { name: '', phone: '', guardian_name: '', category: '', monthly_fee: '', due_day: '' }
  const [f, setF] = useState(empty)
  const [editing, setEditing] = useState(null)
  const up = (k, v) => setF(p => ({ ...p, [k]: v }))

  async function save(e) {
    e.preventDefault()
    if (!f.name.trim()) return toast('Informe o nome do atleta.', 'warn')
    if (!editing && ps) {
      if (!ps.active) return toast('Seu plano/teste expirou. Assine na aba Plano para cadastrar novos atletas.', 'warn')
      if (athletes.filter(a => a.active).length >= ps.limit) return toast(`Limite de ${ps.limit} atletas do seu plano atingido. Faça upgrade na aba Plano.`, 'warn')
    }
    const payload = {
      organization_id: org.id, name: f.name.trim(), phone: f.phone, guardian_name: f.guardian_name, category: f.category,
      monthly_fee: f.monthly_fee === '' ? null : Number(f.monthly_fee), due_day: f.due_day === '' ? null : Number(f.due_day)
    }
    const { error } = editing
      ? await supabase.from('athletes').update(payload).eq('id', editing)
      : await supabase.from('athletes').insert(payload)
    if (error) return toast('Erro: ' + error.message, 'error')
    setF(empty); setEditing(null); toast('Atleta salvo!', 'success'); reload()
  }
  async function toggle(a) {
    const { error } = await supabase.from('athletes').update({ active: !a.active }).eq('id', a.id)
    if (error) return toast('Erro: ' + error.message, 'error')
    reload()
  }

  return (
    <div className="b-stack">
      <form className="b-card b-form" onSubmit={save}>
        <h3>{editing ? 'Editar atleta' : 'Novo atleta'}</h3>
        <label>Nome<input value={f.name} onChange={e => up('name', e.target.value)} /></label>
        <label>WhatsApp (atleta ou responsável)<input value={f.phone || ''} onChange={e => up('phone', e.target.value)} placeholder="71999999999" /></label>
        <label>Responsável<input value={f.guardian_name || ''} onChange={e => up('guardian_name', e.target.value)} /></label>
        <label>Categoria / turma<input value={f.category || ''} onChange={e => up('category', e.target.value)} placeholder="Sub-11" /></label>
        <label>Mensalidade (vazio = padrão {formatBRL(org.default_fee)})<input type="number" min="0" step="0.01" value={f.monthly_fee ?? ''} onChange={e => up('monthly_fee', e.target.value)} /></label>
        <label>Dia de vencimento (vazio = {org.default_due_day})<input type="number" min="1" max="28" value={f.due_day ?? ''} onChange={e => up('due_day', e.target.value)} /></label>
        <div className="b-row">
          <button className="primary">Salvar</button>
          {editing && <button type="button" className="ghost" onClick={() => { setF(empty); setEditing(null) }}>Cancelar</button>}
        </div>
      </form>
      <div className="b-card">
        <h3>Atletas ({athletes.length})</h3>
        {athletes.length === 0 && <p className="meta">Nenhum atleta cadastrado ainda.</p>}
        <table className="b-table">
          <thead><tr><th>Nome</th><th>Turma</th><th>Mensalidade</th><th>Situação</th><th></th></tr></thead>
          <tbody>
            {athletes.map(a => (
              <tr key={a.id} className={a.active ? '' : 'b-muted'}>
                <td>{a.name}<br /><small>{a.phone}</small></td>
                <td>{a.category}</td>
                <td>{formatBRL(a.monthly_fee ?? org.default_fee)}</td>
                <td>{a.active ? 'Ativo' : 'Inativo'}</td>
                <td className="b-actions">
                  <button className="ghost" onClick={() => { setEditing(a.id); setF({ ...empty, ...a, monthly_fee: a.monthly_fee ?? '', due_day: a.due_day ?? '' }) }}>Editar</button>
                  <button className="ghost" onClick={() => toggle(a)}>{a.active ? 'Desativar' : 'Ativar'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Charges({ org, athletes, charges, reload, toast }) {
  const [filter, setFilter] = useState('abertas')
  const [month, setMonth] = useState(monthId())
  const [busy, setBusy] = useState(false)
  const [pixOpen, setPixOpen] = useState(null)
  const [f, setF] = useState({ kind: 'inscricao_campeonato', payer_name: '', payer_phone: '', description: '', amount: '', due_date: todayISO(), athlete_id: '' })
  const up = (k, v) => setF(p => ({ ...p, [k]: v }))

  const list = charges.filter(c => {
    const st = chargeStatus(c)
    if (filter === 'abertas') return st === 'pendente' || st === 'atrasado'
    if (filter === 'todas') return st !== 'cancelado'
    return st === filter
  })

  function staticPix(charge) {
    return org.pix_key ? buildPixCopyPaste({ key: org.pix_key, name: org.pix_merchant_name || org.name, city: org.city, amount: charge.amount, txid: charge.id.replace(/-/g, '').slice(0, 25) }) : null
  }

  async function generateMonthly() {
    const active = athletes.filter(a => a.active)
    if (!active.length) return toast('Cadastre atletas ativos primeiro.', 'warn')
    setBusy(true)
    const existing = new Set(charges.filter(c => c.kind === 'mensalidade' && c.reference_month === month && c.status !== 'cancelado').map(c => c.athlete_id))
    const [y, m] = month.split('-')
    const rows = active.filter(a => !existing.has(a.id)).map(a => ({
      organization_id: org.id, athlete_id: a.id, payer_name: a.guardian_name || a.name, payer_phone: a.phone, kind: 'mensalidade',
      description: `Mensalidade ${m}/${y} - ${a.name}`, reference_month: month,
      amount: Number(a.monthly_fee ?? org.default_fee), due_date: dueDateFor(month, a.due_day ?? org.default_due_day)
    })).filter(r => r.amount > 0)
    if (!rows.length) { setBusy(false); return toast('Mensalidades deste mês já foram geradas (ou valor zerado).', 'info') }
    const { error } = await supabase.from('charges').insert(rows)
    setBusy(false)
    if (error) return toast('Erro: ' + error.message, 'error')
    toast(`${rows.length} mensalidade(s) gerada(s)!`, 'success')
    reload()
  }

  async function createCharge(e) {
    e.preventDefault()
    const athlete = athletes.find(a => a.id === f.athlete_id)
    const payer = f.payer_name || athlete?.guardian_name || athlete?.name
    if (!payer || !f.description || !(Number(f.amount) > 0)) return toast('Preencha pagador, descrição e valor.', 'warn')
    const { error } = await supabase.from('charges').insert({
      organization_id: org.id, athlete_id: f.athlete_id || null, payer_name: payer, payer_phone: f.payer_phone || athlete?.phone,
      kind: f.kind, description: f.description, amount: Number(f.amount), due_date: f.due_date
    })
    if (error) return toast('Erro: ' + error.message, 'error')
    setF(p => ({ ...p, payer_name: '', payer_phone: '', description: '', amount: '', athlete_id: '' }))
    toast('Cobrança criada!', 'success'); reload()
  }

  async function setStatus(c, status) {
    const { error } = await supabase.from('charges').update({ status, paid_at: status === 'pago' ? new Date().toISOString() : null, provider: status === 'pago' && !c.provider ? 'manual' : c.provider }).eq('id', c.id)
    if (error) return toast('Erro: ' + error.message, 'error')
    toast(status === 'pago' ? 'Marcado como pago.' : 'Cobrança atualizada.', 'success'); reload()
  }

  async function generatePix(c) {
    setBusy(true)
    try {
      let payerCpf
      const res = await callApi('pix/create', { chargeId: c.id }).catch(async err => {
        if (/CPF/.test(err.message)) {
          payerCpf = prompt('O Asaas exige o CPF/CNPJ do pagador:')
          if (payerCpf) return callApi('pix/create', { chargeId: c.id, payerCpf })
        }
        throw err
      })
      const updated = res.charge
      if (!updated.pix_copy_paste) {
        const code = staticPix(updated)
        if (code) await supabase.from('charges').update({ pix_copy_paste: code, provider: 'pix_direto' }).eq('id', c.id)
        toast(res.provider === 'mock' ? 'Modo teste: Pix gerado com sua chave (sem confirmação automática).' : 'Pix gerado!', 'info')
      } else toast('Pix gerado no provedor! A baixa será automática.', 'success')
      await reload()
      setPixOpen(c.id)
    } catch (err) {
      // Sem API (dev local/sem servidor): usa Pix direto com a chave do organizador.
      const code = staticPix(c)
      if (code) {
        await supabase.from('charges').update({ pix_copy_paste: code, provider: 'pix_direto' }).eq('id', c.id)
        toast('Pix direto gerado com sua chave. Confirme o pagamento manualmente.', 'info')
        await reload(); setPixOpen(c.id)
      } else toast(`${err.message} Cadastre uma chave Pix em Configurações para usar o Pix direto.`, 'error')
    } finally { setBusy(false) }
  }

  async function simulatePaid(c) {
    try { await callApi('pix/simulate', { chargeId: c.id }); toast('Pagamento simulado (webhook de teste).', 'success'); reload() }
    catch (err) { toast(err.message, 'error') }
  }

  const copy = text => navigator.clipboard?.writeText(text).then(() => toast('Copiado!', 'success'), () => toast('Não foi possível copiar.', 'error'))

  return (
    <div className="b-stack">
      <div className="b-card">
        <h3>Mensalidades</h3>
        <div className="b-row">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
          <button className="primary" disabled={busy} onClick={generateMonthly}>Gerar mensalidades do mês</button>
        </div>
        <p className="meta">Gera uma cobrança por atleta ativo (sem duplicar).</p>
      </div>

      <form className="b-card b-form" onSubmit={createCharge}>
        <h3>Nova cobrança avulsa (inscrição, jogo, quadra)</h3>
        <label>Tipo<select value={f.kind} onChange={e => up('kind', e.target.value)}>
          {Object.entries(CHARGE_KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select></label>
        <label>Atleta (opcional)<select value={f.athlete_id} onChange={e => up('athlete_id', e.target.value)}>
          <option value="">— Pagador avulso —</option>
          {athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select></label>
        <label>Pagador / time<input value={f.payer_name} onChange={e => up('payer_name', e.target.value)} /></label>
        <label>WhatsApp<input value={f.payer_phone} onChange={e => up('payer_phone', e.target.value)} placeholder="71999999999" /></label>
        <label>Descrição<input value={f.description} onChange={e => up('description', e.target.value)} placeholder="Inscrição Copa de Várzea 2026" /></label>
        <label>Valor (R$)<input type="number" min="0.01" step="0.01" value={f.amount} onChange={e => up('amount', e.target.value)} /></label>
        <label>Vencimento<input type="date" value={f.due_date} onChange={e => up('due_date', e.target.value)} /></label>
        <button className="primary">Criar cobrança</button>
      </form>

      <div className="b-card">
        <div className="b-row b-between">
          <h3>Cobranças</h3>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="abertas">Em aberto</option>
            <option value="atrasado">Atrasadas</option>
            <option value="pendente">Pendentes</option>
            <option value="pago">Pagas</option>
            <option value="todas">Todas</option>
          </select>
        </div>
        {list.length === 0 && <p className="meta">Nenhuma cobrança neste filtro.</p>}
        {list.map(c => {
          const st = chargeStatus(c)
          return (
            <div key={c.id} className="b-charge">
              <div className="b-row b-between">
                <div>
                  <strong>{c.payer_name}</strong> · {formatBRL(c.amount)}
                  <div className="meta">{c.description} · vence {new Date(c.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                </div>
                <span className={`b-badge b-${st}`}>{STATUS_LABEL[st]}</span>
              </div>
              {st !== 'pago' && st !== 'cancelado' && (
                <div className="b-row b-wrap">
                  <button className="ghost" disabled={busy} onClick={() => generatePix(c)}>{c.pix_copy_paste ? 'Gerar Pix de novo' : 'Gerar Pix'}</button>
                  {c.pix_copy_paste && <button className="ghost" onClick={() => setPixOpen(pixOpen === c.id ? null : c.id)}>Ver Pix</button>}
                  {c.payer_phone
                    ? <a className="ghost b-wa" href={whatsappReminderLink(c, org.name)} target="_blank" rel="noreferrer">Lembrar no WhatsApp</a>
                    : <span className="meta">sem WhatsApp</span>}
                  <button className="ghost" onClick={() => copy(payLink(c.id))}>Copiar link de pagamento</button>
                  <button className="ghost" onClick={() => setStatus(c, 'pago')}>Marcar pago</button>
                  {['mock', 'pix_direto'].includes(c.provider) && <button className="ghost" onClick={() => simulatePaid(c)}>Simular webhook</button>}
                  <button className="ghost" onClick={() => confirm('Cancelar esta cobrança?') && setStatus(c, 'cancelado')}>Cancelar</button>
                </div>
              )}
              {st === 'pago' && <div className="b-row"><span className="meta">Pago em {c.paid_at ? new Date(c.paid_at).toLocaleDateString('pt-BR') : '-'} ({c.provider || 'manual'})</span><button className="ghost" onClick={() => setStatus(c, 'pendente')}>Desfazer</button></div>}
              {pixOpen === c.id && c.pix_copy_paste && (
                <div className="b-pix">
                  {c.pix_qr_base64 && <img alt="QR Code Pix" src={`data:image/png;base64,${c.pix_qr_base64}`} />}
                  <textarea readOnly value={c.pix_copy_paste} rows={3} />
                  <button className="primary" onClick={() => copy(c.pix_copy_paste)}>Copiar Pix Copia e Cola</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Schedule({ org, items, reload, toast }) {
  const [f, setF] = useState({ title: '', kind: 'treino', starts_at: '', location: '', notes: '' })
  const up = (k, v) => setF(p => ({ ...p, [k]: v }))
  async function save(e) {
    e.preventDefault()
    if (!f.title || !f.starts_at) return toast('Informe título e data/hora.', 'warn')
    const { error } = await supabase.from('schedule_items').insert({ ...f, organization_id: org.id, starts_at: new Date(f.starts_at).toISOString() })
    if (error) return toast('Erro: ' + error.message, 'error')
    setF({ title: '', kind: 'treino', starts_at: '', location: '', notes: '' }); toast('Agendado!', 'success'); reload()
  }
  async function remove(id) {
    const { error } = await supabase.from('schedule_items').delete().eq('id', id)
    if (error) return toast('Erro: ' + error.message, 'error')
    reload()
  }
  return (
    <div className="b-stack">
      <form className="b-card b-form" onSubmit={save}>
        <h3>Novo treino, jogo ou reserva</h3>
        <label>Título<input value={f.title} onChange={e => up('title', e.target.value)} placeholder="Treino Sub-11" /></label>
        <label>Tipo<select value={f.kind} onChange={e => up('kind', e.target.value)}>
          <option value="treino">Treino</option><option value="jogo">Jogo</option><option value="campeonato">Campeonato</option><option value="reserva">Reserva de quadra</option>
        </select></label>
        <label>Data e hora<input type="datetime-local" value={f.starts_at} onChange={e => up('starts_at', e.target.value)} /></label>
        <label>Local<input value={f.location} onChange={e => up('location', e.target.value)} /></label>
        <label>Observações<input value={f.notes} onChange={e => up('notes', e.target.value)} /></label>
        <button className="primary">Agendar</button>
      </form>
      <div className="b-card">
        <h3>Agenda</h3>
        {items.length === 0 && <p className="meta">Nada agendado.</p>}
        {items.map(s => (
          <div key={s.id} className="b-row b-between b-charge">
            <div><strong>{s.title}</strong><div className="meta">{new Date(s.starts_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · {s.kind}{s.location ? ` · ${s.location}` : ''}</div></div>
            <button className="ghost" onClick={() => remove(s.id)}>Remover</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlanBanner({ ps, activeCount, goPlan }) {
  if (!ps) return null
  let msg = null
  if (ps.plan === 'trial') msg = ps.active ? `Teste grátis: faltam ${ps.daysLeft} dia(s).` : 'Seu teste grátis acabou.'
  else if (!ps.active) msg = `Seu plano ${ps.label} venceu.`
  else if (ps.daysLeft <= 5) msg = `Seu plano ${ps.label} vence em ${ps.daysLeft} dia(s).`
  if (activeCount >= ps.limit) msg = (msg ? msg + ' ' : '') + `Você atingiu ${activeCount}/${ps.limit} atletas.`
  if (!msg) return null
  return (
    <div className={`b-card b-banner ${ps.active ? '' : 'b-error'}`}>
      <span>{msg}</span> <button className="primary small" onClick={goPlan}>Ver planos</button>
    </div>
  )
}

function Onboarding({ org, athletes, charges, setTab, reload, toast }) {
  const steps = [
    { done: true, label: 'Organização criada', tab: 'config' },
    { done: !!org.pix_key, label: 'Cadastrar sua chave Pix', tab: 'config' },
    { done: athletes.length > 0, label: 'Cadastrar o primeiro atleta', tab: 'atletas' },
    { done: charges.length > 0, label: 'Gerar a primeira cobrança', tab: 'cobrancas' }
  ]
  async function finish() {
    const { error } = await supabase.from('organizations').update({ onboarding_done: true }).eq('id', org.id)
    if (error) return toast('Erro: ' + error.message, 'error')
    reload()
  }
  const all = steps.every(s => s.done)
  return (
    <div className="b-card b-onboarding">
      <strong>Primeiros passos</strong>
      <ul>
        {steps.map(s => (
          <li key={s.label} className={s.done ? 'done' : ''}>
            {s.done ? '✅' : '⬜'} {s.label} {!s.done && <button className="link" onClick={() => setTab(s.tab)}>fazer agora</button>}
          </li>
        ))}
      </ul>
      <button className={all ? 'primary small' : 'ghost small'} onClick={finish}>{all ? 'Concluir' : 'Ocultar'}</button>
    </div>
  )
}

function PlanTab({ org, ps, activeCount, reload, toast }) {
  const [inv, setInv] = useState(null)
  const [busy, setBusy] = useState('')
  const [cpf, setCpf] = useState('')
  const [history, setHistory] = useState([])

  async function loadHistory() {
    const { data } = await supabase.from('saas_invoices').select('*').eq('organization_id', org.id).order('created_at', { ascending: false }).limit(12)
    setHistory(data || [])
  }
  useEffect(() => { loadHistory() }, [org.id])

  async function subscribe(plan) {
    setBusy(plan)
    try {
      const r = await callApi('saas/subscribe', { plan, cpf: cpf || undefined })
      setInv({ ...r.invoice, provider: r.provider })
      loadHistory()
    } catch (e) { toast(e.message, 'error') } finally { setBusy('') }
  }
  async function simulate() {
    try {
      await callApi('saas/subscribe', { simulate: inv.id })
      toast('Pagamento simulado! Plano ativado por 30 dias.', 'success')
      setInv(null); reload()
    } catch (e) { toast(e.message, 'error') }
  }
  const exp = org.plan === 'trial' ? org.trial_ends_at : org.plan_expires_at

  return (
    <div>
      <div className="b-card">
        <p>Plano atual: <b>{ps.label}</b> · {activeCount}/{ps.limit} atletas ativos {exp && <>· válido até <b>{new Date(exp).toLocaleDateString('pt-BR')}</b></>}</p>
      </div>
      <div className="b-plans">
        {Object.values(PLANS).map(p => (
          <div key={p.id} className={`b-card b-plan ${org.plan === p.id ? 'current' : ''}`}>
            <h3>{p.name}</h3>
            <p className="b-price">{formatBRL(p.price)}<small>/mês</small></p>
            <ul>{p.features.map(f => <li key={f}>✔ {f}</li>)}</ul>
            <button className="primary" disabled={!!busy} onClick={() => subscribe(p.id)}>
              {busy === p.id ? 'Gerando Pix...' : org.plan === p.id ? 'Renovar 30 dias' : 'Assinar com Pix'}
            </button>
          </div>
        ))}
      </div>
      <label className="b-form">CPF/CNPJ (só se o pagamento for via Asaas)<input value={cpf} onChange={e => setCpf(e.target.value)} /></label>
      {inv && (
        <div className="b-card">
          <strong>Pague com Pix para ativar o plano {PLANS[inv.plan]?.name}</strong>
          {inv.pix_qr_base64
            ? <img alt="QR Pix" src={`data:image/png;base64,${inv.pix_qr_base64}`} style={{ width: 200 }} />
            : inv.provider !== 'mock' && inv.pix_copy_paste && <img alt="QR Pix" src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inv.pix_copy_paste)}`} />}
          <textarea readOnly value={inv.pix_copy_paste || ''} rows={3} style={{ width: '100%' }} />
          <button className="ghost" onClick={() => navigator.clipboard?.writeText(inv.pix_copy_paste || '')}>Copiar código</button>
          {inv.provider === 'mock' && <button className="primary" onClick={simulate}>Simular pagamento (modo teste)</button>}
          <p className="lead">A liberação é automática quando o Pix é confirmado.</p>
        </div>
      )}
      {history.length > 0 && (
        <div className="b-card">
          <strong>Faturas</strong>
          <ul>{history.map(h => <li key={h.id}>{new Date(h.created_at).toLocaleDateString('pt-BR')} · {PLANS[h.plan]?.name} · {formatBRL(h.amount)} · {h.status}</li>)}</ul>
        </div>
      )}
      <p><a href={salesWhatsAppLink('Olá! Tenho dúvidas sobre o plano do FitHub.')} target="_blank" rel="noreferrer">Falar com a gente no WhatsApp</a></p>
    </div>
  )
}
