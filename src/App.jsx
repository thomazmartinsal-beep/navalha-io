import React, { useState, useMemo } from 'react';
import {
  Scissors, Calendar, Clock, User, Users, Shield, Crown, CheckCircle2,
  XCircle, AlertTriangle, Plus, Trash2, Edit3, DollarSign, TrendingUp,
  Package, BarChart3, Lock, Unlock, LogOut, ArrowLeft, ChevronRight,
  Store, CreditCard, Sparkles, Search, Sliders, Award, Eye, Phone
} from 'lucide-react';

// ============================================================================
// DADOS INICIAIS MULTI-TENANT (SIMULANDO BANCO DE DADOS RELACIONAL)
// ============================================================================

const PLANS = {
  start: { id: 'start', name: 'Start', price: 79, maxBarbers: 2, label: 'Até 2 cadeiras' },
  pro: { id: 'pro', name: 'Pro', price: 149, maxBarbers: 6, label: 'Até 6 cadeiras + Estoque & BI' },
  rede: { id: 'rede', name: 'Rede / Multi', price: 249, maxBarbers: 99, label: 'Cadeiras ilimitadas' },
};

const INITIAL_TENANTS = [
  {
    id: 'tenant-1',
    name: 'Barbearia Viking',
    slug: 'barbearia-viking',
    ownerName: 'Carlos Mendes',
    ownerEmail: 'carlos@vikingbarber.com.br',
    phone: '(82) 99911-2233',
    planId: 'pro',
    status: 'active', // active | trial | blocked
    expiresAt: '2026-12-15',
    gatewayFeePercent: 3.5,
  },
  {
    id: 'tenant-2',
    name: 'Corte & Navalha Studio',
    slug: 'corte-navalha',
    ownerName: 'André Souza',
    ownerEmail: 'andre@cortenavalha.com.br',
    phone: '(82) 98844-5566',
    planId: 'start',
    status: 'trial',
    expiresAt: '2026-11-26',
    gatewayFeePercent: 3.5,
  },
  {
    id: 'tenant-3',
    name: 'Don Barber Club',
    slug: 'don-barber',
    ownerName: 'Roberto Lima',
    ownerEmail: 'roberto@donbarber.com.br',
    phone: '(82) 99677-8899',
    planId: 'rede',
    status: 'blocked',
    expiresAt: '2026-11-10',
    gatewayFeePercent: 2.9,
  },
];

const INITIAL_SERVICES = [
  { id: 'srv-1', tenantId: 'tenant-1', name: 'Corte Degradê / Navalhado', price: 45, duration: 45, category: 'Cabelo', active: true },
  { id: 'srv-2', tenantId: 'tenant-1', name: 'Barba Terapia com Toalha Quente', price: 35, duration: 30, category: 'Barba', active: true },
  { id: 'srv-3', tenantId: 'tenant-1', name: 'Combo Viking (Corte + Barba)', price: 75, duration: 75, category: 'Combo', active: true },
  { id: 'srv-4', tenantId: 'tenant-1', name: 'Platinado / Nevou Completo', price: 140, duration: 120, category: 'Química', active: true },
  { id: 'srv-5', tenantId: 'tenant-2', name: 'Corte Social / Tesoura', price: 40, duration: 40, category: 'Cabelo', active: true },
  { id: 'srv-6', tenantId: 'tenant-2', name: 'Corte + Sobrancelha', price: 50, duration: 45, category: 'Combo', active: true },
  { id: 'srv-7', tenantId: 'tenant-3', name: 'Corte Executivo', price: 60, duration: 45, category: 'Cabelo', active: true },
];

