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

  // Modal de Login (restrito a contas já criadas por você)
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [toast, setToast] = useState(null);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

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
      setShowLoginModal(false);
      setEmail('');
      setPassword('');
      notify('Acesso realizado com sucesso!');
    } catch (err) {
      setAuthError(err.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : err.message);
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

      {/* ROTA 1: VITRINE PÚBLICA E AGENDAMENTO (Sem auto-cadastro aberto) */}
      {!authUser && (
        <PublicLandingAndBooking
          tenants={tenants.filter((t) => t.status !== 'blocked')}
          services={services}
          barbers={barbers}
          onOpenLogin={() => { setAuthError(''); setShowLoginModal(true); }}
          onAppointmentCreated={() => loadPlatformData(null)}
          notify={notify}
        />
      )}

      {/* ROTA 2: CONSOLE SUPER ADMIN (Único local onde novas barbearias são criadas) */}
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

      {authUser && !profile && !impersonatedTenantId && (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
          <p className="text-zinc-300 font-semibold mb-4">Carregando permissões da conta...</p>
          <button onClick={handleLogout} className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-sm">
            Sair e tentar novamente
          </button>
        </div>
      )}

      {/* MODAL APENAS DE LOGIN (Sem opção de criar conta pública) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <BrandLogo subtitle="Acesso Restrito • Parceiros e Admin" />
              <button
                onClick={() => setShowLoginModal(false)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                  E-mail de Acesso
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                Entrar no Painel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   1. TELA PÚBLICA DO USUÁRIO (AGENDAMENTO ONLINE + BOTÃO DE LOGIN PARCEIRO)
   ============================================================================ */
function PublicLandingAndBooking({
  tenants,
  services,
  barbers,
  onOpenLogin,
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
        <button
          onClick={onOpenLogin}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs sm:text-sm font-bold flex items-center gap-2 transition"
        >
          <Shield className="w-4 h-4" /> Entrar no Painel
        </button>
      </header>

      <section className="text-center max-w-2xl mx-auto my-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" /> Plataforma Oficial para Barbearias
        </span>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Agende seu horário nas melhores{' '}
          <span className="text-amber-400">barbearias</span> em segundos.
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base mt-4">
          Escolha a unidade credenciada abaixo, selecione o serviço e garanta seu atendimento sem filas.
        </p>
      </section>

      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 mt-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 mb-4">
          <Store className="w-4 h-4" /> Barbearias Credenciadas & Agendamento Online
        </h2>

        {tenants.length === 0 ? (
          <p className="text-sm text-zinc-400">
            Nenhuma barbearia credenciada disponível no momento.
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
   2. CONSOLE SUPER ADMIN (CADASTRO EXCLUSIVO DE BARBEARIAS POR VOCÊ)
   ============================================================================ */
function SuperAdminConsole({ tenants, onRefresh, onImpersonate, onLogout, notify }) {
  const [showNewModal, setShowNewModal] = useState(false);
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [planId, setPlanId] = useState('pro');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const handleCreateBarbershop = async (e) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);

    const { error } = await supabase.rpc('admin_create_barbershop', {
      p_shop_name: shopName,
      p_owner_name: ownerName,
      p_owner_email: ownerEmail,
      p_owner_phone: ownerPhone,
      p_password: ownerPassword,
      p_plan_id: planId,
    });

    setCreating(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setShowNewModal(false);
    setShopName('');
    setOwnerName('');
    setOwnerEmail('');
    setOwnerPhone('');
    setOwnerPassword('');
    notify('Barbearia e acesso do proprietário criados com sucesso!');
    onRefresh();
  };

  const toggleStatus = async (tenant) => {
    const nextStatus = tenant.status === 'blocked' ? 'active' : 'blocked';
    await supabase.from('tenants').update({ status: nextStatus }).eq('id', tenant.id);
    notify(`Status de ${tenant.name} alterado para ${nextStatus}.`);
    onRefresh();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <BrandLogo subtitle="Console Master • Super Admin" />
          <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold flex items-center gap-1">
            <Crown className="w-3.5 h-3.5" /> Admin Geral
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { setFormError(''); setShowNewModal(true); }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" /> Nova Barbearia
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>

      <div className="my-6 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-bold text-sm text-white">Barbearias Credenciadas ({tenants.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-400 uppercase">
                <th className="py-3 px-4">Barbearia</th>
                <th className="py-3 px-4">Dono / E-mail de Acesso</th>
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

      {/* MODAL DE CADASTRO DE BARBEARIA PELO SUPER ADMIN */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <BrandLogo subtitle="Cadastrar Nova Unidade e Acesso" />
              <button
                onClick={() => setShowNewModal(false)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBarbershop} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                  Nome da Barbearia
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Ex: Barbearia Dom Pedro"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                    Nome do Proprietário
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="João Silva"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="(82) 99999-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                  Plano Contratado
                </label>
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="starter">Starter (1 Cadeira)</option>
                  <option value="pro">Pro (Equipe Completa)</option>
                  <option value="enterprise">Enterprise (Multi-unidades)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                  E-mail de Login do Dono
                </label>
                <input
                  type="email"
                  required
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="dono@barbearia.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                  Senha Inicial de Acesso
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {formError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-sm transition flex items-center justify-center gap-2"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                {creating ? 'Criando Barbearia...' : 'Cadastrar Barbearia e Gerar Acesso'}
              </button>
            </form>
          </div>
        </div>
      )}
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
