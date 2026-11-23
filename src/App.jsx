import React, { useState, useEffect } from 'react';
import {
  Scissors, Calendar, Users, Shield, Crown, CheckCircle2,
  XCircle, Plus, Lock, Unlock, LogOut, ArrowLeft,
  Store, Sparkles, Eye, Loader2, DollarSign, Package,
  Trash2, Edit3, Check, TrendingUp, AlertTriangle, ShoppingBag,
  Link2, ExternalLink, Copy, Clock, Phone, UserCheck, Award,
  BarChart3, SlidersHorizontal, ChevronRight
} from 'lucide-react';
import { supabase } from './supabaseClient';

const BrandLogo = ({ title = 'NAVALHA', badge = '.IO', subtitle = 'Gestão & Agendamento Inteligente' }) => (
  <div className="flex items-center gap-3 select-none">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25 text-zinc-950 font-black ring-1 ring-amber-300/40">
      <Scissors className="w-5 h-5" />
    </div>
    <div>
      <div className="flex items-center gap-1.5">
        <span className="text-lg font-black tracking-tight text-white uppercase">{title}</span>
        {badge && (
          <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
            {badge}
          </span>
        )}
      </div>
      <p className="text-[11px] text-zinc-400 leading-none mt-1">{subtitle}</p>
    </div>
  </div>
);

const TIME_SLOTS = [
  '09:00', '09:40', '10:20', '11:00', '11:40',
  '13:30', '14:10', '14:50', '15:30', '16:10',
  '16:50', '17:30', '18:10', '18:50', '19:30'
];