const INITIAL_BARBERS = [
  {
    id: 'barb-1',
    tenantId: 'tenant-1',
    name: 'Lucas Silva',
    roleTitle: 'Barbeiro Sênior',
    email: 'lucas@vikingbarber.com.br',
    commissionPercent: 50,
    active: true,
    workHours: 'Seg a Sáb • 09:00 - 19:00',
    lunchBreak: '12:00 - 13:00',
    serviceIds: ['srv-1', 'srv-2', 'srv-3', 'srv-4'],
    rating: 4.9,
  },
  {
    id: 'barb-2',
    tenantId: 'tenant-1',
    name: 'Rafael Costa',
    roleTitle: 'Especialista em Degradê',
    email: 'rafael@vikingbarber.com.br',
    commissionPercent: 45,
    active: true,
    workHours: 'Ter a Sáb • 10:00 - 20:00',
    lunchBreak: '13:00 - 14:00',
    serviceIds: ['srv-1', 'srv-2', 'srv-3'],
    rating: 4.8,
  },
  {
    id: 'barb-3',
    tenantId: 'tenant-1',
    name: 'Matheus Oliveira',
    roleTitle: 'Barbeiro Júnior',
    email: 'matheus@vikingbarber.com.br',
    commissionPercent: 40,
    active: true,
    workHours: 'Qua a Sáb • 09:00 - 18:00',
    lunchBreak: '12:00 - 13:00',
    serviceIds: ['srv-1', 'srv-2'],
    rating: 4.7,
  },
  {
    id: 'barb-4',
    tenantId: 'tenant-2',
    name: 'André Souza',
    roleTitle: 'Master Barber',
    email: 'andre@cortenavalha.com.br',
    commissionPercent: 60,
    active: true,
    workHours: 'Seg a Sáb • 09:00 - 19:00',
    lunchBreak: '12:00 - 13:00',
    serviceIds: ['srv-5', 'srv-6'],
    rating: 5.0,
  },
  {
    id: 'barb-5',
    tenantId: 'tenant-2',
    name: 'Diego Martins',
    roleTitle: 'Barbeiro',
    email: 'diego@cortenavalha.com.br',
    commissionPercent: 45,
    active: true,
    workHours: 'Ter a Sáb • 10:00 - 19:00',
    lunchBreak: '13:00 - 14:00',
    serviceIds: ['srv-5'],
    rating: 4.6,
  },
];

const INITIAL_APPOINTMENTS = [
  {
    id: 'apt-101',
    tenantId: 'tenant-1',
    clientName: 'João Pedro Alves',
    clientPhone: '(82) 99123-4567',
    barberId: 'barb-1',
    serviceId: 'srv-3',
    date: '2026-11-19',
    time: '09:00',
    status: 'completed', // scheduled | completed | canceled
    priceSnapshot: 75,
    netAmount: 72.38,
    barberCommission: 36.19,
    paymentMethod: 'Pix',
  },
  {
    id: 'apt-102',
    tenantId: 'tenant-1',
    clientName: 'Marcos Vinícius',
    clientPhone: '(82) 99876-5432',
    barberId: 'barb-2',
    serviceId: 'srv-1',
    date: '2026-11-19',
    time: '10:00',
    status: 'scheduled',
    priceSnapshot: 45,
    netAmount: 0,
    barberCommission: 0,
    paymentMethod: 'Pendente',
  },
  {
    id: 'apt-103',
    tenantId: 'tenant-1',
    clientName: 'Felipe Vasconcelos',
    clientPhone: '(82) 98765-1122',
    barberId: 'barb-1',
    serviceId: 'srv-4',
    date: '2026-11-19',
    time: '14:00',
    status: 'scheduled',
    priceSnapshot: 140,
    netAmount: 0,
    barberCommission: 0,
    paymentMethod: 'Pendente',
  },
  {
    id: 'apt-104',
    tenantId: 'tenant-2',
    clientName: 'Gustavo Henrique',
    clientPhone: '(82) 99333-4455',
    barberId: 'barb-4',
    serviceId: 'srv-6',
    date: '2026-11-19',
    time: '11:00',
    status: 'scheduled',
    priceSnapshot: 50,
    netAmount: 0,
    barberCommission: 0,
    paymentMethod: 'Pendente',
  },
];

