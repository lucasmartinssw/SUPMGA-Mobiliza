import React, { useState } from 'react';

export const demoUser = { name: 'Lucas Martins', email: 'lucas@supmga.demo', password: 'Mobiliza123', role: 'Gestão de materiais' };
const KEY = 'supmgamobiliza-demo-session';
export function readSession() {
  try { return sessionStorage.getItem(KEY) === demoUser.email ? demoUser : null; } catch { return null; }
}
export function clearSession() { try { sessionStorage.removeItem(KEY); } catch { /* Session stays in memory when storage is blocked. */ } }
export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  function submit(event) {
    event.preventDefault();
    if (email.trim().toLowerCase() !== demoUser.email || password !== demoUser.password) { setError('E-mail ou senha incorretos. Use os dados de demonstração abaixo.'); return; }
    try { sessionStorage.setItem(KEY, demoUser.email); } catch { /* Allow demo access without browser storage. */ }
    onLogin(demoUser);
  }
  return <main className="login-screen"><section className="login-story"><div className="login-brand official-logo"><img src="/logo.png" alt="SUPMGA Mobiliza — controle sustentável de materiais" /></div><span className="eyebrow">CONTROLE SUSTENTÁVEL DE MATERIAIS</span><h1>Cada material tem um próximo destino.</h1><p>Planeje mobilizações, acompanhe o retorno e transforme a triagem em novas oportunidades de reaproveitamento.</p><div className="login-cycle"><span>01 · Mobilizar</span><span>02 · Conferir</span><span>03 · Reaproveitar</span></div><small>Projeto de aprendizagem em Gestão Industrial</small></section><section className="card login-card"><span className="eyebrow">BEM-VINDO AO SUPMGA MOBILIZA</span><h2>Acesse seu ambiente</h2><p>Entre para acompanhar os materiais da sua equipe.</p><form onSubmit={submit}><label htmlFor="login-email">E-mail<input id="login-email" type="email" autoComplete="username" required value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="Seu e-mail" /></label><label htmlFor="login-password">Senha<div className="password-field"><input id="login-password" type={visible ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="Sua senha" /><button type="button" onClick={() => setVisible(v => !v)} aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}>{visible ? 'Ocultar' : 'Mostrar'}</button></div></label>{error && <p className="login-error" role="alert">{error}</p>}<button className="button primary" type="submit">Entrar no sistema →</button></form><div className="demo-credentials"><strong>Acesso de demonstração</strong><p>E-mail: <b>{demoUser.email}</b><br />Senha: <b>{demoUser.password}</b></p><button type="button" className="text-button" onClick={() => { setEmail(demoUser.email); setPassword(demoUser.password); setError(''); }}>Preencher dados de teste</button><small>Login simulado, sem autenticação real ou controle de permissões. Os dados operacionais são fictícios.</small></div></section></main>;
}
