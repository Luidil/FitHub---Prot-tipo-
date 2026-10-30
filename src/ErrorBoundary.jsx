import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('Erro na interface:', error, info) }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="login-shell"><div className="login-card" style={{ textAlign: 'center' }}>
        <p className="eyebrow">FitHub</p>
        <h1>Algo deu errado</h1>
        <p className="lead">Tente recarregar a página. Se continuar, fale com o suporte.</p>
        <button className="primary" onClick={() => window.location.reload()}>Recarregar</button>
      </div></div>
    )
  }
}
