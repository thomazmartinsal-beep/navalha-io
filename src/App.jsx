import React, { useState, useEffect } from 'react';
import {
  Scissors, Calendar, Users, Shield, Crown, CheckCircle2,
  XCircle, Plus, Lock, Unlock, LogOut, ArrowLeft,
  Store, Sparkles, Eye, Loader2, DollarSign, Package,
  Trash2, Edit3, Check, TrendingUp, AlertTriangle, ShoppingBag
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

  const [tenants, setTenants] = useState([]);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [productSales, setProductSales] = useState([]);

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
      const [
        { data: tenantsData },
        { data: servicesData },
        { data: barbersData },
        { data: aptData },
        { data: productsData },
        { data: expensesData },
        { data: salesData },
      ] = await Promise.all([
        supabase.from('tenants').select('*').order('created_at', { ascending: false }),
        supabase.from('services').select('*').eq('active', true).order('name', { ascending: true }),
        supabase.from('barbers').select('*').eq('active', true).order('name', { ascending: true }),
        supabase.from('appointments').select('*').order('date', { ascending: false }),
        supabase.from('products').select('*').eq('active', true).order('name', { ascending: true }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('product_sales').select('*').order('sold_at', { ascending: false }),
      ]);

      setTenants(tenantsData || []);
      setServices(servicesData || []);
      setBarbers(barbersData || []);
      setAppointments(aptData || []);
      setProducts(productsData || []);
      setExpenses(expensesData || []);
      setProductSales(salesData || []);

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

      {authUser && profile?.role === 'super_admin' && !impersonatedTenantId && (
        <SuperAdminConsole
          tenants={tenants}
          onRefresh={() => loadPlatformData(authUser)}
          onImpersonate={(id) => setImpersonatedTenantId(id)}
          onLogout={handleLogout}
          notify={notify}
        />
      )}

      {authUser && (profile?.role === 'owner' || profile?.role === 'barber' || impersonatedTenantId) && (
        <OwnerDashboardShell
          profile={profile}
          tenant={activeTenant}
          services={services.filter((s) => s.tenant_id === activeTenantId)}
          barbers={barbers.filter((b) => b.tenant_id === activeTenantId)}
          appointments={appointments.filter((a) => a.tenant_id === activeTenantId)}
          products={products.filter((p) => p.tenant_id === activeTenantId)}
          expenses={expenses.filter((e) => e.tenant_id === activeTenantId)}
          productSales={productSales.filter((s) => s.tenant_id === activeTenantId)}
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

      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/85 overflow-y-auto flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl my-8">
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
                <span>Entrar no Painel</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   1. TELA PÚBLICA DO USUÁRIO (AGENDAMENTO ONLINE)
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
          <p className="text-sm text-zinc-400">Nenhuma barbearia credenciada disponível no momento.</p>
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
                <span>{submitting ? 'Confirmando horário...' : 'Confirmar Agendamento'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   2. CONSOLE SUPER ADMIN
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
    notify('Barbearia cadastrada com serviços e estoque iniciais!');
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

      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/85 overflow-y-auto flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl my-8">
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
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Nome da Barbearia</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Ex: Barbearia Dom Pedro"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Nome do Proprietário</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="João Silva"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="(82) 99999-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Plano Contratado</label>
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                >
                  <option value="starter">Starter (1 Cadeira)</option>
                  <option value="pro">Pro (Equipe Completa)</option>
                  <option value="enterprise">Enterprise (Multi-unidades)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">E-mail de Login do Dono</label>
                <input
                  type="email"
                  required
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="dono@barbearia.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Senha Inicial de Acesso</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
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
                <span>{creating ? 'Criando Barbearia...' : 'Cadastrar Barbearia e Gerar Acesso'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   3. PAINEL COMPLETO DO DONO DA BARBEARIA (5 MÓDULOS INTEGRADOS)
   ============================================================================ */
function OwnerDashboardShell({
  profile,
  tenant,
  services,
  barbers,
  appointments,
  products,
  expenses,
  productSales,
  onRefresh,
  onLogout,
  notify,
}) {
  const [activeTab, setActiveTab] = useState('agenda'); // 'agenda' | 'servicos' | 'barbeiros' | 'financeiro' | 'estoque'

  // Estados de Serviços
  const [srvName, setSrvName] = useState('');
  const [srvPrice, setSrvPrice] = useState('');
  const [srvDuration, setSrvDuration] = useState('40');
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  // Estados de Barbeiros
  const [barberName, setBarberName] = useState('');
  const [barberRole, setBarberRole] = useState('Barbeiro Sênior');
  const [barberCommission, setBarberCommission] = useState('50');

  // Estados de Financeiro
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [expDesc, setExpDesc] = useState('');
  const [expCategory, setExpCategory] = useState('Aluguel / Contas');
  const [expAmount, setExpAmount] = useState('');

  // Estados de Estoque
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Finalizadores');
  const [prodCost, setProdCost] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodQty, setProdQty] = useState('');

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

  // --- AÇÕES DE AGENDA ---
  const updateAppointmentStatus = async (aptId, nextStatus) => {
    await supabase.from('appointments').update({ status: nextStatus }).eq('id', aptId);
    notify(nextStatus === 'completed' ? 'Atendimento concluído e lançado no caixa!' : 'Agendamento cancelado.');
    onRefresh();
  };

  // --- AÇÕES DE SERVIÇOS ---
  const handleAddService = async (e) => {
    e.preventDefault();
    if (!srvName || !srvPrice) return;
    await supabase.from('services').insert({
      tenant_id: tenant.id,
      name: srvName.trim(),
      price: Number(srvPrice),
      duration: Number(srvDuration) || 40,
      active: true,
    });
    setSrvName('');
    setSrvPrice('');
    notify('Serviço cadastrado!');
    onRefresh();
  };

  const handleSaveServicePrice = async (id) => {
    if (!editPrice) return;
    await supabase.from('services').update({ price: Number(editPrice) }).eq('id', id);
    setEditingServiceId(null);
    notify('Valor atualizado!');
    onRefresh();
  };

  const handleDeleteService = async (id) => {
    await supabase.from('services').update({ active: false }).eq('id', id);
    notify('Serviço removido.');
    onRefresh();
  };

  const handleSeedDefaultServices = async () => {
    const defaults = [
      { name: 'Corte Degradê / Social', price: 45, duration: 40 },
      { name: 'Barba Completa (Toalha Quente)', price: 35, duration: 30 },
      { name: 'Combo Corte + Barba', price: 70, duration: 60 },
      { name: 'Sobrancelha na Navalha', price: 15, duration: 15 },
      { name: 'Pezinho / Acabamento', price: 20, duration: 15 },
      { name: 'Hidratação & Ozonioterapia', price: 50, duration: 35 },
    ];
    const toInsert = defaults
      .filter((d) => !services.some((s) => s.name.toLowerCase() === d.name.toLowerCase()))
      .map((d) => ({ ...d, tenant_id: tenant.id, active: true }));

    if (toInsert.length === 0) {
      notify('Os serviços principais já estão cadastrados.');
      return;
    }
    await supabase.from('services').insert(toInsert);
    notify(`${toInsert.length} serviços padrão adicionados!`);
    onRefresh();
  };

  // --- AÇÕES DE BARBEIROS ---
  const handleAddBarber = async (e) => {
    e.preventDefault();
    if (!barberName) return;
    await supabase.from('barbers').insert({
      tenant_id: tenant.id,
      name: barberName.trim(),
      role_title: barberRole.trim() || 'Barbeiro',
      commission_percent: Number(barberCommission) || 50,
      active: true,
    });
    setBarberName('');
    notify('Barbeiro adicionado à equipe!');
    onRefresh();
  };

  const handleDeleteBarber = async (id) => {
    await supabase.from('barbers').update({ active: false }).eq('id', id);
    notify('Profissional removido.');
    onRefresh();
  };

  // --- AÇÕES DE FINANCEIRO ---
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expDesc || !expAmount) return;
    await supabase.from('expenses').insert({
      tenant_id: tenant.id,
      description: expDesc.trim(),
      category: expCategory,
      amount: Number(expAmount),
      date: `${selectedMonth}-15`,
    });
    setExpDesc('');
    setExpAmount('');
    notify('Despesa registrada no mês!');
    onRefresh();
  };

  const handleDeleteExpense = async (id) => {
    await supabase.from('expenses').delete().eq('id', id);
    notify('Despesa excluída.');
    onRefresh();
  };

  // --- AÇÕES DE ESTOQUE ---
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!prodName || !prodPrice) return;
    await supabase.from('products').insert({
      tenant_id: tenant.id,
      name: prodName.trim(),
      category: prodCategory,
      cost_price: Number(prodCost) || 0,
      sale_price: Number(prodPrice),
      stock_qty: Number(prodQty) || 0,
      min_stock: 3,
      active: true,
    });
    setProdName('');
    setProdCost('');
    setProdPrice('');
    setProdQty('');
    notify('Produto cadastrado no estoque!');
    onRefresh();
  };

  const handleAdjustStock = async (prod, delta) => {
    const nextQty = Math.max(0, prod.stock_qty + delta);
    await supabase.from('products').update({ stock_qty: nextQty }).eq('id', prod.id);
    onRefresh();
  };

  const handleSellProduct = async (prod) => {
    if (prod.stock_qty <= 0) {
      notify('Produto sem saldo em estoque.');
      return;
    }
    await Promise.all([
      supabase.from('products').update({ stock_qty: prod.stock_qty - 1 }).eq('id', prod.id),
      supabase.from('product_sales').insert({
        tenant_id: tenant.id,
        product_id: prod.id,
        product_name: prod.name,
        quantity: 1,
        unit_price: prod.sale_price,
        total_amount: prod.sale_price,
        sold_at: new Date().toISOString().slice(0, 10),
      }),
    ]);
    notify(`Venda registrada: ${prod.name} (+R$ ${Number(prod.sale_price).toFixed(2)})`);
    onRefresh();
  };

  const handleDeleteProduct = async (id) => {
    await supabase.from('products').update({ active: false }).eq('id', id);
    notify('Produto removido.');
    onRefresh();
  };

  // --- CÁLCULOS DO FINANCEIRO MENSAL ---
  const monthCompletedApts = appointments.filter(
    (a) => a.status === 'completed' && a.date?.startsWith(selectedMonth)
  );
  const monthScheduledApts = appointments.filter(
    (a) => a.status === 'scheduled' && a.date?.startsWith(selectedMonth)
  );
  const monthSales = productSales.filter((s) => s.sold_at?.startsWith(selectedMonth));
  const monthExpenses = expenses.filter((e) => e.date?.startsWith(selectedMonth));

  const servicesRevenue = monthCompletedApts.reduce((acc, a) => acc + Number(a.price_snapshot || 0), 0);
  const projectedRevenue = monthScheduledApts.reduce((acc, a) => acc + Number(a.price_snapshot || 0), 0);
  const productsRevenue = monthSales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
  const grossRevenue = servicesRevenue + productsRevenue;

  const barberCommissions = barbers.map((b) => {
    const bApts = monthCompletedApts.filter((a) => a.barber_id === b.id);
    const totalGenerated = bApts.reduce((acc, a) => acc + Number(a.price_snapshot || 0), 0);
    const commissionDue = totalGenerated * (Number(b.commission_percent || 0) / 100);
    return { ...b, count: bApts.length, totalGenerated, commissionDue };
  });

  const totalCommissions = barberCommissions.reduce((acc, b) => acc + b.commissionDue, 0);
  const totalExpenses = monthExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const netProfit = grossRevenue - totalCommissions - totalExpenses;

  const totalStockItems = products.reduce((acc, p) => acc + Number(p.stock_qty || 0), 0);
  const totalStockValue = products.reduce((acc, p) => acc + Number(p.stock_qty || 0) * Number(p.sale_price || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <BrandLogo subtitle={`${tenant.name} • Painel de Gestão`} />
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">Olá, {profile?.full_name || tenant.owner_name}</span>
          <button
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold flex items-center gap-1.5 hover:border-zinc-700"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>

      {/* MENU DE NAVEGAÇÃO DO DONO */}
      <nav className="flex flex-wrap gap-2 my-6">
        {[
          { id: 'agenda', label: `Agenda (${appointments.length})`, icon: Calendar },
          { id: 'servicos', label: `Serviços (${services.length})`, icon: Scissors },
          { id: 'barbeiros', label: `Barbeiros (${barbers.length})`, icon: Users },
          { id: 'financeiro', label: 'Financeiro Mensal', icon: DollarSign },
          { id: 'estoque', label: `Estoque (${products.length})`, icon: Package },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                active
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/15'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* =====================================================================
          ABA 1: AGENDA E CONCILIAÇÃO DE ATENDIMENTOS
         ===================================================================== */}
      {activeTab === 'agenda' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" /> Agendamentos da Barbearia
            </h2>
            <span className="text-xs text-zinc-400">
              Clique em <strong>Concluir</strong> após o corte para somar no rendimento mensal
            </span>
          </div>

          {appointments.length === 0 ? (
            <p className="text-sm text-zinc-400 py-6 text-center">Nenhum agendamento registrado ainda.</p>
          ) : (
            <div className="space-y-2.5">
              {appointments.map((a) => {
                const srv = services.find((s) => s.id === a.service_id);
                const brb = barbers.find((b) => b.id === a.barber_id);
                return (
                  <div
                    key={a.id}
                    className="flex flex-wrap justify-between items-center gap-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800"
                  >
                    <div>
                      <p className="font-bold text-sm text-white">
                        {a.client_name}{' '}
                        <span className="text-xs font-normal text-zinc-500">• {a.client_phone}</span>
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {srv?.name || 'Serviço'} {brb ? `• Profissional: ${brb.name}` : ''} •{' '}
                        <strong className="text-zinc-200">{a.date} às {a.time}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400 text-xs font-bold">
                        R$ {Number(a.price_snapshot).toFixed(2)}
                      </span>

                      {a.status === 'scheduled' ? (
                        <>
                          <button
                            onClick={() => updateAppointmentStatus(a.id, 'completed')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30"
                          >
                            Concluir
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(a.id, 'cancelled')}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 text-xs font-bold hover:bg-rose-500/25"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            a.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          {a.status === 'completed' ? 'Concluído' : 'Cancelado'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          ABA 2: GERENCIAMENTO DE SERVIÇOS (PRÉ-CADASTRADOS + CRUD)
         ===================================================================== */}
      {activeTab === 'servicos' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-400" /> Catálogo de Serviços
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Edite os valores dos serviços principais ou adicione novos pacotes
              </p>
            </div>
            <button
              type="button"
              onClick={handleSeedDefaultServices}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-bold"
            >
              + Restaurar Serviços Padrão
            </button>
          </div>

          <form onSubmit={handleAddService} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mb-5">
            <input
              type="text"
              required
              placeholder="Nome do serviço (ex: Corte Navalhado)"
              value={srvName}
              onChange={(e) => setSrvName(e.target.value)}
              className="sm:col-span-2 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
            />
            <input
              type="number"
              step="0.01"
              required
              placeholder="Preço (R$)"
              value={srvPrice}
              onChange={(e) => setSrvPrice(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={srvDuration}
                onChange={(e) => setSrvDuration(e.target.value)}
                className="w-20 px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </div>
          </form>

          <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden">
            {services.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-zinc-950">
                <div>
                  <p className="font-bold text-sm text-white">{s.name}</p>
                  <p className="text-xs text-zinc-500">Duração estimada: {s.duration} min</p>
                </div>

                <div className="flex items-center gap-2">
                  {editingServiceId === s.id ? (
                    <>
                      <input
                        type="number"
                        step="0.01"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-24 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-amber-500 text-xs text-white"
                      />
                      <button
                        onClick={() => handleSaveServicePrice(s.id)}
                        className="p-1.5 rounded-lg bg-emerald-500 text-zinc-950"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-black text-amber-400 mr-2">
                        R$ {Number(s.price).toFixed(2)}
                      </span>
                      <button
                        onClick={() => { setEditingServiceId(s.id); setEditPrice(s.price); }}
                        className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white"
                        title="Editar preço"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(s.id)}
                        className="p-1.5 rounded-lg bg-zinc-900 text-rose-400 hover:bg-rose-500/20"
                        title="Remover serviço"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          ABA 3: GERENCIAMENTO DE BARBEIROS & COMISSÕES
         ===================================================================== */}
      {activeTab === 'barbeiros' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="font-bold text-base text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" /> Equipe de Profissionais & Percentual de Comissão
          </h2>

          <form onSubmit={handleAddBarber} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mb-5">
            <input
              type="text"
              required
              placeholder="Nome do barbeiro"
              value={barberName}
              onChange={(e) => setBarberName(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
            />
            <input
              type="text"
              placeholder="Especialidade (ex: Barbeiro Sênior)"
              value={barberRole}
              onChange={(e) => setBarberRole(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
            />
            <input
              type="number"
              min="0"
              max="100"
              required
              placeholder="Comissão (%)"
              value={barberCommission}
              onChange={(e) => setBarberCommission(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
            />
            <button
              type="submit"
              className="py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Cadastrar Barbeiro
            </button>
          </form>

          {barbers.length === 0 ? (
            <p className="text-sm text-zinc-400 py-6 text-center">
              Nenhum barbeiro cadastrado. Adicione os profissionais acima para liberar a escolha no agendamento.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {barbers.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800"
                >
                  <div>
                    <p className="font-bold text-sm text-white">{b.name}</p>
                    <p className="text-xs text-zinc-400">{b.role_title}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[11px] font-bold">
                      Comissão: {b.commission_percent}%
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteBarber(b.id)}
                    className="p-2 rounded-lg bg-zinc-900 text-rose-400 hover:bg-rose-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          ABA 4: FINANCEIRO & CÁLCULO DE RENDIMENTO MENSAL
         ===================================================================== */}
      {activeTab === 'financeiro' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" /> Fechamento e Rendimento Mensal
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Mês de Referência:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
            </div>
          </div>

          {/* CARDS DE RESUMO DO MÊS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <p className="text-xs text-zinc-400">Faturamento Bruto ({selectedMonth})</p>
              <p className="text-2xl font-black text-white mt-1">R$ {grossRevenue.toFixed(2)}</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Serviços: R$ {servicesRevenue.toFixed(2)} • Produtos: R$ {productsRevenue.toFixed(2)}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <p className="text-xs text-zinc-400">Comissões da Equipe</p>
              <p className="text-2xl font-black text-amber-400 mt-1">- R$ {totalCommissions.toFixed(2)}</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Sobre {monthCompletedApts.length} atendimentos concluídos
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <p className="text-xs text-zinc-400">Despesas Operacionais</p>
              <p className="text-2xl font-black text-rose-400 mt-1">- R$ {totalExpenses.toFixed(2)}</p>
              <p className="text-[11px] text-zinc-500 mt-1">{monthExpenses.length} lançamentos de custo</p>
            </div>

            <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-4">
              <p className="text-xs text-emerald-400 font-semibold">Rendimento Líquido da Barbearia</p>
              <p className={`text-2xl font-black mt-1 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                R$ {netProfit.toFixed(2)}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Previsto em agenda aberta: +R$ {projectedRevenue.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* REPASSE POR BARBEIRO */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h3 className="font-bold text-sm text-white mb-3">Comissões por Barbeiro no Mês</h3>
              {barberCommissions.length === 0 ? (
                <p className="text-xs text-zinc-400">Nenhum barbeiro cadastrado.</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {barberCommissions.map((b) => (
                    <div key={b.id} className="flex justify-between items-center p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                      <div>
                        <p className="font-bold text-white">{b.name} ({b.commission_percent}%)</p>
                        <p className="text-zinc-500">{b.count} cortes • Produziu R$ {b.totalGenerated.toFixed(2)}</p>
                      </div>
                      <span className="font-black text-amber-400">R$ {b.commissionDue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LANÇAMENTO DE DESPESAS DO MÊS */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h3 className="font-bold text-sm text-white mb-3">Custos e Despesas do Mês</h3>
              <form onSubmit={handleAddExpense} className="flex flex-wrap gap-2 mb-4">
                <input
                  type="text"
                  required
                  placeholder="Descrição (ex: Aluguel, Energia, Lâminas)"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="flex-1 min-w-[160px] px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                />
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Valor R$"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-28 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                />
                <button type="submit" className="px-3.5 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs">
                  Lançar
                </button>
              </form>

              <div className="space-y-2 text-xs">
                {monthExpenses.map((e) => (
                  <div key={e.id} className="flex justify-between items-center p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-200 font-semibold">{e.description}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400 font-bold">- R$ {Number(e.amount).toFixed(2)}</span>
                      <button onClick={() => handleDeleteExpense(e.id)} className="text-zinc-500 hover:text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          ABA 5: ESTOQUE DE PRODUTOS PARA VENDA
         ===================================================================== */}
      {activeTab === 'estoque' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" /> Estoque de Produtos para Venda
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {totalStockItems} itens em estoque • Valor potencial de revenda: R$ {totalStockValue.toFixed(2)}
              </p>
            </div>
          </div>

          <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 mb-5">
            <input
              type="text"
              required
              placeholder="Produto (ex: Pomada Matte)"
              value={prodName}
              onChange={(e) => setProdName(e.target.value)}
              className="sm:col-span-2 px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Custo (R$)"
              value={prodCost}
              onChange={(e) => setProdCost(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
            />
            <input
              type="number"
              step="0.01"
              required
              placeholder="Venda (R$)"
              value={prodPrice}
              onChange={(e) => setProdPrice(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
            />
            <div className="flex gap-2">
              <input
                type="number"
                required
                placeholder="Qtd"
                value={prodQty}
                onChange={(e) => setProdQty(e.target.value)}
                className="w-20 px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Salvar
              </button>
            </div>
          </form>

          <div className="overflow-x-auto border border-zinc-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase">
                <tr>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4">Custo / Venda</th>
                  <th className="py-3 px-4">Saldo em Estoque</th>
                  <th className="py-3 px-4 text-right">Movimentação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-950/60">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-4">
                      <p className="font-bold text-white text-sm">{p.name}</p>
                      {p.stock_qty <= p.min_stock && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 mt-0.5">
                          <AlertTriangle className="w-3 h-3" /> Estoque baixo
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-zinc-500">Custo: R$ {Number(p.cost_price).toFixed(2)}</p>
                      <p className="text-amber-400 font-bold">Venda: R$ {Number(p.sale_price).toFixed(2)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
                        <button
                          onClick={() => handleAdjustStock(p, -1)}
                          className="px-1.5 text-zinc-400 hover:text-white font-bold"
                        >
                          -
                        </button>
                        <span className="font-black text-white min-w-[20px] text-center">{p.stock_qty}</span>
                        <button
                          onClick={() => handleAdjustStock(p, 1)}
                          className="px-1.5 text-zinc-400 hover:text-white font-bold"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleSellProduct(p)}
                        disabled={p.stock_qty <= 0}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold inline-flex items-center gap-1 disabled:opacity-40"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Vender 1 un.
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 rounded-lg bg-zinc-900 text-rose-400 hover:bg-rose-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
