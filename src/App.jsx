import React, { useState, useEffect } from 'react';
import {
  Scissors, Calendar, Users, Shield, Crown, CheckCircle2,
  XCircle, Plus, Lock, Unlock, LogOut, ArrowLeft,
  Store, Sparkles, Eye, Loader2, Package,
  Trash2, Edit3, Check, TrendingUp, AlertTriangle, ShoppingBag,
  Link2, ExternalLink, Copy, Clock, Phone,
  BarChart3, SlidersHorizontal, ChevronRight, MessageCircle, Megaphone, Search, Webhook,
  Smartphone, Play, Pause, Send, Upload, RefreshCw, UserX, CalendarClock
} from 'lucide-react';
import { supabase } from './supabaseClient';

const COMMERCIAL_WHATSAPP = '5582999362164';
const COMMERCIAL_PHONE_DISPLAY = '(82) 99936-2164';

const BrandLogo = ({
  title = 'NAVALHA',
  badge = '.IO',
  subtitle = 'Gestão & Agendamento Inteligente',
  logoUrl = null,
}) => (
  <div className="flex items-center gap-3 select-none">
    {logoUrl ? (
      <img
        src={logoUrl}
        alt={title}
        className="w-11 h-11 rounded-xl object-cover border border-amber-500/40 shadow-lg bg-zinc-950 shrink-0"
      />
    ) : (
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25 text-zinc-950 font-black ring-1 ring-amber-300/40 shrink-0">
        <Scissors className="w-5 h-5" />
      </div>
    )}
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

const formatWhatsAppNumber = (rawPhone) => {
  const digits = (rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('55') && digits.length >= 12 ? digits : `55${digits}`;
};

const openWhatsAppMessage = (rawPhone, text) => {
  const waNumber = formatWhatsAppNumber(rawPhone);
  if (!waNumber) return;
  const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const getHoursUntilAppointment = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return 0;
  const cleanTime = timeStr.slice(0, 5);
  const aptDate = new Date(`${dateStr}T${cleanTime}:00`);
  const now = new Date();
  return (aptDate.getTime() - now.getTime()) / (1000 * 60 * 60);
};

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
  const [clients, setClients] = useState([]);
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
        { data: clientsData },
        { data: productsData },
        { data: expensesData },
        { data: salesData },
      ] = await Promise.all([
        supabase.from('tenants').select('*').order('created_at', { ascending: false }),
        supabase.from('services').select('*').eq('active', true).order('name', { ascending: true }),
        supabase.from('barbers').select('*').eq('active', true).order('name', { ascending: true }),
        supabase.from('appointments').select('*').order('date', { ascending: false }),
        supabase.from('clients').select('*').order('last_visit', { ascending: false }),
        supabase.from('products').select('*').eq('active', true).order('name', { ascending: true }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('product_sales').select('*').order('sold_at', { ascending: false }),
      ]);

      setTenants(tenantsData || []);
      setServices(servicesData || []);
      setBarbers(barbersData || []);
      setAppointments(aptData || []);
      setClients(clientsData || []);
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
            allShopAppointments={shop ? appointments.filter((a) => a.tenant_id === shop.id) : []}
            onAppointmentChanged={() => loadPlatformData(authUser)}
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
            clients={clients.filter((c) => c.tenant_id === activeTenantId)}
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
   1. PÁGINA EXCLUSIVA DA BARBEARIA (/b/slug) — AGENDAR + MEUS HORÁRIOS/CANCELAR
   ============================================================================ */
function DedicatedShopBookingPage({
  shop,
  services,
  barbers,
  allShopAppointments,
  onAppointmentChanged,
  notify,
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [publicMode, setPublicMode] = useState('book'); // 'book' | 'manage'

  // Estados de Novo Agendamento
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);

  // Estados de Consulta / Reagendamento / Cancelamento pelo Cliente
  const [lookupPhone, setLookupPhone] = useState('');
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState(todayStr);
  const [newRescheduleTime, setNewRescheduleTime] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('Imprevisto de horário');
  const [processingClientAction, setProcessingClientAction] = useState(false);

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

  const minCancelHours = Number(shop.min_cancel_hours ?? 2);
  const activeAppointments = allShopAppointments.filter(
    (a) => a.status !== 'cancelled' && a.status !== 'no_show'
  );

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);

  const bookedTimesOnDate = activeAppointments
    .filter((a) => a.date === date && (!selectedBarberId || a.barber_id === selectedBarberId))
    .map((a) => a.time?.slice(0, 5));

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedServiceId || !date || !time || !clientName || !clientPhone) return;
    setSubmitting(true);

    const cleanName = clientName.trim();
    const cleanPhone = clientPhone.trim();
    const phoneDigits = cleanPhone.replace(/\D/g, '');

    const { error } = await supabase.from('appointments').insert({
      tenant_id: shop.id,
      service_id: selectedServiceId,
      barber_id: selectedBarberId || null,
      client_name: cleanName,
      client_phone: cleanPhone,
      date,
      time,
      price_snapshot: selectedService?.price || 0,
      status: 'scheduled',
    });

    if (error) {
      setSubmitting(false);
      notify('Erro ao agendar: ' + error.message);
      return;
    }

    if (phoneDigits) {
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id, total_visits')
        .eq('tenant_id', shop.id)
        .eq('phone_clean', phoneDigits)
        .maybeSingle();

      if (existingClient) {
        await supabase
          .from('clients')
          .update({
            name: cleanName,
            phone: cleanPhone,
            total_visits: (existingClient.total_visits || 0) + 1,
            last_visit: date,
          })
          .eq('id', existingClient.id);
      } else {
        await supabase.from('clients').insert({
          tenant_id: shop.id,
          name: cleanName,
          phone: cleanPhone,
          phone_clean: phoneDigits,
          total_visits: 1,
          last_visit: date,
        });
      }
    }

    if (shop.whatsapp_webhook_url) {
      try {
        fetch(shop.whatsapp_webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'appointment.created',
            barbershop_name: shop.name,
            client_name: cleanName,
            client_phone: formatWhatsAppNumber(cleanPhone),
            service_name: selectedService?.name,
            barber_name: selectedBarber?.name || 'Equipe',
            date,
            time,
            price: selectedService?.price,
            message: `Olá ${cleanName}! Seu agendamento na *${shop.name}* está confirmado:\n✂️ *Serviço:* ${selectedService?.name}\n💈 *Profissional:* ${selectedBarber?.name || 'Primeiro disponível'}\n📅 *Data:* ${date} às *${time}*\n💰 *Valor:* R$ ${Number(selectedService?.price || 0).toFixed(2)}`,
          }),
        }).catch(() => {});
      } catch (_) {}
    }

    setSubmitting(false);
    setLookupPhone(cleanPhone);
    setBookingConfirmed({
      serviceName: selectedService?.name,
      barberName: selectedBarber?.name || 'Primeiro profissional disponível',
      price: selectedService?.price,
      date,
      time,
      clientName: cleanName,
      clientPhone: cleanPhone,
    });
    setClientName('');
    setClientPhone('');
    setTime('');
    onAppointmentChanged();
  };

  const handleSendReceiptToShopWhatsApp = () => {
    if (!bookingConfirmed || !shop.owner_phone) return;
    const msg = `Olá *${shop.name}*! Acabei de agendar pelo site:\n\n👤 *Cliente:* ${bookingConfirmed.clientName}\n✂️ *Serviço:* ${bookingConfirmed.serviceName}\n💈 *Profissional:* ${bookingConfirmed.barberName}\n📅 *Data:* ${bookingConfirmed.date} às *${bookingConfirmed.time}*\n💰 *Valor:* R$ ${Number(bookingConfirmed.price).toFixed(2)}`;
    openWhatsAppMessage(shop.owner_phone, msg);
  };

  // Filtra agendamentos futuros do cliente pelo telefone digitado
  const lookupDigits = lookupPhone.replace(/\D/g, '');
  const clientUpcomingAppointments =
    lookupDigits.length >= 8
      ? allShopAppointments.filter((a) => {
          const aptDigits = (a.client_phone || '').replace(/\D/g, '');
          return (
            a.status === 'scheduled' &&
            a.date >= todayStr &&
            aptDigits.endsWith(lookupDigits.slice(-8))
          );
        })
      : [];

  const handleConfirmClientCancel = async () => {
    if (!cancelTarget) return;
    setProcessingClientAction(true);

    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancellation_reason: `Cliente: ${cancelReason}`,
      })
      .eq('id', cancelTarget.id);

    if (error) {
      setProcessingClientAction(false);
      notify('Erro ao cancelar: ' + error.message);
      return;
    }

    if (shop.whatsapp_webhook_url) {
      try {
        fetch(shop.whatsapp_webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'appointment.cancelled_by_client',
            barbershop_name: shop.name,
            client_name: cancelTarget.client_name,
            date: cancelTarget.date,
            time: cancelTarget.time,
            reason: cancelReason,
          }),
        }).catch(() => {});
      } catch (_) {}
    }

    setProcessingClientAction(false);
    setCancelTarget(null);
    notify('Horário cancelado e liberado na agenda!');
    onAppointmentChanged();
  };

  const handleConfirmClientReschedule = async () => {
    if (!rescheduleTarget || !newRescheduleDate || !newRescheduleTime) return;
    setProcessingClientAction(true);

    const { error } = await supabase
      .from('appointments')
      .update({
        date: newRescheduleDate,
        time: newRescheduleTime,
      })
      .eq('id', rescheduleTarget.id);

    setProcessingClientAction(false);

    if (error) {
      notify('Erro ao reagendar: ' + error.message);
      return;
    }

    setRescheduleTarget(null);
    setNewRescheduleTime('');
    notify(`Horário remarcado para ${newRescheduleDate} às ${newRescheduleTime}!`);
    onAppointmentChanged();
  };

  const bookedTimesForReschedule = rescheduleTarget
    ? activeAppointments
        .filter(
          (a) =>
            a.id !== rescheduleTarget.id &&
            a.date === newRescheduleDate &&
            (!rescheduleTarget.barber_id || a.barber_id === rescheduleTarget.barber_id)
        )
        .map((a) => a.time?.slice(0, 5))
    : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/90 rounded-3xl p-6 mb-5 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <BrandLogo
            title={shop.name}
            badge="AGENDAMENTO"
            subtitle="Reserva Online • Confirmação Imediata"
            logoUrl={shop.logo_url}
          />
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Agenda Aberta
          </span>
        </div>

        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPublicMode('book')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
                publicMode === 'book'
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" /> Novo Agendamento
            </button>
            <button
              type="button"
              onClick={() => setPublicMode('manage')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
                publicMode === 'manage'
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" /> Meus Horários / Cancelar
            </button>
          </div>

          {shop.owner_phone && (
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
              <Phone className="w-3.5 h-3.5 text-amber-400" /> {shop.owner_phone}
            </span>
          )}
        </div>
      </div>

      {/* MODO 1: NOVO AGENDAMENTO */}
      {publicMode === 'book' && (
        <>
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

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {shop.owner_phone && (
                  <button
                    onClick={handleSendReceiptToShopWhatsApp}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <MessageCircle className="w-4 h-4" /> Enviar Comprovante no WhatsApp
                  </button>
                )}
                <button
                  onClick={() => { setBookingConfirmed(null); setPublicMode('manage'); }}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition"
                >
                  Ver Meus Horários
                </button>
                <button
                  onClick={() => setBookingConfirmed(null)}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-white font-bold text-xs transition"
                >
                  Novo Agendamento
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBook} className="space-y-6">
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
                    const initials = b.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
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

              <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-5 sm:p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-6 h-6 rounded-lg bg-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center">
                    4
                  </span>
                  <h2 className="font-black text-sm uppercase tracking-wider text-white">Seus Dados (WhatsApp)</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
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
                    <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">WhatsApp com DDD</label>
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

                <p className="text-[11px] text-zinc-400 mb-4 flex items-center gap-1.5 bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/80">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    Precisa remarcar ou cancelar? Você pode alterar pelo botão <strong>Meus Horários</strong> com até{' '}
                    <strong className="text-zinc-200">{minCancelHours}h de antecedência</strong>.
                  </span>
                </p>

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
        </>
      )}

      {/* MODO 2: CONSULTAR, REAGENDAR OU CANCELAR PELO CLIENTE */}
      {publicMode === 'manage' && (
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-6 space-y-5">
          <div>
            <h2 className="font-black text-base text-white flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-amber-400" /> Meus Agendamentos na {shop.name}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Informe o número de WhatsApp usado na reserva para visualizar, remarcar ou cancelar seu horário.
            </p>
          </div>

          <div className="relative">
            <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={lookupPhone}
              onChange={(e) => setLookupPhone(e.target.value)}
              placeholder="Digite seu WhatsApp com DDD (ex: 82 99999-9999)"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          {lookupDigits.length >= 8 && (
            <div className="space-y-3">
              {clientUpcomingAppointments.length === 0 ? (
                <div className="p-6 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center">
                  <p className="text-xs text-zinc-400">
                    Nenhum agendamento futuro encontrado para este número.
                  </p>
                </div>
              ) : (
                clientUpcomingAppointments.map((apt) => {
                  const srv = services.find((s) => s.id === apt.service_id);
                  const brb = barbers.find((b) => b.id === apt.barber_id);
                  const hoursLeft = getHoursUntilAppointment(apt.date, apt.time);
                  const canSelfModify = minCancelHours === 0 || hoursLeft >= minCancelHours;

                  return (
                    <div
                      key={apt.id}
                      className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3"
                    >
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-xs font-black">
                            {apt.date} às {apt.time?.slice(0, 5)}
                          </span>
                          <h3 className="font-bold text-sm text-white mt-2">
                            {srv?.name || 'Atendimento'} • R$ {Number(apt.price_snapshot).toFixed(2)}
                          </h3>
                          <p className="text-xs text-zinc-400">
                            Cliente: {apt.client_name} • Profissional: {brb?.name || 'Equipe'}
                          </p>
                        </div>
                      </div>

                      {canSelfModify ? (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-900">
                          <button
                            type="button"
                            onClick={() => {
                              setRescheduleTarget(apt);
                              setNewRescheduleDate(apt.date);
                              setNewRescheduleTime('');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 text-xs font-black flex items-center gap-1.5 transition"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Trocar Horário
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCancelTarget(apt);
                              setCancelReason('Imprevisto de horário');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 text-xs font-bold flex items-center gap-1.5 transition"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancelar Reserva
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300 flex flex-wrap items-center justify-between gap-2">
                          <span>
                            Faltam menos de {minCancelHours}h para o corte. Alterações em cima da hora são feitas pelo WhatsApp:
                          </span>
                          {shop.owner_phone && (
                            <button
                              type="button"
                              onClick={() =>
                                openWhatsAppMessage(
                                  shop.owner_phone,
                                  `Olá *${shop.name}*! Sou *${apt.client_name}* e preciso falar sobre meu horário de hoje às *${apt.time?.slice(0, 5)}*.`
                                )
                              }
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-black text-[11px] inline-flex items-center gap-1"
                            >
                              <MessageCircle className="w-3 h-3" /> Falar com a Barbearia
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL REAGENDAMENTO PELO CLIENTE */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl my-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-white">Trocar Data ou Horário</h3>
              <button onClick={() => setRescheduleTarget(null)} className="text-zinc-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Nova Data</label>
              <input
                type="date"
                min={todayStr}
                value={newRescheduleDate}
                onChange={(e) => { setNewRescheduleDate(e.target.value); setNewRescheduleTime(''); }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1.5">Novo Horário Livre</label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const occupied = bookedTimesForReschedule.includes(slot);
                  const picked = newRescheduleTime === slot;
                  return (
                    <button
                      type="button"
                      key={slot}
                      disabled={occupied}
                      onClick={() => setNewRescheduleTime(slot)}
                      className={`py-2 rounded-xl text-xs font-bold border ${
                        occupied
                          ? 'bg-zinc-950/40 border-zinc-900 text-zinc-600 line-through'
                          : picked
                          ? 'bg-amber-500 border-amber-400 text-zinc-950 font-black'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-200'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              disabled={processingClientAction || !newRescheduleTime}
              onClick={handleConfirmClientReschedule}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-black text-sm transition"
            >
              {processingClientAction ? 'Salvando...' : 'Confirmar Novo Horário'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL CANCELAMENTO PELO CLIENTE */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl my-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-white">Cancelar Agendamento</h3>
              <button onClick={() => setCancelTarget(null)} className="text-zinc-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Você está cancelando seu horário de <strong className="text-white">{cancelTarget.date} às {cancelTarget.time?.slice(0, 5)}</strong>. A vaga será liberada imediatamente na agenda.
            </p>

            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Motivo (opcional)</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              >
                <option value="Imprevisto de horário">Imprevisto de horário</option>
                <option value="Vou remarcar outro dia">Vou remarcar outro dia</option>
                <option value="Compromisso de trabalho">Compromisso de trabalho</option>
                <option value="Outro motivo">Outro motivo</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="flex-1 py-3 rounded-xl bg-zinc-800 text-white font-bold text-xs"
              >
                Manter Horário
              </button>
              <button
                type="button"
                disabled={processingClientAction}
                onClick={handleConfirmClientCancel}
                className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs"
              >
                {processingClientAction ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="text-center text-[11px] text-zinc-600 mt-10">
        Sistema de agendamento exclusivo • Navalha.io
      </footer>
    </div>
  );
}

/* ============================================================================
   2. PORTAL INSTITUCIONAL COM DEMONSTRAÇÃO INTERATIVA E CONTATO COMERCIAL
   ============================================================================ */
function PlatformHomePortal({ onOpenLogin }) {
  const [demoStep, setDemoStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [quoteShopName, setQuoteShopName] = useState('');
  const [quoteBarbersCount, setQuoteBarbersCount] = useState('2 a 4 cadeiras');

  const demoSteps = [
    {
      stepNumber: '1',
      title: 'Cliente abre o link da bio',
      caption: 'Visualiza os serviços, valores e duração sem precisar baixar aplicativo.',
    },
    {
      stepNumber: '2',
      title: 'Escolhe o barbeiro favorito',
      caption: 'Seleciona o profissional ou o primeiro horário disponível na equipe.',
    },
    {
      stepNumber: '3',
      title: 'Marca o horário livre',
      caption: 'Horários já ocupados ficam bloqueados automaticamente para evitar choque.',
    },
    {
      stepNumber: '4',
      title: 'Confirmação e WhatsApp',
      caption: 'Reserva entra na agenda do dono e o cliente recebe comprovante na hora.',
    },
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % 4);
    }, 2600);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleRequestQuote = (e) => {
    if (e) e.preventDefault();
    const shopInfo = quoteShopName.trim() ? ` para a *${quoteShopName.trim()}*` : '';
    const msg = `Olá! Vi a demonstração do sistema *Navalha.io* e gostaria de solicitar um orçamento${shopInfo} (${quoteBarbersCount}).`;
    openWhatsAppMessage(COMMERCIAL_WHATSAPP, msg);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 min-h-screen flex flex-col justify-between">
      <header className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 rounded-2xl bg-zinc-900/70 backdrop-blur border border-zinc-800/80">
        <BrandLogo />
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleRequestQuote()}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 text-emerald-400 text-xs font-black transition"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Solicitar Orçamento
          </button>
          <button
            onClick={onOpenLogin}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs sm:text-sm font-black flex items-center gap-2 transition shadow-lg shadow-amber-500/20"
          >
            <Shield className="w-4 h-4" /> Entrar no Painel
          </button>
        </div>
      </header>

      <main className="my-10 sm:my-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 text-left">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-5">
              <Sparkles className="w-3.5 h-3.5" /> Plataforma SaaS Completa para Barbearias
            </span>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.1]">
              Sua barbearia no controle total, com{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600">
                agendamento online
              </span>{' '}
              em 15 segundos.
            </h1>

            <p className="text-zinc-400 text-sm sm:text-base mt-5 max-w-xl leading-relaxed">
              Elimine mensagens perdidas no WhatsApp. Seu cliente escolhe o corte, o barbeiro e o horário sozinho pelo link da sua bio — enquanto você acompanha lucro líquido, comissões e promoções no painel.
            </p>

            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoSteps.map((item, idx) => {
                const active = demoStep === idx;
                return (
                  <button
                    key={item.stepNumber}
                    type="button"
                    onClick={() => { setDemoStep(idx); setIsPlaying(false); }}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      active
                        ? 'bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/10'
                        : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-md text-[11px] font-black flex items-center justify-center ${
                          active ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {item.stepNumber}
                      </span>
                      <span className={`text-xs font-black ${active ? 'text-white' : 'text-zinc-300'}`}>
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1.5 leading-snug">{item.caption}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleRequestQuote()}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-2 transition shadow-xl shadow-emerald-500/20"
              >
                <MessageCircle className="w-4 h-4" /> Solicitar Orçamento no WhatsApp
              </button>
              <button
                onClick={onOpenLogin}
                className="px-5 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-bold text-xs sm:text-sm flex items-center gap-2 transition"
              >
                <Shield className="w-4 h-4 text-amber-400" /> Já sou cliente
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-[340px] rounded-[2.4rem] p-3 bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 border border-zinc-700/80 shadow-[0_25px_70px_-15px_rgba(245,158,11,0.22)] relative">
              <div className="bg-zinc-950 rounded-[1.9rem] overflow-hidden border border-zinc-800/90">
                <div className="px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500/80" />
                    <span className="w-2 h-2 rounded-full bg-amber-400/80" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 bg-zinc-950 px-2.5 py-0.5 rounded-full border border-zinc-800">
                    navalha.io/b/dom-pedro
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="text-amber-400 hover:text-amber-300"
                    title={isPlaying ? 'Pausar animação' : 'Continuar animação'}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="p-4 bg-gradient-to-r from-zinc-900 to-zinc-950 border-b border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-black">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white leading-none">BARBEARIA DOM PEDRO</p>
                      <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Agendamento Online
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/15 text-amber-400">
                    Passo {demoStep + 1}/4
                  </span>
                </div>

                <div className="p-4 min-h-[295px] flex flex-col justify-between bg-zinc-950">
                  {demoStep === 0 && (
                    <div className="space-y-2.5">
                      <p className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                        1. Escolha o Serviço
                      </p>
                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-zinc-200">Corte Degradê Navalhado</p>
                          <p className="text-[10px] text-zinc-500">40 min</p>
                        </div>
                        <span className="text-xs font-bold text-zinc-300">R$ 45,00</span>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-500/15 border-2 border-amber-500 flex justify-between items-center shadow-lg shadow-amber-500/10">
                        <div>
                          <p className="text-xs font-black text-white">Combo Corte + Barba ✓</p>
                          <p className="text-[10px] text-amber-300">60 min • Toalha quente</p>
                        </div>
                        <span className="text-xs font-black text-amber-400">R$ 70,00</span>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-zinc-200">Barba & Ozonioterapia</p>
                          <p className="text-[10px] text-zinc-500">30 min</p>
                        </div>
                        <span className="text-xs font-bold text-zinc-300">R$ 35,00</span>
                      </div>
                    </div>
                  )}

                  {demoStep === 1 && (
                    <div className="space-y-2.5">
                      <p className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                        2. Escolha o Barbeiro
                      </p>
                      <div className="p-3 rounded-xl bg-amber-500/15 border-2 border-amber-500 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center">
                            LA
                          </div>
                          <div>
                            <p className="text-xs font-black text-white">Lucas Almeida ✓</p>
                            <p className="text-[10px] text-amber-300">Barbeiro Master</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400">Disponível</span>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 font-black text-xs flex items-center justify-center">
                            RM
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-200">Rafael Martins</p>
                            <p className="text-[10px] text-zinc-500">Especialista em Degradê</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 text-center">
                        Serviço: <strong className="text-white">Combo Corte + Barba (R$ 70)</strong>
                      </div>
                    </div>
                  )}

                  {demoStep === 2 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                          3. Horários de Hoje
                        </p>
                        <span className="text-[10px] text-zinc-400 font-bold">Lucas Almeida</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['14:10', '14:50', '15:30', '16:10', '16:50', '17:30'].map((h) => {
                          const occupied = h === '14:10' || h === '16:50';
                          const picked = h === '15:30';
                          return (
                            <div
                              key={h}
                              className={`py-2 rounded-lg text-center text-xs font-bold border ${
                                occupied
                                  ? 'bg-zinc-900/40 border-zinc-900 text-zinc-600 line-through'
                                  : picked
                                  ? 'bg-amber-500 border-amber-400 text-zinc-950 font-black shadow-md shadow-amber-500/30'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                              }`}
                            >
                              {h}
                            </div>
                          );
                        })}
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
                        Cliente: <strong className="text-white">Carlos Henrique</strong> • (82) 99888-1122
                      </div>
                    </div>
                  )}

                  {demoStep === 3 && (
                    <div className="text-center space-y-3 my-auto">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">Agendamento Confirmado!</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Hoje às <strong className="text-amber-400">15:30</strong> com Lucas Almeida
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] text-emerald-300 font-bold flex items-center justify-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" /> Comprovante enviado no WhatsApp
                      </div>
                    </div>
                  )}

                  <div className="pt-3 mt-3 border-t border-zinc-900 flex items-center justify-between gap-1.5">
                    {[0, 1, 2, 3].map((idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => { setDemoStep(idx); setIsPlaying(false); }}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          demoStep === idx ? 'bg-amber-400' : 'bg-zinc-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <span className="text-[11px] text-zinc-500 mt-3 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" /> Demonstração interativa • Clique nos passos para testar
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 text-left">
          <div className="p-5 rounded-3xl bg-zinc-900/70 backdrop-blur border border-zinc-800/90 hover:border-amber-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3">
              <Link2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Link Exclusivo na Bio</h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              URL personalizada com o nome e a logo da sua barbearia e bloqueio automático de horários ocupados.
            </p>
          </div>
          <div className="p-5 rounded-3xl bg-zinc-900/70 backdrop-blur border border-zinc-800/90 hover:border-amber-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3">
              <Megaphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Carteira de Clientes & Promoções</h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Todo cliente que agenda fica salvo automaticamente para você disparar promoções no WhatsApp.
            </p>
          </div>
          <div className="p-5 rounded-3xl bg-zinc-900/70 backdrop-blur border border-zinc-800/90 hover:border-amber-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Financeiro & Comissões</h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Fechamento automático de faturamento, repasse por barbeiro, despesas e estoque de produtos.
            </p>
          </div>
        </div>

        <section
          id="orcamento"
          className="mt-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-amber-500/30 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -right-12 -bottom-12 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
            <div className="lg:col-span-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
                <MessageCircle className="w-3.5 h-3.5" /> Implantação Rápida • Suporte Direto
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Quer colocar o sistema na sua barbearia?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-2.5 leading-relaxed">
                Entregamos sua barbearia configurada com sua logo, link exclusivo, serviços e equipe cadastrados no mesmo dia. Fale direto com nosso consultor e peça seu orçamento.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-amber-400">
                <Phone className="w-4 h-4" /> WhatsApp Comercial: {COMMERCIAL_PHONE_DISPLAY}
              </div>
            </div>

            <form onSubmit={handleRequestQuote} className="lg:col-span-6 bg-zinc-950/90 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                  Nome da sua Barbearia
                </label>
                <input
                  type="text"
                  value={quoteShopName}
                  onChange={(e) => setQuoteShopName(e.target.value)}
                  placeholder="Ex: Barbearia Estilo Livre"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                  Tamanho da Equipe
                </label>
                <select
                  value={quoteBarbersCount}
                  onChange={(e) => setQuoteBarbersCount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="1 cadeira (Autônomo)">1 cadeira (Barbeiro Autônomo)</option>
                  <option value="2 a 4 cadeiras">2 a 4 cadeiras</option>
                  <option value="5 ou mais cadeiras / Rede">5 ou mais cadeiras / Multi-unidades</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20"
              >
                <Send className="w-4 h-4" /> Solicitar Orçamento ({COMMERCIAL_PHONE_DISPLAY})
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="text-center text-xs text-zinc-600 py-5 border-t border-zinc-900">
        Navalha.io • Tecnologia para Barbearias Modernas • Contato: {COMMERCIAL_PHONE_DISPLAY}
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
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2.5">
                      {t.logo_url ? (
                        <img src={t.logo_url} alt={t.name} className="w-8 h-8 rounded-lg object-cover border border-zinc-700" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 text-amber-400 flex items-center justify-center">
                          <Scissors className="w-4 h-4" />
                        </div>
                      )}
                      <span className="font-bold text-white">{t.name}</span>
                    </div>
                  </td>
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
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">WhatsApp da Loja</label>
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
   ============================================================================ */
function OwnerDashboardShell({
  profile,
  tenant,
  services,
  barbers,
  appointments,
  clients,
  products,
  expenses,
  productSales,
  onCopyLink,
  onRefresh,
  onLogout,
  notify,
}) {
  const [activeTab, setActiveTab] = useState('agenda');

  // Identidade Visual & Regras de Cancelamento
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandName, setBrandName] = useState(tenant?.name || '');
  const [brandSlug, setBrandSlug] = useState(tenant?.slug || '');
  const [brandLogoUrl, setBrandLogoUrl] = useState(tenant?.logo_url || '');
  const [minCancelHours, setMinCancelHours] = useState(String(tenant?.min_cancel_hours ?? 2));
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Repescagem de vaga cancelada no WhatsApp
  const [repescagemSlot, setRepescagemSlot] = useState(null);

  const [webhookUrl, setWebhookUrl] = useState(tenant?.whatsapp_webhook_url || '');
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);

  const [clientSearch, setClientSearch] = useState('');
  const [promoTemplate, setPromoTemplate] = useState(
    `Fala {nome}! Tudo certo? Passando para avisar que estamos com horários especiais essa semana aqui na ${tenant?.name || 'barbearia'}. Garanta seu horário pelo link: ${window.location.origin}/b/${tenant?.slug || ''}`
  );
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

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
  const [expCategory] = useState('Aluguel / Contas');
  const [expAmount, setExpAmount] = useState('');

  const [prodName, setProdName] = useState('');
  const [prodCategory] = useState('Finalizadores');
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

  const handleUploadLogoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const ext = file.name.split('.').pop();
    const filePath = `${tenant.id}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('barbershop-logos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setUploadingLogo(false);
      notify('Erro ao enviar imagem: ' + uploadError.message);
      return;
    }

    const { data } = supabase.storage.from('barbershop-logos').getPublicUrl(filePath);
    setBrandLogoUrl(data.publicUrl);
    setUploadingLogo(false);
    notify('Logo carregada! Clique em Salvar Configurações.');
  };

  const handleSaveBrandIdentity = async (e) => {
    e.preventDefault();
    const cleanSlug = brandSlug
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!brandName.trim() || !cleanSlug) return;

    const { error } = await supabase
      .from('tenants')
      .update({
        name: brandName.trim(),
        slug: cleanSlug,
        logo_url: brandLogoUrl.trim() || null,
        min_cancel_hours: Number(minCancelHours) || 0,
      })
      .eq('id', tenant.id);

    if (error) {
      notify('Esse link já está em uso por outra barbearia.');
      return;
    }

    setShowBrandModal(false);
    notify('Marca e regras de cancelamento atualizadas!');
    onRefresh();
  };

  const handleSaveWebhook = async (e) => {
    e.preventDefault();
    await supabase
      .from('tenants')
      .update({ whatsapp_webhook_url: webhookUrl.trim() || null })
      .eq('id', tenant.id);
    setShowWebhookConfig(false);
    notify('Configuração de Webhook WhatsApp salva!');
    onRefresh();
  };

  const handleAddClientManual = async (e) => {
    e.preventDefault();
    const digits = newClientPhone.replace(/\D/g, '');
    if (!newClientName || !digits) return;

    const { error } = await supabase.from('clients').upsert(
      {
        tenant_id: tenant.id,
        name: newClientName.trim(),
        phone: newClientPhone.trim(),
        phone_clean: digits,
        total_visits: 1,
        last_visit: todayStr,
      },
      { onConflict: 'tenant_id,phone_clean' }
    );

    if (error) {
      notify('Erro ao salvar cliente: ' + error.message);
      return;
    }

    setNewClientName('');
    setNewClientPhone('');
    notify('Cliente adicionado à base!');
    onRefresh();
  };

  const handleDeleteClient = async (id) => {
    await supabase.from('clients').delete().eq('id', id);
    notify('Cliente removido da lista.');
    onRefresh();
  };

  const handleSendPromoWhatsApp = (client) => {
    const firstName = client.name.split(' ')[0];
    const personalizedText = promoTemplate.replace(/\{nome\}/gi, firstName);
    openWhatsAppMessage(client.phone, personalizedText);
  };

  const handleConfirmAppointmentWhatsApp = (apt) => {
    const srv = services.find((s) => s.id === apt.service_id);
    const brb = barbers.find((b) => b.id === apt.barber_id);
    const msg = `Olá *${apt.client_name}*! Aqui é da *${tenant.name}* 💈\n\nConfirmando seu horário:\n✂️ *Serviço:* ${srv?.name || 'Atendimento'}\n👤 *Profissional:* ${brb?.name || 'Equipe'}\n📅 *Data:* ${apt.date} às *${apt.time?.slice(0, 5)}*\n\nTe aguardamos!`;
    openWhatsAppMessage(apt.client_phone, msg);
  };

  const handleNotifyCancellationWhatsApp = (apt) => {
    const msg = `Olá *${apt.client_name}*, aqui é da *${tenant.name}*. Confirmamos o cancelamento do seu horário do dia *${apt.date}* às *${apt.time?.slice(0, 5)}*. Quando quiser reagendar, acesse: ${window.location.origin}/b/${tenant.slug}`;
    openWhatsAppMessage(apt.client_phone, msg);
  };

  const handleOpenRepescagem = (apt) => {
    const brb = barbers.find((b) => b.id === apt.barber_id);
    const text = `Fala {nome}! Liberou um horário aqui na *${tenant.name}* para *${apt.date}* às *${apt.time?.slice(0, 5)}*${brb ? ` com ${brb.name}` : ''}. Quer garantir essa vaga? Agende direto: ${window.location.origin}/b/${tenant.slug}`;
    setPromoTemplate(text);
    setRepescagemSlot({ date: apt.date, time: apt.time?.slice(0, 5) });
    setActiveTab('clientes');
    notify('Texto de vaga liberada carregado! Escolha o cliente para disparar.');
  };

  const updateAppointmentStatus = async (apt, nextStatus) => {
    const payload = { status: nextStatus };
    if (nextStatus === 'cancelled') {
      payload.cancellation_reason = 'Cancelado pela barbearia';
    } else if (nextStatus === 'no_show') {
      payload.cancellation_reason = 'Cliente faltou (No-show)';
    }

    await supabase.from('appointments').update(payload).eq('id', apt.id);

    // Incrementa contador de faltas (no-show) na ficha do cliente
    if (nextStatus === 'no_show' && apt.client_phone) {
      const digits = apt.client_phone.replace(/\D/g, '');
      const matchedClient = clients.find((c) => c.phone_clean === digits);
      if (matchedClient) {
        await supabase
          .from('clients')
          .update({ no_show_count: (matchedClient.no_show_count || 0) + 1 })
          .eq('id', matchedClient.id);
      }
    }

    if (nextStatus === 'completed') {
      notify('Atendimento concluído e lançado no caixa!');
    } else if (nextStatus === 'no_show') {
      notify('Falta (No-show) registrada no histórico do cliente.');
    } else {
      notify('Agendamento cancelado e horário liberado.');
    }
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

  const todayAppointments = appointments.filter(
    (a) => a.date === todayStr && a.status !== 'cancelled' && a.status !== 'no_show'
  );
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

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone.includes(clientSearch)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-zinc-900/80 backdrop-blur border border-zinc-800">
        <BrandLogo
          title={tenant.name}
          badge="GESTÃO"
          subtitle={`Proprietário: ${profile?.full_name || tenant.owner_name}`}
          logoUrl={tenant.logo_url}
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setBrandName(tenant.name || '');
              setBrandSlug(tenant.slug || '');
              setBrandLogoUrl(tenant.logo_url || '');
              setMinCancelHours(String(tenant.min_cancel_hours ?? 2));
              setShowBrandModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 hover:border-amber-500/50 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
            title="Personalizar Nome, Logo e Regras"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" /> Personalizar Marca
          </button>

          <button
            onClick={onCopyLink}
            className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Copy className="w-3.5 h-3.5" /> Copiar Link Exclusivo
          </button>

          <button
            onClick={() => { setWebhookUrl(tenant.whatsapp_webhook_url || ''); setShowWebhookConfig(!showWebhookConfig); }}
            className={`p-2 rounded-xl border transition ${
              tenant.whatsapp_webhook_url
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Configurar Automação WhatsApp (Webhook)"
          >
            <Webhook className="w-3.5 h-3.5" />
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

          <button
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold flex items-center gap-1.5 hover:border-zinc-700 transition"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>

      {showWebhookConfig && (
        <form onSubmit={handleSaveWebhook} className="mt-4 p-4 rounded-2xl bg-zinc-900 border border-emerald-500/30 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
              <Webhook className="w-3.5 h-3.5" /> Disparo Automático no WhatsApp (Opcional via Evolution API / Z-API / Make / n8n)
            </p>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="Cole aqui a URL do seu Webhook (ex: https://seu-n8n.com/webhook/navalha)"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs">
            Salvar Webhook
          </button>
        </form>
      )}

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
            <span>Base de Clientes</span>
            <MessageCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1.5">{clients.length}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">contatos salvos para promoções</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-emerald-500/25">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
            <span>Lucro Líquido ({selectedMonth})</span>
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

      <nav className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'agenda', label: `Agenda (${appointments.length})`, icon: Calendar },
          { id: 'clientes', label: `Clientes & Promoções (${clients.length})`, icon: Megaphone },
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

      {/* ABA AGENDA COM GESTÃO DE CANCELAMENTO, NO-SHOW E REPESCAGEM */}
      {activeTab === 'agenda' && (
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="font-black text-base text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" /> Agendamentos da Barbearia
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Conclua atendimentos, registre faltas (No-show) ou ofereça horários cancelados no WhatsApp
              </p>
            </div>
            <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400">
              Antecedência p/ cliente cancelar: <strong className="text-amber-400">{tenant.min_cancel_hours ?? 2}h</strong>
            </span>
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
                const phoneDigits = (a.client_phone || '').replace(/\D/g, '');
                const clientRecord = clients.find((c) => c.phone_clean === phoneDigits);

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
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-sm text-white">
                            {a.client_name}{' '}
                            <span className="text-xs font-normal text-zinc-500">• {a.client_phone}</span>
                          </p>
                          {(clientRecord?.no_show_count || 0) > 0 && (
                            <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-bold">
                              {clientRecord.no_show_count} falta(s)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          <span className="text-zinc-200 font-semibold">{srv?.name || 'Serviço'}</span>
                          {brb ? ` • Barbeiro: ${brb.name}` : ''}
                        </p>
                        {a.cancellation_reason && (a.status === 'cancelled' || a.status === 'no_show') && (
                          <p className="text-[11px] text-rose-400/90 mt-1">
                            Motivo: {a.cancellation_reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleConfirmAppointmentWhatsApp(a)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/25 transition inline-flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </button>

                      <span className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400 text-xs font-black">
                        R$ {Number(a.price_snapshot).toFixed(2)}
                      </span>

                      {a.status === 'scheduled' ? (
                        <>
                          <button
                            onClick={() => updateAppointmentStatus(a, 'completed')}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-zinc-950 text-xs font-black hover:bg-amber-400 transition"
                          >
                            Concluir
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(a, 'no_show')}
                            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-bold hover:text-rose-400 transition inline-flex items-center gap-1"
                            title="Marcar falta sem aviso"
                          >
                            <UserX className="w-3.5 h-3.5" /> Faltou
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(a, 'cancelled')}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 text-xs font-bold hover:bg-rose-500/25 transition"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              a.status === 'completed'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : a.status === 'no_show'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {a.status === 'completed'
                              ? 'Concluído'
                              : a.status === 'no_show'
                              ? 'Faltou (No-show)'
                              : 'Cancelado'}
                          </span>

                          {(a.status === 'cancelled' || a.status === 'no_show') && (
                            <>
                              <button
                                onClick={() => handleNotifyCancellationWhatsApp(a)}
                                className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white font-bold"
                                title="Confirmar cancelamento para o cliente"
                              >
                                Avisar Cliente
                              </button>
                              <button
                                onClick={() => handleOpenRepescagem(a)}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-400 hover:bg-amber-500/25 font-bold"
                                title="Oferecer esse horário vago para outros clientes"
                              >
                                Repescar Vaga
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA CLIENTES & PROMOÇÕES */}
      {activeTab === 'clientes' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/80 backdrop-blur border border-amber-500/30 rounded-3xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="font-black text-base text-white flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-amber-400" />
                  {repescagemSlot
                    ? `Repescagem de Horário Livre (${repescagemSlot.date} às ${repescagemSlot.time})`
                    : 'Campanha Promocional via WhatsApp'}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Personalize o texto abaixo (use <strong>{'{nome}'}</strong> para inserir automaticamente o nome de cada cliente) e clique em <strong>Enviar Mensagem</strong>
                </p>
              </div>
              {repescagemSlot && (
                <button
                  onClick={() => {
                    setRepescagemSlot(null);
                    setPromoTemplate(
                      `Fala {nome}! Tudo certo? Passando para avisar que estamos com horários especiais essa semana aqui na ${tenant.name}. Garanta seu horário pelo link: ${window.location.origin}/b/${tenant.slug}`
                    );
                  }}
                  className="text-xs text-zinc-400 hover:text-white underline"
                >
                  Voltar para texto padrão
                </button>
              )}
            </div>

            <textarea
              rows={3}
              value={promoTemplate}
              onChange={(e) => setPromoTemplate(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="font-black text-base text-white">
                  Carteira de Clientes ({clients.length})
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Alimentada automaticamente a cada agendamento realizado no seu link exclusivo
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou telefone..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <form onSubmit={handleAddClientManual} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
              <input
                type="text"
                required
                placeholder="Nome do cliente"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
              <input
                type="text"
                required
                placeholder="WhatsApp (ex: 82 99999-9999)"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
              <button
                type="submit"
                className="py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" /> Adicionar Cliente Manualmente
              </button>
            </form>

            {filteredClients.length === 0 ? (
              <p className="text-sm text-zinc-400 py-8 text-center border border-dashed border-zinc-800 rounded-2xl">
                Nenhum cliente encontrado. Assim que alguém agendar pelo seu link, aparecerá aqui automaticamente.
              </p>
            ) : (
              <div className="overflow-x-auto border border-zinc-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Cliente</th>
                      <th className="py-3.5 px-4">WhatsApp</th>
                      <th className="py-3.5 px-4">Histórico</th>
                      <th className="py-3.5 px-4">Última Visita</th>
                      <th className="py-3.5 px-4 text-right">Disparo Direto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 bg-zinc-950/60">
                    {filteredClients.map((c) => (
                      <tr key={c.id} className="hover:bg-zinc-900/50">
                        <td className="py-3.5 px-4 font-bold text-white text-sm">{c.name}</td>
                        <td className="py-3.5 px-4 text-zinc-300 font-medium">{c.phone}</td>
                        <td className="py-3.5 px-4 space-x-1.5">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 font-bold">
                            {c.total_visits} {c.total_visits === 1 ? 'visita' : 'visitas'}
                          </span>
                          {(c.no_show_count || 0) > 0 && (
                            <span className="px-2 py-1 rounded-lg bg-rose-500/15 text-rose-400 font-bold">
                              {c.no_show_count} falta(s)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-400">{c.last_visit || '—'}</td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleSendPromoWhatsApp(c)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold inline-flex items-center gap-1.5 hover:bg-emerald-500/30 transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Enviar Mensagem
                          </button>
                          <button
                            onClick={() => handleDeleteClient(c.id)}
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
            )}
          </div>
        </div>
      )}

      {/* ABA SERVIÇOS */}
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

      {/* ABA BARBEIROS */}
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

      {/* ABA FINANCEIRO */}
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

      {/* ABA ESTOQUE */}
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

      {/* MODAL IDENTIDADE VISUAL & POLÍTICA DE CANCELAMENTO */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-base text-white">Marca e Regras da Barbearia</h3>
              <button onClick={() => setShowBrandModal(false)} className="p-1.5 text-zinc-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBrandIdentity} className="space-y-4">
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                {brandLogoUrl ? (
                  <img src={brandLogoUrl} alt="Prévia" className="w-14 h-14 rounded-xl object-cover border border-amber-500/40" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                    <Scissors className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition">
                    {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{uploadingLogo ? 'Enviando...' : 'Enviar Imagem da Logo'}</span>
                    <input type="file" accept="image/*" onChange={handleUploadLogoFile} className="hidden" />
                  </label>
                  <p className="text-[11px] text-zinc-500 mt-1">PNG, JPG ou WebP (quadrada)</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Nome da Barbearia</label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Link Exclusivo (/b/...)</label>
                <input
                  type="text"
                  required
                  value={brandSlug}
                  onChange={(e) => setBrandSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                  Prazo Mínimo para o Cliente Cancelar pelo Site
                </label>
                <select
                  value={minCancelHours}
                  onChange={(e) => setMinCancelHours(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                >
                  <option value="0">Livre (pode cancelar a qualquer momento)</option>
                  <option value="1">Até 1 hora antes do corte</option>
                  <option value="2">Até 2 horas antes do corte (Recomendado)</option>
                  <option value="4">Até 4 horas antes do corte</option>
                  <option value="6">Até 6 horas antes do corte</option>
                  <option value="24">Até 24 horas antes do corte</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={uploadingLogo}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm transition"
              >
                Salvar Configurações
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}