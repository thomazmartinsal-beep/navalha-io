import React, { useState, useEffect } from 'react';
import {
  Scissors, Calendar, Users, Shield, Crown, CheckCircle2,
  XCircle, Plus, Lock, Unlock, LogOut, ArrowLeft,
  Store, Sparkles, Eye, Loader2
} from 'lucide-react';
import { supabase } from './supabaseClient';

const BrandLogo = ({ subtitle = 'Gestão e Agendamento Inteligente' }) => (
  <div className="flex items-center gap-3 select-none">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-zinc-950 font-black">
      <Scissors className="w-5 h-5" />
    </div>
    <div>
      <div className="flex items-center gap-1.5">
        <span className="text-lg font-black tracking-tight text-white">NAVALHA</span>
        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
          .IO
        </span>
      </div>
      <p className="text-[11px] text-zinc-400 leading-none mt-0.5">{subtitle}</p>
    </div>
  </div>
);

export default function App() {
  const [loadingApp, setLoadingApp] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [impersonatedTenantId, setImpersonatedTenantId] = useState(null);

  // Dados reais do Supabase
  const [tenants, setTenants] = useState([]);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [appointments, setAppointments] = useState([]);

  // Modal de Login / Cadastro
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [toast, setToast] = useState(null);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Carrega dados gerais e sessão ativa
  const loadPlatformData = async (currentUser = null) => {
    try {
      const [{ data: tenantsData }, { data: servicesData }, { data: barbersData }, { data: aptData }] =
        await Promise.all([
          supabase.from('tenants').select('*').order('created_at', { ascending: false }),
          supabase.from('services').select('*').eq('active', true),
          supabase.from('barbers').select('*').eq('active', true),
          supabase.from('appointments').select('*').order('date', { ascending: true }),
        ]);

      setTenants(tenantsData || []);
      setServices(servicesData || []);
      setBarbers(barbersData || []);
      setAppointments(aptData || []);

      if (currentUser) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        setProfile(prof || null);
      } else {
        setProfile(null);
      }
    } finally {
      setLoadingApp(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setAuthUser(u);
      loadPlatformData(u);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setAuthUser(u);
      loadPlatformData(u);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Login com e-mail e senha
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      setShowAuthModal(false);
      notify('Acesso realizado com sucesso!');
    } catch (err) {
      setAuthError(err.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Cadastro de nova barbearia + criação automática de acesso
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!shopName.trim() || !fullName.trim()) {
      setAuthError('Preencha seu nome e o nome da barbearia.');
      return;
    }
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            shop_name: shopName.trim(),
            phone: phone.trim(),
            role: 'owner',
          },
        },
      });
      if (error) throw error;

      // Garante login imediato caso a sessão não venha preenchida
      if (!data.session) {
        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (loginErr) throw loginErr;
      }

      setShowAuthModal(false);
      notify(`Barbearia "${shopName}" criada! Bem-vindo ao painel.`);
    } catch (err) {
      setAuthError(err.message || 'Erro ao criar conta.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setImpersonatedTenantId(null);
    setProfile(null);
    notify('Sessão encerrada.');
  };

  if (loadingApp) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
        <span className="text-sm font-semibold">Carregando Navalha.io...</span>
      </div>
    );
  }

  const activeTenantId = impersonatedTenantId || profile?.tenant_id;
  const activeTenant = tenants.find((t) => t.id === activeTenantId);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-zinc-900 border border-amber-500/40 shadow-2xl text-sm font-medium text-white">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Barra de Suporte Master quando Super Admin entra em uma barbearia */}
      {impersonatedTenantId && (
        <div className="bg-amber-500 text-zinc-950 px-4 py-2 text-xs font-bold flex items-center justify-between sticky top-0 z-50">
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            MODO SUPER ADMIN — Gerenciando: {activeTenant?.name}
          </span>
          <button
            onClick={() => setImpersonatedTenantId(null)}
            className="px-3 py-1 rounded-lg bg-zinc-950 text-amber-400 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Console Master
          </button>
        </div>
      )}

      {/* ROTA 1: VITRINE PÚBLICA E AGENDAMENTO (Usuário não logado) */}
      {!authUser && (
        <PublicLandingAndBooking
          tenants={tenants.filter((t) => t.status !== 'blocked')}
          services={services}
          barbers={barbers}
          onOpenLogin={() => { setAuthMode('login'); setShowAuthModal(true); }}
          onOpenRegister={() => { setAuthMode('register'); setShowAuthModal(true); }}
          onAppointmentCreated={() => loadPlatformData(null)}
          notify={notify}
        />
      )}

      {/* ROTA 2: CONSOLE SUPER ADMIN (Você visualiza e gerencia tudo) */}
      {authUser && profile?.role === 'super_admin' && !impersonatedTenantId && (
        <SuperAdminConsole
          tenants={tenants}
          onRefresh={() => loadPlatformData(authUser)}
          onImpersonate={(id) => setImpersonatedTenantId(id)}
          onLogout={handleLogout}
          notify={notify}
        />
      )}

      {/* ROTA 3: PAINEL DO DONO DA BARBEARIA / EQUIPE */}
      {authUser && (profile?.role === 'owner' || profile?.role === 'barber' || impersonatedTenantId) && (
        <OwnerDashboardShell
          profile={profile}
          tenant={activeTenant}
          services={services.filter((s) => s.tenant_id === activeTenantId)}
          barbers={barbers.filter((b) => b.tenant_id === activeTenantId)}
          appointments={appointments.filter((a) => a.tenant_id === activeTenantId)}
          onRefresh={() => loadPlatformData(authUser)}
          onLogout={handleLogout}
          notify={notify}
        />
      )}

      {/* FALLBACK CASO O PERFIL AINDA NÃO TENHA CARREGADO */}
      {authUser && !profile && !impersonatedTenantId && (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
          <p className="text-zinc-300 font-semibold mb-4">Carregando permissões da conta...</p>
          <button onClick={handleLogout} className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-sm">
            Sair e tentar novamente
          </button>
        </div>
      )}

      {/* MODAL ÚNICO DE LOGIN E CADASTRO */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <BrandLogo subtitle={authMode === 'login' ? 'Acesso ao Painel' : 'Cadastre sua Barbearia'} />
              <button
                onClick={() => setShowAuthModal(false)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-950 border border-zinc-800 mb-5">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  authMode === 'login' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Já tenho conta
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  authMode === 'register' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Criar Conta Grátis
              </button>
            </div>

            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-3.5">
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                      Nome da Barbearia
                    </label>
                    <input
                      type="text"
                      required
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="Ex: Barbearia Navalha de Ouro"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                        Seu Nome
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Carlos Silva"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                        WhatsApp
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(82) 99999-0000"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@dominio.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {authError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-sm transition flex items-center justify-center gap-2"
              >
                {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {authMode === 'login' ? 'Entrar no Painel' : 'Criar Conta e Acessar Painel'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   1. TELA PÚBLICA DO USUÁRIO (VITRINE + AGENDAMENTO REAL NO SUPABASE)
   ============================================================================ */
function PublicLandingAndBooking({
  tenants,
  services,
  barbers,
  onOpenLogin,
  onOpenRegister,
  onAppointmentCreated,
  notify,
}) {
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activeTenantId = selectedTenantId || tenants[0]?.id || '';
  const tenantServices = services.filter((s) => s.tenant_id === activeTenantId);
  const tenantBarbers = barbers.filter((b) => b.tenant_id === activeTenantId);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!activeTenantId || !selectedServiceId || !date || !time || !clientName || !clientPhone) return;
    setSubmitting(true);
    const srv = tenantServices.find((s) => s.id === selectedServiceId);

    const { error } = await supabase.from('appointments').insert({
      tenant_id: activeTenantId,
      service_id: selectedServiceId,
      barber_id: selectedBarberId || null,
      client_name: clientName,
      client_phone: clientPhone,
      date,
      time,
      price_snapshot: srv?.price || 0,
      status: 'scheduled',
    });

    setSubmitting(false);
    if (error) {
      notify('Erro ao agendar: ' + error.message);
      return;
    }

    setClientName('');
    setClientPhone('');
    setTime('');
    notify('Agendamento confirmado com sucesso!');
    onAppointmentCreated();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4 pb-8">
        <BrandLogo />
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenRegister}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs sm:text-sm font-bold transition"
          >
            Cadastrar Barbearia
          </button>
          <button
            onClick={onOpenLogin}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs sm:text-sm font-bold flex items-center gap-2 transition"
          >
            <Shield className="w-4 h-4" /> Entrar no Painel
          </button>
        </div>
      </header>

      <section className="text-center max-w-2xl mx-auto my-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" /> Plataforma Oficial para Barbearias
        </span>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Sua barbearia no piloto automático, do{' '}
          <span className="text-amber-400">agendamento</span> ao{' '}
          <span className="text-amber-400">comissionamento</span>.
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base mt-4">
          Escolha uma unidade ativa abaixo para agendar seu horário ou cadastre sua barbearia gratuitamente.
        </p>
      </section>

      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 mt-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 mb-4">
          <Store className="w-4 h-4" /> Barbearias Ativas & Agendamento Online
        </h2>

        {tenants.length === 0 ? (
          <p className="text-sm text-zinc-400">
            Nenhuma unidade pública disponível no momento. Clique em <strong>Cadastrar Barbearia</strong> acima para criar a primeira!
          </p>
        ) : (
          <form onSubmit={handleBook} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">1. Escolha a Barbearia</label>
              <select
                value={activeTenantId}
                onChange={(e) => { setSelectedTenantId(e.target.value); setSelectedServiceId(''); setSelectedBarberId(''); }}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">2. Serviço</label>
              <select
                required
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
              >
                <option value="">Selecione um serviço...</option>
                {tenantServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — R$ {Number(s.price).toFixed(2)} ({s.duration} min)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">3. Profissional (Opcional)</label>
              <select
                value={selectedBarberId}
                onChange={(e) => setSelectedBarberId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
              >
                <option value="">Qualquer profissional disponível</option>
                {tenantBarbers.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.role_title})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">4. Data</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Horário</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Seu Nome</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nome completo"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Seu WhatsApp</label>
              <input
                type="text"
                required
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="(82) 99999-9999"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition"
              >
                {submitting ? 'Confirmando horário...' : 'Confirmar Agendamento'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   2. CONSOLE SUPER ADMIN (VOCÊ VISUALIZA E GERENCIA TODAS AS BARBEARIAS)
   ============================================================================ */
function SuperAdminConsole({ tenants, onRefresh, onImpersonate, onLogout, notify }) {
  const toggleStatus = async (tenant) => {
    const nextStatus = tenant.status === 'blocked' ? 'active' : 'blocked';
    await supabase.from('tenants').update({ status: nextStatus }).eq('id', tenant.id);
    notify(`Status de ${tenant.name} alterado para ${nextStatus}.`);
    onRefresh();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="flex items-center justify-between pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <BrandLogo subtitle="Console Master • Super Admin" />
          <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold flex items-center gap-1">
            <Crown className="w-3.5 h-3.5" /> Admin Geral
          </span>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </header>

      <div className="my-6 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-bold text-sm text-white">Barbearias Cadastradas na Plataforma ({tenants.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-400 uppercase">
                <th className="py-3 px-4">Barbearia</th>
                <th className="py-3 px-4">Dono / E-mail</th>
                <th className="py-3 px-4">Plano</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-800/30">
                  <td className="py-3.5 px-4 font-bold text-white">{t.name}</td>
                  <td className="py-3.5 px-4">
                    <p className="text-zinc-200">{t.owner_name}</p>
                    <p className="text-xs text-zinc-500">{t.owner_email}</p>
                  </td>
                  <td className="py-3.5 px-4 uppercase text-xs font-bold text-amber-400">{t.plan_id}</td>
                  <td className="py-3.5 px-4 text-xs font-semibold">{t.status}</td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => onImpersonate(t.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 text-xs font-bold inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Gerenciar Painel
                    </button>
                    <button
                      onClick={() => toggleStatus(t)}
                      className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
                      title="Bloquear / Desbloquear"
                    >
                      {t.status === 'blocked' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   3. PAINEL DO DONO DA BARBEARIA (GESTÃO DA PRÓPRIA UNIDADE)
   ============================================================================ */
function OwnerDashboardShell({ profile, tenant, services, barbers, appointments, onRefresh, onLogout, notify }) {
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newBarberName, setNewBarberName] = useState('');

  if (!tenant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <p className="text-zinc-300 font-semibold mb-4">Nenhuma unidade vinculada a este perfil.</p>
        <button onClick={onLogout} className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-sm">
          Sair
        </button>
      </div>
    );
  }

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice) return;
    await supabase.from('services').insert({
      tenant_id: tenant.id,
      name: newServiceName,
      price: Number(newServicePrice),
      duration: 45,
    });
    setNewServiceName('');
    setNewServicePrice('');
    notify('Serviço adicionado!');
    onRefresh();
  };

  const handleAddBarber = async (e) => {
    e.preventDefault();
    if (!newBarberName) return;
    await supabase.from('barbers').insert({
      tenant_id: tenant.id,
      name: newBarberName,
      role_title: 'Barbeiro',
      commission_percent: 50,
    });
    setNewBarberName('');
    notify('Profissional cadastrado!');
    onRefresh();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <BrandLogo subtitle={`${tenant.name} • Painel de Gestão`} />
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">Olá, {profile?.full_name || tenant.owner_name}</span>
          <button
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        {/* Gestão Rápida de Serviços */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
            <Scissors className="w-4 h-4 text-amber-400" /> Serviços da Barbearia ({services.length})
          </h3>
          <form onSubmit={handleAddService} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Nome do serviço"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
            />
            <input
              type="number"
              placeholder="R$"
              value={newServicePrice}
              onChange={(e) => setNewServicePrice(e.target.value)}
              className="w-24 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
            />
            <button type="submit" className="px-3 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs">
              <Plus className="w-4 h-4" />
            </button>
          </form>
          <ul className="space-y-2 text-xs">
            {services.map((s) => (
              <li key={s.id} className="flex justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <span className="font-semibold text-zinc-200">{s.name}</span>
                <span className="text-amber-400 font-bold">R$ {Number(s.price).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Gestão Rápida de Barbeiros */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" /> Equipe de Barbeiros ({barbers.length})
          </h3>
          <form onSubmit={handleAddBarber} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Nome do barbeiro"
              value={newBarberName}
              onChange={(e) => setNewBarberName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
            />
            <button type="submit" className="px-3 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs">
              <Plus className="w-4 h-4" />
            </button>
          </form>
          <ul className="space-y-2 text-xs">
            {barbers.map((b) => (
              <li key={b.id} className="flex justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <span className="font-semibold text-zinc-200">{b.name}</span>
                <span className="text-zinc-400">Comissão: {b.commission_percent}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Agenda da Unidade */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" /> Agendamentos Recebidos ({appointments.length})
        </h3>
        {appointments.length === 0 ? (
          <p className="text-xs text-zinc-400">Nenhum agendamento registrado ainda.</p>
        ) : (
          <div className="space-y-2 text-xs">
            {appointments.map((a) => (
              <div key={a.id} className="flex flex-wrap justify-between items-center p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div>
                  <p className="font-bold text-white">{a.client_name} <span className="text-zinc-500">({a.client_phone})</span></p>
                  <p className="text-zinc-400 mt-0.5">Data: {a.date} às {a.time}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 font-bold">
                  R$ {Number(a.price_snapshot).toFixed(2)} • {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