const INITIAL_INVENTORY = [
  { id: 'inv-1', tenantId: 'tenant-1', name: 'Pomada Efeito Matte 150g', stock: 18, minStock: 6, cost: 18, price: 45, curve: 'A' },
  { id: 'inv-2', tenantId: 'tenant-1', name: 'Óleo para Barba Cedro 30ml', stock: 4, minStock: 5, cost: 15, price: 38, curve: 'A' },
  { id: 'inv-3', tenantId: 'tenant-1', name: 'Lâmina Platina (Caixa 100un)', stock: 12, minStock: 4, cost: 28, price: 0, curve: 'B' },
  { id: 'inv-4', tenantId: 'tenant-1', name: 'Shampoo Mentolado 1L', stock: 2, minStock: 3, cost: 32, price: 65, curve: 'C' },
  { id: 'inv-5', tenantId: 'tenant-2', name: 'Pomada Modeladora Black', stock: 10, minStock: 4, cost: 16, price: 40, curve: 'A' },
];

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const BrandLogo = ({ subtitle = 'SaaS Multi-Barbearias' }) => (
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

const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    trial: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    blocked: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  };
  const labels = {
    active: 'Ativa',
    trial: 'Trial 7d',
    blocked: 'Bloqueada',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.active}`}>
      {labels[status] || status}
    </span>
  );
};

// ============================================================================
// APLICAÇÃO PRINCIPAL
// ============================================================================

export default function App() {
  // Estados Globais do SaaS
  const [tenants, setTenants] = useState(INITIAL_TENANTS);
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [barbers, setBarbers] = useState(INITIAL_BARBERS);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);

  // Controle de Sessão e Navegação
  // session: null (Público) | { role: 'super_admin' } | { role: 'owner', tenantId, impersonating? } | { role: 'barber', tenantId, barberId }
  const [session, setSession] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Tenant selecionado na vitrine pública (simula acesso via slug navalha.io/:slug)
  const [publicTenantId, setPublicTenantId] = useState('tenant-1');

  // Toast de Feedback
  const [toast, setToast] = useState(null);
  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ==========================================================================
  // HANDLERS DE AUTENTICAÇÃO
  // ==========================================================================
  const handleQuickLogin = (role, tenantId = null, barberId = null) => {
    setLoginError('');
    setShowLoginModal(false);
    if (role === 'super_admin') {
      setSession({ role: 'super_admin', name: 'Fundador Navalha.io' });
      notify('Bem-vindo ao Painel Master (Super Admin)');
    } else if (role === 'owner') {
      const t = tenants.find((item) => item.id === tenantId);
      setSession({ role: 'owner', tenantId, name: t?.ownerName || 'Gestor', impersonating: false });
      notify(`Acessando painel de ${t?.name}`);
    } else if (role === 'barber') {
      const b = barbers.find((item) => item.id === barberId);
      setSession({ role: 'barber', tenantId: b.tenantId, barberId, name: b.name });
      notify(`Olá, ${b.name}! Sua agenda está aberta.`);
    }
  };

  const handleFormLogin = (e) => {
    e.preventDefault();
    const email = loginEmail.trim().toLowerCase();
    if (email === 'admin@navalha.io' || email === 'master@navalha.io') {
      return handleQuickLogin('super_admin');
    }
    const ownerTenant = tenants.find((t) => t.ownerEmail.toLowerCase() === email);
    if (ownerTenant) {
      return handleQuickLogin('owner', ownerTenant.id);
    }
    const barberUser = barbers.find((b) => b.email.toLowerCase() === email);
    if (barberUser) {
      return handleQuickLogin('barber', barberUser.tenantId, barberUser.id);
    }
    setLoginError('Usuário não encontrado. Use um dos botões de acesso rápido abaixo para testar.');
  };

  // ==========================================================================
  // RENDERIZAÇÃO CONDICIONAL POR PERFIL
  // ==========================================================================
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* Notificação Flutuante */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-zinc-900 border border-amber-500/40 shadow-2xl text-sm font-medium text-white animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Faixa de Modo Suporte Master (quando Super Admin entra numa barbearia) */}
      {session?.impersonating && (
        <div className="bg-amber-500 text-zinc-950 px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>
              MODO SUPORTE MASTER ATIVO — Você está operando o painel de{' '}
              <u>{tenants.find((t) => t.id === session.tenantId)?.name}</u>
            </span>
          </div>
          <button
            onClick={() => setSession({ role: 'super_admin', name: 'Fundador Navalha.io' })}
            className="px-3 py-1 rounded-lg bg-zinc-950 text-amber-400 hover:bg-zinc-900 transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao Painel Master
          </button>
        </div>
      )}

      {/* Roteamento de Telas */}
      {!session && (
        <PublicBookingView
          tenants={tenants}
          publicTenantId={publicTenantId}
          setPublicTenantId={setPublicTenantId}
          services={services}
          barbers={barbers}
          appointments={appointments}
          setAppointments={setAppointments}
          onOpenLogin={() => setShowLoginModal(true)}
          notify={notify}
        />
      )}

      {session?.role === 'super_admin' && (
        <SuperAdminDashboard
          tenants={tenants}
          setTenants={setTenants}
          barbers={barbers}
          setBarbers={setBarbers}
          services={services}
          setServices={setServices}
          appointments={appointments}
          onImpersonate={(tenantId) =>
            setSession({
              role: 'owner',
              tenantId,
              name: 'Suporte Master',
              impersonating: true,
            })
          }
          onLogout={() => setSession(null)}
          notify={notify}
        />
      )}

      {(session?.role === 'owner' || session?.role === 'barber') && (
        <TenantAdminDashboard
          session={session}
          tenant={tenants.find((t) => t.id === session.tenantId)}
          services={services.filter((s) => s.tenantId === session.tenantId)}
          allServices={services}
          setServices={setServices}
          barbers={barbers.filter((b) => b.tenantId === session.tenantId)}
          allBarbers={barbers}
          setBarbers={setBarbers}
          appointments={appointments.filter((a) => a.tenantId === session.tenantId)}
          allAppointments={appointments}
          setAppointments={setAppointments}
          inventory={inventory.filter((i) => i.tenantId === session.tenantId)}
          setInventory={setInventory}
          onLogout={() => setSession(null)}
          notify={notify}
        />
      )}

      {/* Modal de Login Unificado */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <BrandLogo subtitle="Acesso Restrito & Gestão" />
              <button
                onClick={() => setShowLoginModal(false)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ex: admin@navalha.io"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  Senha
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {loginError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition shadow-lg shadow-amber-500/20"
              >
                Entrar no Sistema
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-zinc-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3 text-center">
                Acesso Rápido para Demonstração (1 Clique)
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => handleQuickLogin('super_admin')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition"
                >
                  <span className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    Super Admin (Você — Dono do SaaS)
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleQuickLogin('owner', 'tenant-1')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold transition"
                >
                  <span className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-400" />
                    Dono Barbearia (Barbearia Viking - Pro)
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleQuickLogin('owner', 'tenant-3')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold transition"
                >
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-400" />
                    Dono Barbearia (Don Barber - Bloqueada)
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleQuickLogin('barber', 'tenant-1', 'barb-1')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold transition"
                >
                  <span className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-sky-400" />
                    Colaborador (Lucas Silva - Barbeiro)
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 1. PAINEL MASTER (SUPER ADMIN — DONO DO PROJETO SAAS)
// ============================================================================

function SuperAdminDashboard({
  tenants,
  setTenants,
  barbers,
  setBarbers,
  services,
  setServices,
  appointments,
  onImpersonate,
  onLogout,
  notify,
}) {
  const [activeTab, setActiveTab] = useState('tenants'); // tenants | users | plans
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  // Formulário Nova Barbearia / Licença
  const [newShop, setNewShop] = useState({
    name: '',
    slug: '',
    ownerName: '',
    ownerEmail: '',
    phone: '',
    planId: 'pro',
    status: 'active',
  });

  // Métricas Globais do SaaS
  const metrics = useMemo(() => {
    const activeCount = tenants.filter((t) => t.status === 'active').length;
    const trialCount = tenants.filter((t) => t.status === 'trial').length;
    const blockedCount = tenants.filter((t) => t.status === 'blocked').length;
    const mrr = tenants
      .filter((t) => t.status === 'active')
      .reduce((acc, t) => acc + (PLANS[t.planId]?.price || 0), 0);
    return { activeCount, trialCount, blockedCount, mrr };
  }, [tenants]);

  const handleCreateTenant = (e) => {
    e.preventDefault();
    if (!newShop.name || !newShop.ownerName || !newShop.ownerEmail) return;
    const id = `tenant-${Date.now()}`;
    const generatedSlug =
      newShop.slug.trim() ||
      newShop.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-');

    const created = {
      id,
      ...newShop,
      slug: generatedSlug,
      expiresAt: '2026-12-19',
      gatewayFeePercent: 3.5,
    };

    setTenants([created, ...tenants]);

    // Cria serviço inicial padrão para a nova barbearia não começar vazia
    setServices([
      ...services,
      {
        id: `srv-${Date.now()}`,
        tenantId: id,
        name: 'Corte Masculino Padrão',
        price: 45,
        duration: 45,
        category: 'Cabelo',
        active: true,
      },
    ]);

    setNewShop({
      name: '',
      slug: '',
      ownerName: '',
      ownerEmail: '',
      phone: '',
      planId: 'pro',
      status: 'active',
    });
    setShowNewModal(false);
    notify(`Barbearia "${created.name}" criada e licença ativada!`);
  };

  const toggleTenantStatus = (tenantId) => {
    setTenants(
      tenants.map((t) => {
        if (t.id !== tenantId) return t;
        const nextStatus = t.status === 'blocked' ? 'active' : 'blocked';
        notify(
          nextStatus === 'blocked'
            ? `Licença de ${t.name} suspensa imediatamente.`
            : `Licença de ${t.name} reativada!`
        );
        return { ...t, status: nextStatus };
      })
    );
  };

  const changeTenantPlan = (tenantId, newPlanId) => {
    setTenants(
      tenants.map((t) => (t.id === tenantId ? { ...t, planId: newPlanId } : t))
    );
    notify(`Plano atualizado para ${PLANS[newPlanId].name}.`);
  };

  const renewLicense = (tenantId) => {
    setTenants(
      tenants.map((t) =>
        t.id === tenantId
          ? { ...t, status: 'active', expiresAt: '2027-01-19' }
          : t
      )
    );
    notify('Licença renovada por +30 dias!');
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header Master */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <BrandLogo subtitle="Console Master • Super Admin" />
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <Crown className="w-3.5 h-3.5" /> Dono da Plataforma
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4" /> Nova Barbearia / Licença
          </button>
          <button
            onClick={onLogout}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs sm:text-sm font-semibold flex items-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>

      {/* KPIs Globais do SaaS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span>MRR (Receita Mensal)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            R$ {metrics.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-emerald-400 mt-1">Assinaturas ativas recorrentes</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span>Barbearias Ativas</span>
            <Store className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{metrics.activeCount}</p>
          <p className="text-xs text-zinc-400 mt-1">Operando sem restrições</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span>Em Período Trial</span>
            <Sparkles className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{metrics.trialCount}</p>
          <p className="text-xs text-sky-400 mt-1">Avaliação gratuita 7 dias</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span>Licenças Suspensas</span>
            <Lock className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{metrics.blockedCount}</p>
          <p className="text-xs text-rose-400 mt-1">Acesso bloqueado por vencimento</p>
        </div>
      </div>

      {/* Navegação Interna Master */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
              activeTab === 'tenants'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Barbearias & Licenças ({tenants.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
              activeTab === 'users'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Usuários Globais ({tenants.length + barbers.length})
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
              activeTab === 'plans'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tabela de Planos SaaS
          </button>
        </div>

        {activeTab === 'tenants' && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar barbearia, dono ou slug..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        )}
      </div>

      {/* ABA 1: BARBEARIAS & LICENÇAS */}
      {activeTab === 'tenants' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-3.5 px-4">Barbearia / Link</th>
                  <th className="py-3.5 px-4">Responsável</th>
                  <th className="py-3.5 px-4">Plano Mensal</th>
                  <th className="py-3.5 px-4">Cadeiras</th>
                  <th className="py-3.5 px-4">Vencimento</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Controles Master</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-sm">
                {filteredTenants.map((t) => {
                  const plan = PLANS[t.planId] || PLANS.start;
                  const activeBarbersCount = barbers.filter(
                    (b) => b.tenantId === t.id && b.active
                  ).length;

                  return (
                    <tr key={t.id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-4 px-4">
                        <p className="font-bold text-white">{t.name}</p>
                        <p className="text-xs text-amber-400/90 font-mono">
                          navalha.io/{t.slug}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-zinc-200 font-medium">{t.ownerName}</p>
                        <p className="text-xs text-zinc-500">{t.ownerEmail}</p>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={t.planId}
                          onChange={(e) => changeTenantPlan(t.id, e.target.value)}
                          className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="start">Start — R$ 79/mês</option>
                          <option value="pro">Pro — R$ 149/mês</option>
                          <option value="rede">Rede — R$ 249/mês</option>
                        </select>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200">
                          {activeBarbersCount} / {plan.maxBarbers === 99 ? '∞' : plan.maxBarbers}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-zinc-300 font-mono">
                        {t.expiresAt}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => onImpersonate(t.id)}
                            title="Entrar no painel desta barbearia"
                            className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-zinc-950 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" /> Entrar
                          </button>
                          <button
                            onClick={() => renewLicense(t.id)}
                            title="Renovar assinatura +30 dias"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                          >
                            +30d
                          </button>
                          <button
                            onClick={() => toggleTenantStatus(t.id)}
                            title={t.status === 'blocked' ? 'Desbloquear licença' : 'Suspender licença'}
                            className={`p-1.5 rounded-lg border transition ${
                              t.status === 'blocked'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                            }`}
                          >
                            {t.status === 'blocked' ? (
                              <Unlock className="w-4 h-4" />
                            ) : (
                              <Lock className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 2: USUÁRIOS GLOBAIS */}
      {activeTab === 'users' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-base font-bold text-white mb-4">
            Diretório Global de Contas (Donos & Colaboradores)
          </h3>
          <div className="space-y-3">
            {tenants.map((t) => (
              <div
                key={`owner-${t.id}`}
                className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800"
              >
                <div>
                  <p className="text-sm font-bold text-white">{t.ownerName}</p>
                  <p className="text-xs text-zinc-400">{t.ownerEmail}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300">
                    {t.name}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Dono / Admin
                  </span>
                </div>
              </div>
            ))}

            {barbers.map((b) => {
              const shop = tenants.find((t) => t.id === b.tenantId);
              return (
                <div
                  key={`barber-${b.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800"
                >
                  <div>
                    <p className="text-sm font-bold text-white">{b.name}</p>
                    <p className="text-xs text-zinc-400">{b.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300">
                      {shop?.name}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                      Colaborador ({b.commissionPercent}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 3: PLANOS SAAS */}
      {activeTab === 'plans' && (
        <div className="grid md:grid-cols-3 gap-6">
          {Object.values(PLANS).map((plan) => (
            <div
              key={plan.id}
              className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Plano {plan.name}
                </span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">R$ {plan.price}</span>
                  <span className="text-xs text-zinc-400">/mês por unidade</span>
                </div>
                <p className="text-sm text-zinc-300 mt-3">{plan.label}</p>
                <ul className="mt-5 space-y-2.5 text-xs text-zinc-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Link exclusivo de agendamento online
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Gestão de escalas e comissões por barbeiro
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Limite automático de {plan.maxBarbers === 99 ? 'cadeiras ilimitadas' : `${plan.maxBarbers} cadeiras ativas`}
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800 text-xs text-zinc-400">
                Assinantes atuais:{' '}
                <strong className="text-white">
                  {tenants.filter((t) => t.planId === plan.id).length} barbearias
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar Nova Barbearia */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Cadastrar Nova Barbearia (Tenant)</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Nome da Barbearia *
                  </label>
                  <input
                    required
                    type="text"
                    value={newShop.name}
                    onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
                    placeholder="Ex: Barbearia Imperial"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Slug (URL Personalizada)
                  </label>
                  <input
                    type="text"
                    value={newShop.slug}
                    onChange={(e) => setNewShop({ ...newShop, slug: e.target.value })}
                    placeholder="barbearia-imperial"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Nome do Proprietário *
                  </label>
                  <input
                    required
                    type="text"
                    value={newShop.ownerName}
                    onChange={(e) => setNewShop({ ...newShop, ownerName: e.target.value })}
                    placeholder="Ex: Thiago Santos"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    E-mail de Login do Dono *
                  </label>
                  <input
                    required
                    type="email"
                    value={newShop.ownerEmail}
                    onChange={(e) => setNewShop({ ...newShop, ownerEmail: e.target.value })}
                    placeholder="thiago@imperial.com"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Plano Contratado
                  </label>
                  <select
                    value={newShop.planId}
                    onChange={(e) => setNewShop({ ...newShop, planId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                  >
                    <option value="start">Start — R$ 79/mês (2 cadeiras)</option>
                    <option value="pro">Pro — R$ 149/mês (6 cadeiras)</option>
                    <option value="rede">Rede — R$ 249/mês (Ilimitado)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Status Inicial da Licença
                  </label>
                  <select
                    value={newShop.status}
                    onChange={(e) => setNewShop({ ...newShop, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                  >
                    <option value="active">Ativa (Paga)</option>
                    <option value="trial">Período Trial (7 dias)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-bold"
                >
                  Criar Barbearia & Liberar Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. PAINEL INTERNO DA BARBEARIA (DONO DA UNIDADE & COLABORADOR)
// ============================================================================

function TenantAdminDashboard({
  session,
  tenant,
  services,
  allServices,
  setServices,
  barbers,
  allBarbers,
  setBarbers,
  appointments,
  allAppointments,
  setAppointments,
  inventory,
  setInventory,
  onLogout,
  notify,
}) {
  const isOwner = session.role === 'owner';
  const plan = PLANS[tenant?.planId] || PLANS.start;

  const [tab, setTab] = useState('agenda'); // agenda | team | services | finance | inventory
  const [showNewApptModal, setShowNewApptModal] = useState(false);
  const [showNewBarberModal, setShowNewBarberModal] = useState(false);
  const [showNewServiceModal, setShowNewServiceModal] = useState(false);

  // Estados de formulários internos
  const [newAppt, setNewAppt] = useState({
    clientName: '',
    clientPhone: '',
    barberId: barbers[0]?.id || '',
    serviceId: services[0]?.id || '',
    time: '15:00',
  });

  const [newBarber, setNewBarber] = useState({
    name: '',
    roleTitle: 'Barbeiro',
    email: '',
    commissionPercent: 45,
    workHours: 'Seg a Sáb • 09:00 - 19:00',
    lunchBreak: '12:00 - 13:00',
    serviceIds: services.map((s) => s.id),
  });

  const [newSrv, setNewSrv] = useState({
    name: '',
    price: 45,
    duration: 45,
    category: 'Cabelo',
  });

  // Se a licença desta barbearia estiver bloqueada pelo Super Admin:
  if (tenant?.status === 'blocked') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-rose-500/40 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-white">Licença Suspensa ou Vencida</h2>
          <p className="text-sm text-zinc-400 mt-2">
            O acesso administrativo e o link público de agendamento da unidade{' '}
            <strong className="text-white">{tenant.name}</strong> estão temporariamente pausados
            (vencimento: {tenant.expiresAt}).
          </p>
          <div className="mt-6 p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300">
            Entre em contato com o suporte <strong>Navalha.io</strong> para regularizar sua
            assinatura do plano <strong>{plan.name}</strong>.
          </div>
          <button
            onClick={onLogout}
            className="mt-6 w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold transition"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  // Filtra agenda caso seja um barbeiro logado vendo apenas a sua própria cadeira
  const visibleAppointments = isOwner
    ? appointments
    : appointments.filter((a) => a.barberId === session.barberId);

  const visibleBarbers = isOwner
    ? barbers
    : barbers.filter((b) => b.id === session.barberId);

  // Concluir atendimento e calcular Split Financeiro (Taxa Gateway -> Comissão Barbeiro -> Líquido Casa)
  const handleCompleteAppointment = (aptId) => {
    setAppointments(
      allAppointments.map((apt) => {
        if (apt.id !== aptId) return apt;
        const barber = barbers.find((b) => b.id === apt.barberId);
        const gross = apt.priceSnapshot;
        const fee = gross * ((tenant.gatewayFeePercent || 3.5) / 100);
        const net = Number((gross - fee).toFixed(2));
        const comm = Number((net * ((barber?.commissionPercent || 50) / 100)).toFixed(2));
        notify(`Comanda fechada! Comissão de ${barber?.name}: R$ ${comm.toFixed(2)}`);
        return {
          ...apt,
          status: 'completed',
          netAmount: net,
          barberCommission: comm,
          paymentMethod: 'Pix / Cartão',
        };
      })
    );
  };

  // Criar Encaixe Manual na Agenda
  const handleCreateAppointment = (e) => {
    e.preventDefault();
    const srv = services.find((s) => s.id === newAppt.serviceId);
    if (!newAppt.clientName || !srv) return;
    const created = {
      id: `apt-${Date.now()}`,
      tenantId: tenant.id,
      clientName: newAppt.clientName,
      clientPhone: newAppt.clientPhone || '(82) 99999-0000',
      barberId: newAppt.barberId || barbers[0]?.id,
      serviceId: srv.id,
      date: '2026-11-19',
      time: newAppt.time,
      status: 'scheduled',
      priceSnapshot: srv.price,
      netAmount: 0,
      barberCommission: 0,
      paymentMethod: 'Pendente',
    };
    setAppointments([...allAppointments, created]);
    setNewAppt({ ...newAppt, clientName: '', clientPhone: '' });
    setShowNewApptModal(false);
    notify('Encaixe adicionado na agenda!');
  };

  // Cadastrar Novo Colaborador (respeitando limite do plano SaaS)
  const handleCreateBarber = (e) => {
    e.preventDefault();
    const activeCount = barbers.filter((b) => b.active).length;
    if (activeCount >= plan.maxBarbers) {
      notify(
        `Limite do Plano ${plan.name} atingido (${plan.maxBarbers} cadeiras). Solicite upgrade ao Master.`,
        'error'
      );
      return;
    }
    const created = {
      id: `barb-${Date.now()}`,
      tenantId: tenant.id,
      name: newBarber.name,
      roleTitle: newBarber.roleTitle,
      email: newBarber.email || `${newBarber.name.toLowerCase().replace(/\s+/g, '')}@barber.com`,
      commissionPercent: Number(newBarber.commissionPercent),
      active: true,
      workHours: newBarber.workHours,
      lunchBreak: newBarber.lunchBreak,
      serviceIds: newBarber.serviceIds,
      rating: 5.0,
    };
    setBarbers([...allBarbers, created]);
    setShowNewBarberModal(false);
    notify(`Colaborador ${created.name} adicionado à equipe!`);
  };

  // Alternar atribuição de serviço a um barbeiro específico
  const toggleBarberService = (barberId, serviceId) => {
    setBarbers(
      allBarbers.map((b) => {
        if (b.id !== barberId) return b;
        const exists = b.serviceIds.includes(serviceId);
        const updatedIds = exists
          ? b.serviceIds.filter((id) => id !== serviceId)
          : [...b.serviceIds, serviceId];
        return { ...b, serviceIds: updatedIds };
      })
    );
    notify('Atribuição de serviço atualizada!');
  };

  // Atualizar comissão individual do barbeiro
  const updateBarberCommission = (barberId, newPercent) => {
    setBarbers(
      allBarbers.map((b) =>
        b.id === barberId ? { ...b, commissionPercent: Number(newPercent) } : b
      )
    );
  };

  // Adicionar Novo Serviço da Barbearia
  const handleCreateService = (e) => {
    e.preventDefault();
    if (!newSrv.name) return;
    const created = {
      id: `srv-${Date.now()}`,
      tenantId: tenant.id,
      name: newSrv.name,
      price: Number(newSrv.price),
      duration: Number(newSrv.duration),
      category: newSrv.category,
      active: true,
    };
    setServices([...allServices, created]);
    setNewSrv({ name: '', price: 45, duration: 45, category: 'Cabelo' });
    setShowNewServiceModal(false);
    notify(`Serviço "${created.name}" adicionado ao catálogo!`);
  };

  // Cálculos Financeiros da Barbearia
  const finSummary = useMemo(() => {
    const completed = visibleAppointments.filter((a) => a.status === 'completed');
    const gross = completed.reduce((acc, a) => acc + a.priceSnapshot, 0);
    const net = completed.reduce((acc, a) => acc + a.netAmount, 0);
    const commissions = completed.reduce((acc, a) => acc + a.barberCommission, 0);
    const shopProfit = Number((net - commissions).toFixed(2));
    return { gross, net, commissions, shopProfit, count: completed.length };
  }, [visibleAppointments]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Cabeçalho da Barbearia */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-white">{tenant.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Plano {plan.name}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Logado como <strong className="text-zinc-200">{session.name}</strong> (
            {isOwner ? 'Administrador da Unidade' : 'Colaborador'}) • Link público:{' '}
            <span className="text-amber-400 font-mono">navalha.io/{tenant.slug}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewApptModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" /> Novo Encaixe
          </button>
          <button
            onClick={onLogout}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs sm:text-sm font-semibold flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>

      {/* Menu de Módulos Internos */}
      <nav className="flex gap-2 overflow-x-auto py-5 border-b border-zinc-800/80 mb-6">
        <button
          onClick={() => setTab('agenda')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap flex items-center gap-2 transition ${
            tab === 'agenda'
              ? 'bg-amber-500 text-zinc-950'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Calendar className="w-4 h-4" /> Agenda do Dia ({visibleAppointments.length})
        </button>

        {isOwner && (
          <>
            <button
              onClick={() => setTab('team')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap flex items-center gap-2 transition ${
                tab === 'team'
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Users className="w-4 h-4" /> Equipe & Atribuições ({barbers.length}/{plan.maxBarbers === 99 ? '∞' : plan.maxBarbers})
            </button>

            <button
              onClick={() => setTab('services')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap flex items-center gap-2 transition ${
                tab === 'services'
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Scissors className="w-4 h-4" /> Catálogo de Serviços ({services.length})
            </button>

            <button
              onClick={() => setTab('inventory')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap flex items-center gap-2 transition ${
                tab === 'inventory'
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Package className="w-4 h-4" /> Estoque Curva A/C
            </button>
          </>
        )}

        <button
          onClick={() => setTab('finance')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap flex items-center gap-2 transition ${
            tab === 'finance'
              ? 'bg-amber-500 text-zinc-950'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> {isOwner ? 'Financeiro & Split' : 'Minhas Comissões'}
        </button>
      </nav>

      {/* MÓDULO 1: AGENDA DO DIA (COLUNAS POR CADEIRA) */}
      {tab === 'agenda' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">
              Quinta-feira, 19/11/2026 — Grade por Colaborador
            </h2>
            <span className="text-xs text-zinc-400">
              Clique em "Concluir & Receber" para calcular o split automático
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleBarbers.map((barber) => {
              const barberAppts = visibleAppointments.filter((a) => a.barberId === barber.id);
              return (
                <div
                  key={barber.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                    <div>
                      <h3 className="font-bold text-white flex items-center gap-2">
                        {barber.name}
                        <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-amber-400">
                          {barber.commissionPercent}% com.
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{barber.workHours}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                      {barberAppts.length} agend.
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 flex-1">
                    {barberAppts.length === 0 ? (
                      <div className="py-10 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                        Nenhum cliente agendado nesta cadeira hoje.
                      </div>
                    ) : (
                      barberAppts.map((apt) => {
                        const srv = services.find((s) => s.id === apt.serviceId);
                        const isDone = apt.status === 'completed';
                        return (
                          <div
                            key={apt.id}
                            className={`p-3.5 rounded-xl border transition ${
                              isDone
                                ? 'bg-emerald-950/20 border-emerald-500/30'
                                : 'bg-zinc-950 border-zinc-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-500/15 text-amber-400">
                                {apt.time}
                              </span>
                              <span className="text-xs font-bold text-white">
                                R$ {apt.priceSnapshot.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-white mt-2">{apt.clientName}</p>
                            <p className="text-xs text-zinc-400">{srv?.name || 'Serviço'}</p>

                            {isDone ? (
                              <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
                                <span>Concluído ({apt.paymentMethod})</span>
                                <span>Comissão: R$ {apt.barberCommission.toFixed(2)}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleCompleteAppointment(apt.id)}
                                className="mt-3 w-full py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-zinc-950 border border-emerald-500/30 text-xs font-bold transition"
                              >
                                Concluir & Receber
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MÓDULO 2: EQUIPE & ATRIBUIÇÕES (CONFIGURAÇÃO INTERNA DA BARBEARIA) */}
      {tab === 'team' && isOwner && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-base font-bold text-white">
                Atribuição de Colaboradores, Comissões e Serviços
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Seu plano <strong>{plan.name}</strong> permite até{' '}
                <strong>{plan.maxBarbers === 99 ? 'ilimitadas' : plan.maxBarbers} cadeiras</strong>{' '}
                ativas simultaneamente.
              </p>
            </div>
            <button
              onClick={() => setShowNewBarberModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Adicionar Colaborador
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {barbers.map((barber) => (
              <div
                key={barber.id}
                className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4"
              >
                <div className="flex items-start justify-between gap-3"></div>