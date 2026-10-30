import React from 'react'
import { PLANS, TRIAL_DAYS, salesWhatsAppLink } from './plans'
import './landing.css'

const BENEFITS = [
  ['💸', 'Mensalidade no Pix, sem planilha', 'Gere a cobrança do mês para todos os atletas com um clique. QR Code e Pix copia-e-cola prontos.'],
  ['📲', 'Lembrete no WhatsApp', 'Mande o link de pagamento para o pai ou atleta direto no WhatsApp. Chega de cobrar no grupo.'],
  ['✅', 'Baixa automática', 'Com Mercado Pago ou Asaas, o pagamento cai e a cobrança vira “pago” sozinha.'],
  ['📅', 'Agenda de treinos e jogos', 'Treinos, jogos e rodadas do campeonato num só lugar.'],
  ['🏆', 'Campeonatos e várzea', 'Cobre inscrição por time, controle quem pagou e organize as rodadas.'],
  ['📊', 'Inadimplência na tela', 'Veja na hora quem está em dia, pendente ou atrasado e quanto entrou no mês.']
]

const FOR_WHO = [
  ['⚽', 'Escolinhas de futebol', 'Mensalidades, categorias e contato dos responsáveis.'],
  ['🥅', 'Organizadores de várzea', 'Inscrições de times, taxa de arbitragem e rodadas.'],
  ['🏟️', 'Quadras e arenas', 'Aluguel de horário, mensalistas e cobrança por Pix.']
]

const FAQ = [
  ['Preciso de cartão para testar?', `Não. São ${TRIAL_DAYS} dias grátis com tudo liberado, sem cartão.`],
  ['O dinheiro das mensalidades passa pelo FitHub?', 'Não. No modo Pix direto o dinheiro cai na sua chave Pix. Você paga só a assinatura do FitHub.'],
  ['Funciona no celular?', 'Sim. Abre no navegador e pode ser instalado como app no Android e iPhone.'],
  ['Posso cancelar quando quiser?', 'Sim. A assinatura é mensal por Pix, sem fidelidade e sem multa.']
]

export default function LandingPage({ onStart }) {
  const wa = salesWhatsAppLink()
  return (
    <div className="lp">
      <header className="lp-nav">
        <strong className="lp-logo">FitHub</strong>
        <nav>
          <a href="#planos">Planos</a>
          <a href={wa} target="_blank" rel="noreferrer">WhatsApp</a>
          <button className="lp-btn ghost" onClick={onStart}>Entrar</button>
        </nav>
      </header>

      <section className="lp-hero">
        <div>
          <p className="lp-eyebrow">Gestão para escolinhas, várzea e quadras</p>
          <h1>Pare de correr atrás de mensalidade.</h1>
          <p className="lp-lead">O FitHub cobra seus atletas por Pix, lembra no WhatsApp e mostra quem pagou, tudo pelo celular.</p>
          <div className="lp-cta">
            <button className="lp-btn" onClick={onStart}>Testar {TRIAL_DAYS} dias grátis</button>
            <a className="lp-btn ghost" href={wa} target="_blank" rel="noreferrer">Falar no WhatsApp</a>
          </div>
          <p className="lp-small">Sem cartão de crédito · Cancele quando quiser</p>
        </div>
        <div className="lp-mock" aria-label="Tela do app (ilustração)">
          <div className="lp-mock-head">Escolinha Bola de Ouro · Novembro</div>
          <div className="lp-mock-kpis"><span><b>R$ 3.240</b>recebido</span><span><b>38</b>em dia</span><span className="late"><b>4</b>atrasados</span></div>
          {[['Pedro S.', 'Pago'], ['Lucas M.', 'Pendente'], ['João V.', 'Atrasado'], ['Davi R.', 'Pago']].map(([n, st]) => (
            <div key={n} className={`lp-mock-row ${st}`}><span>{n} · Mensalidade R$ 80,00</span><em>{st}</em></div>
          ))}
          <div className="lp-mock-btn">📲 Lembrar no WhatsApp</div>
        </div>
      </section>

      <section className="lp-section">
        <h2>Feito para quem vive o esporte amador</h2>
        <div className="lp-grid three">
          {FOR_WHO.map(([i, t, d]) => <div key={t} className="lp-card"><span className="lp-icon">{i}</span><h3>{t}</h3><p>{d}</p></div>)}
        </div>
      </section>

      <section className="lp-section">
        <h2>Tudo que você precisa para receber em dia</h2>
        <div className="lp-grid three">
          {BENEFITS.map(([i, t, d]) => <div key={t} className="lp-card"><span className="lp-icon">{i}</span><h3>{t}</h3><p>{d}</p></div>)}
        </div>
      </section>

      <section className="lp-section" id="planos">
        <h2>Planos simples, sem taxa por cobrança</h2>
        <p className="lp-lead center">Comece com {TRIAL_DAYS} dias grátis em qualquer plano.</p>
        <div className="lp-grid two">
          {Object.values(PLANS).map(p => (
            <div key={p.id} className={`lp-card lp-plan ${p.id === 'pro' ? 'featured' : ''}`}>
              {p.id === 'pro' && <span className="lp-badge">Mais escolhido</span>}
              <h3>{p.name}</h3>
              <p className="lp-price">R$ {p.price.toFixed(2).replace('.', ',')}<small>/mês</small></p>
              <ul>{p.features.map(f => <li key={f}>✔ {f}</li>)}</ul>
              <button className="lp-btn" onClick={onStart}>Começar teste grátis</button>
            </div>
          ))}
        </div>
        <p className="lp-small center">Mais de 200 atletas ou várias unidades? <a href={wa} target="_blank" rel="noreferrer">Fale com a gente</a>.</p>
      </section>

      <section className="lp-section">
        <h2>Perguntas frequentes</h2>
        <div className="lp-faq">
          {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
        </div>
      </section>

      <section className="lp-final">
        <h2>Seu próximo mês já pode ser sem calote.</h2>
        <button className="lp-btn" onClick={onStart}>Criar conta grátis</button>
      </section>
      <footer className="lp-foot">FitHub · Feito em Salvador-BA · <a href={wa} target="_blank" rel="noreferrer">Contato</a></footer>
    </div>
  )
}