export default function App() {
  const [loadingApp, setLoadingApp] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [impersonatedTenantId, setImpersonatedTenantId] = useState(null);

  const [publicSlug, setPublicSlug] = useState(() => {
    const path = window.location.pathname;
    if (path.startsWith('/b/')) {
      return decodeURIComponent(path.replace('/b/', '').replace(/\/$/, ''));
    }
    return null;
  });

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

  const copyBookingLink = (slug) => {
    const url = `${window.location.origin}/b/${slug}`;
    navigator.clipboard.writeText(url);
    notify(`Link exclusivo copiado: ${url}`);
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
    const handlePopState = () => {
      const path = window.location.pathname;
      setPublicSlug(path.startsWith('/b/') ? decodeURIComponent(path.replace('/b/', '').replace(/\/$/, '')) : null);
    };
    window.addEventListener('popstate', handlePopState);

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

    return () => {
      window.removeEventListener('popstate', handlePopState);
      listener.subscription.unsubscribe();
    };
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
      if (publicSlug) {
        window.history.pushState({}, '', '/');
        setPublicSlug(null);
      }
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
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Carregando sistema...</span>
      </div>
    );
  }

  // ROTA EXCLUSIVA DO CLIENTE FINAL: /b/slug-da-barbearia
  if (publicSlug) {
    const shop = tenants.find((t) => t.slug === publicSlug && t.status !== 'blocked');
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans relative overflow-x-hidden">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-zinc-950 to-zinc-950" />
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-zinc-900/95 backdrop-blur border border-amber-500/40 shadow-2xl text-sm font-medium text-white">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toast}</span>
          </div>
        )}
        <div className="relative z-10">
          <DedicatedShopBookingPage
            shop={shop}
            services={shop ? services.filter((s) => s.tenant_id === shop.id) : []}
            barbers={shop ? barbers.filter((b) => b.tenant_id === shop.id) : []}
            existingAppointments={shop ? appointments.filter((a) => a.tenant_id === shop.id && a.status !== 'cancelled') : []}
            onAppointmentCreated={() => loadPlatformData(authUser)}
            notify={notify}
          />
        </div>
      </div>
    );
  }

  const activeTenantId = impersonatedTenantId || profile?.tenant_id;
  const activeTenant = tenants.find((t) => t.id === activeTenantId);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-zinc-950 to-zinc-950" />

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-zinc-900/95 backdrop-blur border border-amber-500/40 shadow-2xl text-sm font-medium text-white">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {impersonatedTenantId && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 px-4 py-2.5 text-xs font-extrabold flex items-center justify-between sticky top-0 z-50 shadow-lg">
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            MODO SUPER ADMIN — Gerenciando: {activeTenant?.name}
          </span>
          <button
            onClick={() => setImpersonatedTenantId(null)}
            className="px-3 py-1 rounded-lg bg-zinc-950 text-amber-400 flex items-center gap-1 hover:bg-zinc-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Console Master
          </button>
        </div>
      )}

      <div className="relative z-10">
        {!authUser && (
          <PlatformHomePortal onOpenLogin={() => { setAuthError(''); setShowLoginModal(true); }} />
        )}

        {authUser && profile?.role === 'super_admin' && !impersonatedTenantId && (
          <SuperAdminConsole
            tenants={tenants}
            onRefresh={() => loadPlatformData(authUser)}
            onImpersonate={(id) => setImpersonatedTenantId(id)}
            onCopyLink={copyBookingLink}
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
            onCopyLink={() => activeTenant && copyBookingLink(activeTenant.slug)}
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
      </div>

      {/* MODAL DE LOGIN */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-7 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <BrandLogo subtitle="Acesso Restrito • Parceiros e Admin" />
              <button
                onClick={() => setShowLoginModal(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@dominio.com"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {authError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 text-zinc-950 font-black text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
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
   1. PÁGINA EXCLUSIVA DE AGENDAMENTO DA BARBEARIA (/b/slug)
   Design Mobile-First com Cartões de Serviço, Avatares de Barbeiros e Slots
   ============================================================================ */
function DedicatedShopBookingPage({ shop, services, barbers, existingAppointments, onAppointmentCreated, notify }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 mb-4 shadow-xl">
          <Store className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-white">Barbearia não encontrada</h1>
        <p className="text-sm text-zinc-400 max-w-md mt-2">
          O link acessado não corresponde a nenhuma unidade ativa. Solicite o link oficial diretamente à barbearia.
        </p>
      </div>
    );
  }

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);

  // Verifica horários já ocupados na data escolhida (para o barbeiro selecionado ou geral se só houver 1)
  const bookedTimesOnDate = existingAppointments
    .filter((a) => a.date === date && (!selectedBarberId || a.barber_id === selectedBarberId))
    .map((a) => a.time?.slice(0, 5));

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedServiceId || !date || !time || !clientName || !clientPhone) return;
    setSubmitting(true);

    const { error } = await supabase.from('appointments').insert({
      tenant_id: shop.id,
      service_id: selectedServiceId,
      barber_id: selectedBarberId || null,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      date,
      time,
      price_snapshot: selectedService?.price || 0,
      status: 'scheduled',
    });

    setSubmitting(false);
    if (error) {
      notify('Erro ao agendar: ' + error.message);
      return;
    }

    setBookingConfirmed({
      serviceName: selectedService?.name,
      barberName: selectedBarber?.name || 'Primeiro profissional disponível',
      price: selectedService?.price,
      date,
      time,
      clientName,
    });
    setClientName('');
    setClientPhone('');
    setTime('');
    onAppointmentCreated();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
      {/* Banner Superior Exclusivo da Barbearia */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/90 rounded-3xl p-6 mb-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <BrandLogo
            title={shop.name}
            badge="AGENDAMENTO"
            subtitle="Reserva Online • Confirmação Imediata"
          />
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Agenda Aberta
            </span>
          </div>
        </div>

        {shop.owner_phone && (
          <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center gap-4 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" /> {shop.owner_phone}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Sem taxa de reserva
            </span>
          </div>
        )}
      </div>

      {bookingConfirmed ? (
        <div className="bg-zinc-900 border border-emerald-500/30 rounded-3xl p-7 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Horário Confirmado!</h2>
          <p className="text-sm text-zinc-400 mt-1.5">
            Tudo certo, <strong className="text-white">{bookingConfirmed.clientName}</strong>. Te esperamos na{' '}
            <strong className="text-amber-400">{shop.name}</strong>.
          </p>

          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 my-6 text-left text-xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Serviço escolhido</span>
              <span className="font-bold text-white text-sm">{bookingConfirmed.serviceName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Profissional</span>
              <span className="font-bold text-white">{bookingConfirmed.barberName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Data e Horário</span>
              <span className="font-bold text-amber-400">{bookingConfirmed.date} às {bookingConfirmed.time}</span>
            </div>
            <div className="pt-2.5 border-t border-zinc-800/80 flex justify-between items-center">
              <span className="text-zinc-400">Valor no local</span>
              <span className="font-black text-emerald-400 text-base">R$ {Number(bookingConfirmed.price).toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => setBookingConfirmed(null)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition"
          >
            Realizar Outro Agendamento
          </button>
        </div>
      ) : (
        <form onSubmit={handleBook} className="space-y-6">
          {/* ETAPA 1: SERVIÇOS */}
          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-6 h-6 rounded-lg bg-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center">
                1
              </span>
              <h2 className="font-black text-sm uppercase tracking-wider text-white">Escolha o Serviço</h2>
            </div>

            {services.length === 0 ? (
              <p className="text-xs text-zinc-500">Nenhum serviço disponível no momento.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((s) => {
                  const selected = selectedServiceId === s.id;
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setSelectedServiceId(s.id)}
                      className={`p-4 rounded-2xl border text-left transition-all relative ${
                        selected
                          ? 'bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/10'
                          : 'bg-zinc-950/90 border-zinc-800/90 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`font-bold text-sm ${selected ? 'text-white' : 'text-zinc-200'}`}>
                          {s.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-black shrink-0">
                          R$ {Number(s.price).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2.5 text-[11px] text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {s.duration} min
                        </span>
                        {selected && <span className="text-amber-400 font-bold">Selecionado ✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ETAPA 2: PROFISSIONAL */}
          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-6 h-6 rounded-lg bg-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center">
                2
              </span>
              <h2 className="font-black text-sm uppercase tracking-wider text-white">Escolha o Profissional</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setSelectedBarberId(''); setTime(''); }}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 text-left transition ${
                  selectedBarberId === ''
                    ? 'bg-amber-500/15 border-amber-500 text-white'
                    : 'bg-zinc-950/90 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-amber-400 font-black text-xs shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-white">Sem preferência</p>
                  <p className="text-[11px] text-zinc-500">Primeiro barbeiro livre</p>
                </div>
              </button>

              {barbers.map((b) => {
                const selected = selectedBarberId === b.id;
                const initials = b.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                return (
                  <button
                    type="button"
                    key={b.id}
                    onClick={() => { setSelectedBarberId(b.id); setTime(''); }}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 text-left transition ${
                      selected
                        ? 'bg-amber-500/15 border-amber-500 text-white'
                        : 'bg-zinc-950/90 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 flex items-center justify-center font-black text-xs shrink-0">
                      {initials}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">{b.name}</p>
                      <p className="text-[11px] text-zinc-400">{b.role_title}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ETAPA 3: DATA E GRADE DE HORÁRIOS */}
          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center">
                  3
                </span>
                <h2 className="font-black text-sm uppercase tracking-wider text-white">Data e Horário</h2>
              </div>
              <input
                type="date"
                required
                min={todayStr}
                value={date}
                onChange={(e) => { setDate(e.target.value); setTime(''); }}
                className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isBooked = bookedTimesOnDate.includes(slot);
                const isSelected = time === slot;
                return (
                  <button
                    type="button"
                    key={slot}
                    disabled={isBooked}
                    onClick={() => setTime(slot)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                      isBooked
                        ? 'bg-zinc-950/40 border-zinc-900 text-zinc-600 line-through cursor-not-allowed'
                        : isSelected
                        ? 'bg-amber-500 border-amber-400 text-zinc-950 font-black shadow-md shadow-amber-500/20'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-200 hover:border-amber-500/50'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ETAPA 4: SEUS DADOS E CONFIRMAÇÃO */}
          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-6 h-6 rounded-lg bg-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center">
                4
              </span>
              <h2 className="font-black text-sm uppercase tracking-wider text-white">Seus Dados</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Seu Nome</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Como gostaria de ser chamado"
                  className="w-full px-3.5 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">WhatsApp</label>
                <input
                  type="text"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(82) 99999-9999"
                  className="w-full px-3.5 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {selectedService && (
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 mb-4 flex items-center justify-between text-xs">
                <div>
                  <p className="text-zinc-400">Resumo do agendamento:</p>
                  <p className="font-bold text-white mt-0.5">
                    {selectedService.name} {time ? `• ${date} às ${time}` : ''}
                  </p>
                </div>
                <span className="text-base font-black text-amber-400">
                  R$ {Number(selectedService.price).toFixed(2)}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !selectedServiceId || !time}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 text-zinc-950 font-black text-sm transition shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <span>{submitting ? 'Confirmando reserva...' : 'Confirmar Agendamento'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      <footer className="text-center text-[11px] text-zinc-600 mt-10">
        Sistema de agendamento exclusivo • Navalha.io
      </footer>
    </div>
  );
}

/* ============================================================================
   2. PORTAL INSTITUCIONAL (HOME RAIZ: DARK & GOLD LUXURY)
   ============================================================================ */
function PlatformHomePortal({ onOpenLogin }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 min-h-screen flex flex-col justify-between">
      <header className="flex items-center justify-between py-3 px-4 rounded-2xl bg-zinc-900/60 backdrop-blur border border-zinc-800/80">
        <BrandLogo />
        <button
          onClick={onOpenLogin}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs sm:text-sm font-black flex items-center gap-2 transition shadow-lg shadow-amber-500/20"
        >
          <Shield className="w-4 h-4" /> Entrar no Painel
        </button>
      </header>

      <main className="text-center max-w-3xl mx-auto my-14">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Plataforma SaaS de Alta Performance para Barbearias
        </span>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.08]">
          Sua barbearia no controle total, com{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600">
            link exclusivo
          </span>{' '}
          de agendamento.
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base mt-6 max-w-xl mx-auto leading-relaxed">
          Cada unidade ganha sua própria página personalizada para a bio do Instagram, enquanto o proprietário acompanha faturamento mensal, comissões e estoque em tempo real.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onOpenLogin}
            className="px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-sm flex items-center gap-2 transition shadow-xl shadow-amber-500/25"
          >
            <Shield className="w-4 h-4" /> Acessar Painel Administrativo
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 text-left">
          <div className="p-5 rounded-3xl bg-zinc-900/70 backdrop-blur border border-zinc-800/90 hover:border-amber-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3">
              <Link2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Link Próprio na Bio</h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              URL exclusiva com bloqueio automático de horários ocupados e seleção de barbeiro.
            </p>
          </div>
          <div className="p-5 rounded-3xl bg-zinc-900/70 backdrop-blur border border-zinc-800/90 hover:border-amber-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Rendimento & Comissões</h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Fechamento mensal automático com cálculo de repasse individual por profissional.
            </p>
          </div>
          <div className="p-5 rounded-3xl bg-zinc-900/70 backdrop-blur border border-zinc-800/90 hover:border-amber-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Estoque & Revenda</h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Controle de produtos com alerta de reposição e venda rápida no balcão.
            </p>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-zinc-600 py-5 border-t border-zinc-900">
        Navalha.io • Tecnologia para Barbearias Modernas
      </footer>
    </div>
  );
}

/* ============================================================================
   3. CONSOLE SUPER ADMIN
   ============================================================================ */
function SuperAdminConsole({ tenants, onRefresh, onImpersonate, onCopyLink, onLogout, notify }) {
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
    notify('Barbearia cadastrada com link exclusivo!');
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
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/70 backdrop-blur border border-zinc-800">
        <div className="flex items-center gap-3">
          <BrandLogo subtitle="Console Master • Super Admin" />
          <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1">
            <Crown className="w-3.5 h-3.5" /> Admin Geral
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { setFormError(''); setShowNewModal(true); }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" /> Nova Barbearia
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold flex items-center gap-2 hover:border-zinc-700"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>

      <div className="my-6 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-black text-sm uppercase tracking-wider text-white">
            Barbearias Credenciadas ({tenants.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50 text-[11px] text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Barbearia</th>
                <th className="py-3.5 px-5">Proprietário</th>
                <th className="py-3.5 px-5">Link Exclusivo</th>
                <th className="py-3.5 px-5">Plano</th>
                <th className="py-3.5 px-5 text-right">Ações Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-800/30 transition">
                  <td className="py-4 px-5 font-bold text-white">{t.name}</td>
                  <td className="py-4 px-5">
                    <p className="text-zinc-200 font-medium">{t.owner_name}</p>
                    <p className="text-xs text-zinc-500">{t.owner_email}</p>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onCopyLink(t.slug)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 text-xs text-amber-400 font-bold inline-flex items-center gap-1.5 transition"
                      >
                        <Copy className="w-3 h-3" /> /b/{t.slug}
                      </button>
                      <a
                        href={`/b/${t.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase text-[11px] font-black">
                      {t.plan_id}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right space-x-2">
                    <button
                      onClick={() => onImpersonate(t.id)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black inline-flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> Gerenciar Painel
                    </button>
                    <button
                      onClick={() => toggleStatus(t)}
                      className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white transition"
                      title="Bloquear / Desbloquear"
                    >
                      {t.status === 'blocked' ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-7 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <BrandLogo subtitle="Cadastrar Nova Unidade e Acesso" />
              <button
                onClick={() => setShowNewModal(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBarbershop} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Nome da Barbearia</label>
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
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Nome do Dono</label>
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
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">WhatsApp</label>
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
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Plano Contratado</label>
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
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">E-mail de Login do Dono</label>
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
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Senha Inicial de Acesso</label>
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
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-black text-sm transition flex items-center justify-center gap-2"
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
   4. PAINEL EXECUTIVO DO DONO DA BARBEARIA
   Com KPIs no Topo, Gráfico Financeiro e Editor de Link Personalizado
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
  onCopyLink,
  onRefresh,
  onLogout,
  notify,
}) {
  const [activeTab, setActiveTab] = useState('agenda');

  // Editor de Link Exclusivo (Slug)
  const [editingSlug, setEditingSlug] = useState(false);
  const [customSlug, setCustomSlug] = useState(tenant?.slug || '');

  const [srvName, setSrvName] = useState('');
  const [srvPrice, setSrvPrice] = useState('');
  const [srvDuration, setSrvDuration] = useState('40');
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  const [barberName, setBarberName] = useState('');
  const [barberRole, setBarberRole] = useState('Barbeiro Sênior');
  const [barberCommission, setBarberCommission] = useState('50');

  const currentMonth = new Date().toISOString().slice(0, 7);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [expDesc, setExpDesc] = useState('');
  const [expCategory, setExpCategory] = useState('Aluguel / Contas');
  const [expAmount, setExpAmount] = useState('');

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

  const handleSaveCustomSlug = async () => {
    const cleanSlug = customSlug
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!cleanSlug) return;
    const { error } = await supabase.from('tenants').update({ slug: cleanSlug }).eq('id', tenant.id);
    if (error) {
      notify('Esse link já está em uso por outra barbearia.');
      return;
    }
    setEditingSlug(false);
    notify(`Link atualizado para /b/${cleanSlug}`);
    onRefresh();
  };

  const updateAppointmentStatus = async (aptId, nextStatus) => {
    await supabase.from('appointments').update({ status: nextStatus }).eq('id', aptId);
    notify(nextStatus === 'completed' ? 'Atendimento concluído e lançado no caixa!' : 'Agendamento cancelado.');
    onRefresh();
  };

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
        sold_at: todayStr,
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

  // --- CÁLCULOS FINANCEIROS ---
  const todayAppointments = appointments.filter((a) => a.date === todayStr && a.status !== 'cancelled');
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

  const lowStockCount = products.filter((p) => p.stock_qty <= p.min_stock).length;
  const totalStockItems = products.reduce((acc, p) => acc + Number(p.stock_qty || 0), 0);
  const totalStockValue = products.reduce((acc, p) => acc + Number(p.stock_qty || 0) * Number(p.sale_price || 0), 0);

  const maxChartVal = Math.max(grossRevenue, totalCommissions, totalExpenses, Math.abs(netProfit), 1);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* HEADER EXECUTIVO */}
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-zinc-900/80 backdrop-blur border border-zinc-800">
        <BrandLogo title={tenant.name} badge="GESTÃO" subtitle={`Proprietário: ${profile?.full_name || tenant.owner_name}`} />

        <div className="flex flex-wrap items-center gap-2">
          {editingSlug ? (
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-amber-500/50 rounded-xl px-2.5 py-1">
              <span className="text-[11px] text-zinc-500">/b/</span>
              <input
                type="text"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                className="w-32 bg-transparent text-xs text-white font-bold focus:outline-none"
              />
              <button onClick={handleSaveCustomSlug} className="p-1 rounded bg-emerald-500 text-zinc-950">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setEditingSlug(false)} className="p-1 text-zinc-400">
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onCopyLink}
                className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar Link Exclusivo
              </button>
              <button
                onClick={() => { setCustomSlug(tenant.slug); setEditingSlug(true); }}
                className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition"
                title="Personalizar URL da barbearia"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
              <a
                href={`/b/${tenant.slug}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition"
                title="Abrir página do cliente"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          <button
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold flex items-center gap-1.5 hover:border-zinc-700 transition"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>

      {/* CARDS DE INDICADORES RÁPIDOS (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-5">
        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/90">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Agenda Hoje</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1.5">{todayAppointments.length}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">clientes marcados hoje</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/90">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Faturamento ({selectedMonth})</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1.5">R$ {grossRevenue.toFixed(0)}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">serviços + produtos</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-emerald-500/25">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
            <span>Lucro Líquido</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className={`text-2xl font-black mt-1.5 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            R$ {netProfit.toFixed(0)}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">livre após comissões e custos</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/90">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Estoque Ativo</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1.5">{totalStockItems} un.</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {lowStockCount > 0 ? `${lowStockCount} produto(s) acabando` : 'níveis abastecidos'}
          </p>
        </div>
      </div>

      {/* MENU DE NAVEGAÇÃO EM ABAS */}
      <nav className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'agenda', label: `Agenda (${appointments.length})`, icon: Calendar },
          { id: 'servicos', label: `Serviços (${services.length})`, icon: Scissors },
          { id: 'barbeiros', label: `Barbeiros (${barbers.length})`, icon: Users },
          { id: 'financeiro', label: 'Financeiro Mensal', icon: BarChart3 },
          { id: 'estoque', label: `Estoque (${products.length})`, icon: Package },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition ${
                active
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ABA 1: AGENDA */}
      {activeTab === 'agenda' && (
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="font-black text-base text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" /> Agendamentos da Barbearia
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Conclua os atendimentos finalizados para contabilizar no rendimento mensal
              </p>
            </div>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-zinc-800 rounded-2xl">
              <p className="text-sm text-zinc-400 font-medium">Nenhum agendamento recebido ainda.</p>
              <button
                onClick={onCopyLink}
                className="mt-3 px-4 py-2 rounded-xl bg-amber-500/15 text-amber-400 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Compartilhar Link com Clientes
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((a) => {
                const srv = services.find((s) => s.id === a.service_id);
                const brb = barbers.find((b) => b.id === a.barber_id);
                return (
                  <div
                    key={a.id}
                    className="flex flex-wrap justify-between items-center gap-3 p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-center shrink-0">
                        <p className="text-xs font-black text-amber-400">{a.time?.slice(0, 5)}</p>
                        <p className="text-[10px] text-zinc-500">{a.date}</p>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">
                          {a.client_name}{' '}
                          <span className="text-xs font-normal text-zinc-500">• {a.client_phone}</span>
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          <span className="text-zinc-200 font-semibold">{srv?.name || 'Serviço'}</span>
                          {brb ? ` • Barbeiro: ${brb.name}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400 text-xs font-black">
                        R$ {Number(a.price_snapshot).toFixed(2)}
                      </span>

                      {a.status === 'scheduled' ? (
                        <>
                          <button
                            onClick={() => updateAppointmentStatus(a.id, 'completed')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30 transition"
                          >
                            Concluir
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(a.id, 'cancelled')}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 text-xs font-bold hover:bg-rose-500/25 transition"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            a.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
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

      {/* ABA 2: SERVIÇOS */}
      {activeTab === 'servicos' && (
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-black text-base text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-400" /> Catálogo de Serviços
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Gerencie preços e tempos de atendimento exibidos na sua página exclusiva
              </p>
            </div>
            <button
              type="button"
              onClick={handleSeedDefaultServices}
              className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 text-amber-400 text-xs font-bold transition"
            >
              + Restaurar Serviços Padrão
            </button>
          </div>

          <form onSubmit={handleAddService} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mb-6">
            <input
              type="text"
              required
              placeholder="Nome do serviço (ex: Corte Navalhado)"
              value={srvName}
              onChange={(e) => setSrvName(e.target.value)}
              className="sm:col-span-2 px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
            <input
              type="number"
              step="0.01"
              required
              placeholder="Preço (R$)"
              value={srvPrice}
              onChange={(e) => setSrvPrice(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-amber-500 focus:outline-none"
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
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1 transition"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/90"
              >
                <div>
                  <p className="font-bold text-sm text-white">{s.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {s.duration} min
                  </p>
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
                      <span className="text-sm font-black text-amber-400 mr-1">
                        R$ {Number(s.price).toFixed(2)}
                      </span>
                      <button
                        onClick={() => { setEditingServiceId(s.id); setEditPrice(s.price); }}
                        className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(s.id)}
                        className="p-2 rounded-xl bg-zinc-900 text-rose-400 hover:bg-rose-500/20 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 3: BARBEIROS */}
      {activeTab === 'barbeiros' && (
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-6">
          <h2 className="font-black text-base text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" /> Equipe de Profissionais & Comissões
          </h2>

          <form onSubmit={handleAddBarber} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mb-6">
            <input
              type="text"
              required
              placeholder="Nome do barbeiro"
              value={barberName}
              onChange={(e) => setBarberName(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
            />
            <input
              type="text"
              placeholder="Especialidade (ex: Barbeiro Sênior)"
              value={barberRole}
              onChange={(e) => setBarberRole(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
            />
            <input
              type="number"
              min="0"
              max="100"
              required
              placeholder="Comissão (%)"
              value={barberCommission}
              onChange={(e) => setBarberCommission(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
            />
            <button
              type="submit"
              className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1 transition"
            >
              <Plus className="w-4 h-4" /> Cadastrar Barbeiro
            </button>
          </form>

          {barbers.length === 0 ? (
            <p className="text-sm text-zinc-400 py-8 text-center border border-dashed border-zinc-800 rounded-2xl">
              Nenhum barbeiro cadastrado ainda.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {barbers.map((b) => {
                const initials = b.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/90"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 font-black text-sm flex items-center justify-center">
                        {initials}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">{b.name}</p>
                        <p className="text-xs text-zinc-400">{b.role_title}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-[11px] font-bold">
                          Comissão: {b.commission_percent}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteBarber(b.id)}
                      className="p-2 rounded-xl bg-zinc-900 text-rose-400 hover:bg-rose-500/20 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA 4: FINANCEIRO MENSAL COM GRÁFICO COMPARATIVO */}
      {activeTab === 'financeiro' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-5">
            <div>
              <h2 className="font-black text-base text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" /> Fechamento e Rendimento Mensal
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Visão consolidada de entradas, repasse de equipe e custos operacionais
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Competência:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold text-white"
              />
            </div>
          </div>

          {/* GRÁFICO VISUAL DE COMPOSIÇÃO DO MÊS */}
          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-6">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-5">
              Comparativo Financeiro ({selectedMonth})
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Faturamento Bruto (Serviços + Produtos)', value: grossRevenue, color: 'bg-amber-400', text: 'text-white' },
                { label: 'Comissões da Equipe', value: totalCommissions, color: 'bg-amber-600', text: 'text-amber-400' },
                { label: 'Despesas Operacionais', value: totalExpenses, color: 'bg-rose-500', text: 'text-rose-400' },
                { label: 'Rendimento Líquido da Barbearia', value: Math.max(0, netProfit), color: 'bg-emerald-400', text: 'text-emerald-400' },
              ].map((bar) => (
                <div key={bar.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-300 font-semibold">{bar.label}</span>
                    <span className={`font-black ${bar.text}`}>R$ {bar.value.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800/80">
                    <div
                      className={`h-full rounded-full ${bar.color} transition-all duration-500`}
                      style={{ width: `${Math.min(100, (bar.value / maxChartVal) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-zinc-500 mt-4 pt-3 border-t border-zinc-800/80">
              Agenda futura prevista no mês: <strong className="text-zinc-300">+ R$ {projectedRevenue.toFixed(2)}</strong> ({monthScheduledApts.length} horários aguardando conclusão)
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-6">
              <h3 className="font-bold text-sm text-white mb-4">Comissões por Barbeiro</h3>
              {barberCommissions.length === 0 ? (
                <p className="text-xs text-zinc-400">Nenhum barbeiro cadastrado.</p>
              ) : (
                <div className="space-y-2.5 text-xs">
                  {barberCommissions.map((b) => (
                    <div key={b.id} className="flex justify-between items-center p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                      <div>
                        <p className="font-bold text-white">{b.name} ({b.commission_percent}%)</p>
                        <p className="text-zinc-500 mt-0.5">{b.count} cortes • Gerou R$ {b.totalGenerated.toFixed(2)}</p>
                      </div>
                      <span className="font-black text-amber-400 text-sm">R$ {b.commissionDue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-6">
              <h3 className="font-bold text-sm text-white mb-4">Custos e Despesas do Mês</h3>
              <form onSubmit={handleAddExpense} className="flex flex-wrap gap-2 mb-4">
                <input
                  type="text"
                  required
                  placeholder="Descrição (ex: Aluguel, Energia, Lâminas)"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="flex-1 min-w-[160px] px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                />
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Valor R$"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-28 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                />
                <button type="submit" className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs">
                  Lançar
                </button>
              </form>

              <div className="space-y-2 text-xs">
                {monthExpenses.map((e) => (
                  <div key={e.id} className="flex justify-between items-center p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-200 font-semibold">{e.description}</span>
                    <div className="flex items-center gap-2.5">
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

      {/* ABA 5: ESTOQUE */}
      {activeTab === 'estoque' && (
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-black text-base text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" /> Estoque de Produtos para Venda
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {totalStockItems} itens físicos • Potencial em prateleira: R$ {totalStockValue.toFixed(2)}
              </p>
            </div>
          </div>

          <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 mb-6">
            <input
              type="text"
              required
              placeholder="Produto (ex: Pomada Matte)"
              value={prodName}
              onChange={(e) => setProdName(e.target.value)}
              className="sm:col-span-2 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Custo (R$)"
              value={prodCost}
              onChange={(e) => setProdCost(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
            />
            <input
              type="number"
              step="0.01"
              required
              placeholder="Venda (R$)"
              value={prodPrice}
              onChange={(e) => setProdPrice(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
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
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Salvar
              </button>
            </div>
          </form>

          <div className="overflow-x-auto border border-zinc-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Produto</th>
                  <th className="py-3.5 px-4">Custo / Venda</th>
                  <th className="py-3.5 px-4">Saldo</th>
                  <th className="py-3.5 px-4 text-right">Venda Balcão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 bg-zinc-950/60">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white text-sm">{p.name}</p>
                      {p.stock_qty <= p.min_stock && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 mt-0.5">
                          <AlertTriangle className="w-3 h-3" /> Estoque baixo
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-zinc-500">Custo: R$ {Number(p.cost_price).toFixed(2)}</p>
                      <p className="text-amber-400 font-bold">Venda: R$ {Number(p.sale_price).toFixed(2)}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1">
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
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleSellProduct(p)}
                        disabled={p.stock_qty <= 0}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold inline-flex items-center gap-1.5 disabled:opacity-40 hover:bg-emerald-500/30 transition"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Vender 1 un.
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-2 rounded-xl bg-zinc-900 text-rose-400 hover:bg-rose-500/20 transition"
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
