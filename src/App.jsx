import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate, Link } from 'react-router-dom';
import {
  Scissors, Calendar, Clock, Users, Shield, Crown, CheckCircle2,
  XCircle, AlertTriangle, Plus, DollarSign, BarChart3,
  Lock, Unlock, LogOut, ArrowLeft, Store, Sparkles, Search, Eye,
  ExternalLink, MessageCircle, Loader2
} from 'lucide-react';
import { supabase } from './supabaseClient';

const PLANS = {
  start: { id: 'start', name: 'Start', price: 79, maxBarbers: 2, label: 'Até 2 cadeiras' },
  pro: { id: 'pro', name: 'Pro', price: 149, maxBarbers: 6, label: 'Até 6 cadeiras + Estoque & BI' },
  rede: { id: 'rede', name: 'Rede / Multi', price: 249, maxBarbers: 99, label: 'Cadeiras ilimitadas' },
};

const BrandLogo = ({ subtitle = 'SaaS Multi-Barbearias' }) => (
  <div className="flex items-center gap-3 select-none">
    <img src="/logo-navalha.svg" alt="Navalha.io" className="w-10 h-10 rounded-xl shadow-lg shadow-amber-500/15" />
    <div>
      <div className="flex items-center gap-1.5">
        <span className="text-lg font-black tracking-wider text-white">NAVALHA</span>
        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-zinc-950">.IO</span>
      </div>
      <p className="text-[11px] text-zinc-400 leading-none mt-1">{subtitle}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    trial: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    blocked: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  };
  const labels = { active: 'Ativa', trial: 'Trial 7d', blocked: 'Bloqueada' };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.active}`}>
      {labels[status] || status}
    </span>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingAndDirectory />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/painel" element={<AdminPortal />} />
        <Route path="/:slug" element={<PublicBookingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

/* ==================== 1. HOME / VITRINE SAAS ==================== */
function LandingAndDirectory() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('tenants')
      .select('id, name, slug, status')
      .neq('status', 'blocked')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setTenants(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="border-b border-zinc-800/90 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <BrandLogo subtitle="Gestão & Agendamento Inteligente" />
          <Link
            to="/login"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs sm:text-sm font-black flex items-center gap-2 transition shadow-lg shadow-amber-500/20"
          >
            <Shield className="w-4 h-4" /> Entrar no Painel
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-12">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Plataforma Oficial para Barbearias
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Sua barbearia no piloto automático, do <span className="text-amber-400">agendamento</span> ao <span className="text-amber-400">comissionamento</span>.
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 mt-4">
            Link exclusivo para clientes agendarem em 30 segundos, cálculo automático de comissões por barbeiro e controle completo de estoque.
          </p>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-400" /> Barbearias Ativas na Plataforma
          </h2>
          {loading ? (
            <div className="py-8 flex justify-center text-amber-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : tenants.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhuma unidade pública disponível no momento.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenants.map((t) => (
                <Link
                  key={t.id}
                  to={`/${t.slug}`}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 transition flex items-center justify-between group"
                >
                  <div>
                    <p className="font-bold text-white group-hover:text-amber-400 transition">{t.name}</p>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">/{t.slug}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-amber-400" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ==================== 2. LOGIN OFICIAL (SUPABASE AUTH) ==================== */
function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/painel');
    });
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (authError) {
      setError('E-mail ou senha inválidos. Verifique suas credenciais.');
    } else {
      navigate('/painel');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <BrandLogo subtitle="Acesso Administrativo" />
          <Link to="/" className="text-xs text-zinc-400 hover:text-white">
            ← Início
          </Link>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
              E-mail de Acesso
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
              Senha
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-black text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Entrar no Sistema
          </button>
        </form>
      </div>
    </div>
  );
}

/* ==================== 3. PORTAL AUTENTICADO (SUPER ADMIN / DONO / BARBEIRO) ==================== */
function AdminPortal() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [impersonatedTenantId, setImpersonatedTenantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (prof) {
        setProfile(prof);
      } else {
        const { data: tenantOwner } = await supabase
          .from('tenants')
          .select('*')
          .eq('owner_email', session.user.email)
          .single();

        if (tenantOwner) {
          const newProf = {
            id: session.user.id,
            email: session.user.email,
            full_name: tenantOwner.owner_name,
            role: 'owner',
            tenant_id: tenantOwner.id,
          };
          await supabase.from('profiles').insert(newProf);
          setProfile(newProf);
        } else {
          setProfile({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.email,
            role: 'unassigned',
          });
        }
      }
      setLoading(false);
    };
    loadProfile();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-amber-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (profile?.role === 'unassigned') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white">Conta sem Unidade Vinculada</h2>
          <p className="text-xs text-zinc-400 mt-2">
            O e-mail <strong>{profile.email}</strong> ainda não foi vinculado a nenhuma barbearia pelo administrador do sistema.
          </p>
          <button
            onClick={handleLogout}
            className="mt-5 px-4 py-2 rounded-xl bg-zinc-800 text-xs font-bold text-white"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-zinc-900 border border-amber-500/40 shadow-2xl text-sm font-medium text-white">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {impersonatedTenantId && (
        <div className="bg-amber-500 text-zinc-950 px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>MODO SUPORTE MASTER ATIVO — Operando painel de cliente</span>
          </div>
          <button
            onClick={() => setImpersonatedTenantId(null)}
            className="px-3 py-1 rounded-lg bg-zinc-950 text-amber-400 hover:bg-zinc-900 transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Painel Master
          </button>
        </div>
      )}

      {profile.role === 'super_admin' && !impersonatedTenantId ? (
        <SuperAdminDashboard
          onImpersonate={(id) => setImpersonatedTenantId(id)}
          onLogout={handleLogout}
          notify={notify}
        />
      ) : (
        <TenantAdminDashboard
          role={impersonatedTenantId ? 'owner' : profile.role}
          userName={impersonatedTenantId ? 'Suporte Master' : profile.full_name}
          tenantId={impersonatedTenantId || profile.tenant_id}
          barberId={profile.barber_id}
          onLogout={handleLogout}
          notify={notify}
        />
      )}
    </div>
  );
}

/* ==================== 4. SUPER ADMIN DASHBOARD (SUPABASE) ==================== */
function SuperAdminDashboard({ onImpersonate, onLogout, notify }) {
  const [tenants, setTenants] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newShop, setNewShop] = useState({
    name: '',
    slug: '',
    owner_name: '',
    owner_email: '',
    phone: '',
    plan_id: 'pro',
    status: 'active',
  });

  const fetchData = async () => {
    const [{ data: tData }, { data: bData }] = await Promise.all([
      supabase.from('tenants').select('*').order('created_at', { ascending: false }),
      supabase.from('barbers').select('*'),
    ]);
    setTenants(tData || []);
    setBarbers(bData || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const metrics = useMemo(() => {
    const activeCount = tenants.filter((t) => t.status === 'active').length;
    const trialCount = tenants.filter((t) => t.status === 'trial').length;
    const blockedCount = tenants.filter((t) => t.status === 'blocked').length;
    const mrr = tenants
      .filter((t) => t.status === 'active')
      .reduce((acc, t) => acc + (PLANS[t.plan_id]?.price || 0), 0);
    return { activeCount, trialCount, blockedCount, mrr };
  }, [tenants]);

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    const generatedSlug =
      newShop.slug.trim() ||
      newShop.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-');

    const { data: created, error } = await supabase
      .from('tenants')
      .insert({
        name: newShop.name,
        slug: generatedSlug,
        owner_name: newShop.owner_name,
        owner_email: newShop.owner_email.trim().toLowerCase(),
        phone: newShop.phone,
        plan_id: newShop.plan_id,
        status: newShop.status,
      })
      .select()
      .single();

    if (error) {
      notify(`Erro ao criar barbearia: ${error.message}`);
      return;
    }

    await supabase.from('services').insert({
      tenant_id: created.id,
      name: 'Corte Masculino Padrão',
      price: 45,
      duration: 45,
      category: 'Cabelo',
    });

    setNewShop({
      name: '',
      slug: '',
      owner_name: '',
      owner_email: '',
      phone: '',
      plan_id: 'pro',
      status: 'active',
    });
    setShowNewModal(false);
    notify(`Barbearia "${created.name}" salva no banco!`);
    fetchData();
  };

  const toggleTenantStatus = async (tenant) => {
    const nextStatus = tenant.status === 'blocked' ? 'active' : 'blocked';
    await supabase.from('tenants').update({ status: nextStatus }).eq('id', tenant.id);
    notify(nextStatus === 'blocked' ? `Licença de ${tenant.name} bloqueada.` : `Licença de ${tenant.name} reativada!`);
    fetchData();
  };

  const changeTenantPlan = async (tenantId, newPlanId) => {
    await supabase.from('tenants').update({ plan_id: newPlanId }).eq('id', tenantId);
    notify(`Plano atualizado para ${PLANS[newPlanId].name}.`);
    fetchData();
  };

  const renewLicense = async (tenant) => {
    const base = new Date(tenant.expires_at || Date.now());
    base.setDate(base.getDate() + 30);
    const nextDate = base.toISOString().split('T')[0];
    await supabase.from('tenants').update({ status: 'active', expires_at: nextDate }).eq('id', tenant.id);
    notify(`Licença renovada até ${nextDate}!`);
    fetchData();
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <BrandLogo subtitle="Console Master • Super Admin" />
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <Crown className="w-3.5 h-3.5" /> Produção Conectada
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
            className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs sm:text-sm font-semibold flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span>MRR (Receita Mensal)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            R$ {metrics.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span>Barbearias Ativas</span>
            <Store className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{metrics.activeCount}</p>
        </div>
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span>Em Trial</span>
            <Sparkles className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{metrics.trialCount}</p>
        </div>
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span>Suspensas</span>
            <Lock className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{metrics.blockedCount}</p>
        </div>
      </div>

      <div className="mb-4 relative w-full sm:w-80">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar barbearia, dono ou slug..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
        />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="py-3.5 px-4">Barbearia / Link Público</th>
                <th className="py-3.5 px-4">Proprietário</th>
                <th className="py-3.5 px-4">Plano</th>
                <th className="py-3.5 px-4">Cadeiras</th>
                <th className="py-3.5 px-4">Vencimento</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Controles Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-sm">
              {filteredTenants.map((t) => {
                const plan = PLANS[t.plan_id] || PLANS.start;
                const activeBarbersCount = barbers.filter((b) => b.tenant_id === t.id && b.active).length;

                return (
                  <tr key={t.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-4 px-4">
                      <p className="font-bold text-white">{t.name}</p>
                      <Link
                        to={`/${t.slug}`}
                        target="_blank"
                        className="text-xs text-amber-400/90 hover:underline font-mono inline-flex items-center gap-1"
                      >
                        /{t.slug} <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-zinc-200 font-medium">{t.owner_name}</p>
                      <p className="text-xs text-zinc-500">{t.owner_email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={t.plan_id}
                        onChange={(e) => changeTenantPlan(t.id, e.target.value)}
                        className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white"
                      >
                        <option value="start">Start — R$ 79</option>
                        <option value="pro">Pro — R$ 149</option>
                        <option value="rede">Rede — R$ 249</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200">
                        {activeBarbersCount} / {plan.maxBarbers === 99 ? '∞' : plan.maxBarbers}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-zinc-300 font-mono">{t.expires_at}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => onImpersonate(t.id)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-zinc-950 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> Entrar
                        </button>
                        <button
                          onClick={() => renewLicense(t)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold"
                        >
                          +30d
                        </button>
                        <button
                          onClick={() => toggleTenantStatus(t)}
                          className={`p-1.5 rounded-lg border transition ${
                            t.status === 'blocked'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {t.status === 'blocked' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
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

      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Cadastrar Nova Barbearia</h3>
              <button onClick={() => setShowNewModal(false)} className="text-zinc-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Nome da Barbearia *</label>
                  <input
                    required
                    type="text"
                    value={newShop.name}
                    onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    value={newShop.slug}
                    onChange={(e) => setNewShop({ ...newShop, slug: e.target.value })}
                    placeholder="ex: barbearia-imperial"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Nome do Proprietário *</label>
                  <input
                    required
                    type="text"
                    value={newShop.owner_name}
                    onChange={(e) => setNewShop({ ...newShop, owner_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">E-mail de Login *</label>
                  <input
                    required
                    type="email"
                    value={newShop.owner_email}
                    onChange={(e) => setNewShop({ ...newShop, owner_email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">WhatsApp da Loja</label>
                  <input
                    type="text"
                    value={newShop.phone}
                    onChange={(e) => setNewShop({ ...newShop, phone: e.target.value })}
                    placeholder="(82) 99999-9999"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Plano</label>
                  <select
                    value={newShop.plan_id}
                    onChange={(e) => setNewShop({ ...newShop, plan_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                  >
                    <option value="start">Start — R$ 79/mês</option>
                    <option value="pro">Pro — R$ 149/mês</option>
                    <option value="rede">Rede — R$ 249/mês</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-sm font-semibold">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 text-zinc-950 text-sm font-bold">
                  Salvar Barbearia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== 5. PAINEL DA BARBEARIA (DONO & BARBEIRO) ==================== */
function TenantAdminDashboard({ role, userName, tenantId, barberId, onLogout, notify }) {
  const isOwner = role === 'owner';
  const todayStr = new Date().toISOString().split('T')[0];

  const [tenant, setTenant] = useState(null);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [tab, setTab] = useState('agenda');

  const [showNewApptModal, setShowNewApptModal] = useState(false);
  const [showNewBarberModal, setShowNewBarberModal] = useState(false);
  const [showNewServiceModal, setShowNewServiceModal] = useState(false);

  const [newAppt, setNewAppt] = useState({ client_name: '', client_phone: '', barber_id: '', service_id: '', time: '15:00' });
  const [newBarber, setNewBarber] = useState({ name: '', role_title: 'Barbeiro', email: '', commission_percent: 45, work_hours: 'Seg a Sáb • 09:00 - 19:00', lunch_break: '12:00 - 13:00' });
  const [newSrv, setNewSrv] = useState({ name: '', price: 45, duration: 45, category: 'Cabelo' });

  const fetchAll = async () => {
    const [{ data: t }, { data: s }, { data: b }, { data: a }] = await Promise.all([
      supabase.from('tenants').select('*').eq('id', tenantId).single(),
      supabase.from('services').select('*').eq('tenant_id', tenantId).order('created_at'),
      supabase.from('barbers').select('*').eq('tenant_id', tenantId).order('created_at'),
      supabase.from('appointments').select('*').eq('tenant_id', tenantId).eq('date', selectedDate).order('time'),
    ]);
    setTenant(t);
    setServices(s || []);
    setBarbers(b || []);
    setAppointments(a || []);
  };

  useEffect(() => {
    if (tenantId) fetchAll();
  }, [tenantId, selectedDate]);

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center text-amber-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const plan = PLANS[tenant.plan_id] || PLANS.start;

  if (tenant.status === 'blocked') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-rose-500/40 rounded-2xl p-8 text-center">
          <Lock className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h2 className="text-xl font-black text-white">Licença Suspensa</h2>
          <p className="text-sm text-zinc-400 mt-2">
            A unidade <strong>{tenant.name}</strong> está temporariamente bloqueada (vencimento: {tenant.expires_at}).
          </p>
          <button onClick={onLogout} className="mt-6 w-full py-2.5 rounded-xl bg-zinc-800 text-white text-sm font-bold">
            Sair
          </button>
        </div>
      </div>
    );
  }

  const visibleAppointments = isOwner ? appointments : appointments.filter((a) => a.barber_id === barberId);
  const visibleBarbers = isOwner ? barbers : barbers.filter((b) => b.id === barberId);

  const handleCompleteAppointment = async (apt) => {
    const barber = barbers.find((b) => b.id === apt.barber_id);
    const gross = Number(apt.price_snapshot);
    const fee = gross * ((Number(tenant.gateway_fee_percent) || 3.5) / 100);
    const net = Number((gross - fee).toFixed(2));
    const comm = Number((net * ((Number(barber?.commission_percent) || 50) / 100)).toFixed(2));

    await supabase
      .from('appointments')
      .update({ status: 'completed', net_amount: net, barber_commission: comm, payment_method: 'Pix / Cartão' })
      .eq('id', apt.id);

    notify(`Comanda fechada! Comissão: R$ ${comm.toFixed(2)}`);
    fetchAll();
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    const srv = services.find((s) => s.id === (newAppt.service_id || services[0]?.id));
    if (!newAppt.client_name || !srv) return;
    await supabase.from('appointments').insert({
      tenant_id: tenant.id,
      client_name: newAppt.client_name,
      client_phone: newAppt.client_phone || '(82) 99999-0000',
      barber_id: newAppt.barber_id || barbers[0]?.id,
      service_id: srv.id,
      date: selectedDate,
      time: newAppt.time,
      status: 'scheduled',
      price_snapshot: srv.price,
    });
    setNewAppt({ client_name: '', client_phone: '', barber_id: '', service_id: '', time: '15:00' });
    setShowNewApptModal(false);
    notify('Encaixe salvo na agenda!');
    fetchAll();
  };

  const handleCreateBarber = async (e) => {
    e.preventDefault();
    if (barbers.filter((b) => b.active).length >= plan.maxBarbers) {
      notify(`Limite do Plano ${plan.name} atingido (${plan.maxBarbers} cadeiras).`);
      return;
    }
    await supabase.from('barbers').insert({
      tenant_id: tenant.id,
      name: newBarber.name,
      role_title: newBarber.role_title,
      email: newBarber.email,
      commission_percent: Number(newBarber.commission_percent),
      work_hours: newBarber.work_hours,
      lunch_break: newBarber.lunch_break,
      service_ids: services.map((s) => s.id),
    });
    setShowNewBarberModal(false);
    notify(`Colaborador ${newBarber.name} cadastrado!`);
    fetchAll();
  };

  const toggleBarberService = async (barber, serviceId) => {
    const exists = (barber.service_ids || []).includes(serviceId);
    const updatedIds = exists
      ? barber.service_ids.filter((id) => id !== serviceId)
      : [...(barber.service_ids || []), serviceId];
    await supabase.from('barbers').update({ service_ids: updatedIds }).eq('id', barber.id);
    notify('Serviços do profissional atualizados!');
    fetchAll();
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    await supabase.from('services').insert({
      tenant_id: tenant.id,
      name: newSrv.name,
      price: Number(newSrv.price),
      duration: Number(newSrv.duration),
      category: newSrv.category,
    });
    setNewSrv({ name: '', price: 45, duration: 45, category: 'Cabelo' });
    setShowNewServiceModal(false);
    notify('Serviço adicionado!');
    fetchAll();
  };

  const finSummary = useMemo(() => {
    const completed = visibleAppointments.filter((a) => a.status === 'completed');
    const gross = completed.reduce((acc, a) => acc + Number(a.price_snapshot), 0);
    const net = completed.reduce((acc, a) => acc + Number(a.net_amount), 0);
    const commissions = completed.reduce((acc, a) => acc + Number(a.barber_commission), 0);
    return { gross, net, commissions, shopProfit: Number((net - commissions).toFixed(2)), count: completed.length };
  }, [visibleAppointments]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-white">{tenant.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Plano {plan.name}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Operador: <strong className="text-zinc-200">{userName}</strong> • Link público:{' '}
            <Link to={`/${tenant.slug}`} target="_blank" className="text-amber-400 hover:underline font-mono">
              navalha.io/{tenant.slug}
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-white"
          />
          <button
            onClick={() => setShowNewApptModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Encaixe
          </button>
          <button
            onClick={onLogout}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>

      <nav className="flex gap-2 overflow-x-auto py-5 border-b border-zinc-800/80 mb-6">
        <button onClick={() => setTab('agenda')} className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 ${tab === 'agenda' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
          <Calendar className="w-4 h-4" /> Agenda ({visibleAppointments.length})
        </button>
        {isOwner && (
          <>
            <button onClick={() => setTab('team')} className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 ${tab === 'team' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
              <Users className="w-4 h-4" /> Equipe ({barbers.length}/{plan.maxBarbers === 99 ? '∞' : plan.maxBarbers})
            </button>
            <button onClick={() => setTab('services')} className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 ${tab === 'services' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
              <Scissors className="w-4 h-4" /> Serviços ({services.length})
            </button>
          </>
        )}
        <button onClick={() => setTab('finance')} className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 ${tab === 'finance' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
          <BarChart3 className="w-4 h-4" /> Financeiro & Split
        </button>
      </nav>

      {tab === 'agenda' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleBarbers.map((barber) => {
            const barberAppts = visibleAppointments.filter((a) => a.barber_id === barber.id);
            return (
              <div key={barber.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                  <div>
                    <h3 className="font-bold text-white flex items-center gap-2">
                      {barber.name}
                      <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-amber-400">
                        {barber.commission_percent}%
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{barber.work_hours}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                    {barberAppts.length} agend.
                  </span>
                </div>
                <div className="mt-4 space-y-3 flex-1">
                  {barberAppts.length === 0 ? (
                    <div className="py-10 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                      Agenda livre nesta data.
                    </div>
                  ) : (
                    barberAppts.map((apt) => {
                      const srv = services.find((s) => s.id === apt.service_id);
                      const isDone = apt.status === 'completed';
                      return (
                        <div key={apt.id} className={`p-3.5 rounded-xl border ${isDone ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-zinc-950 border-zinc-800'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-500/15 text-amber-400">{apt.time}</span>
                            <span className="text-xs font-bold text-white">R$ {Number(apt.price_snapshot).toFixed(2)}</span>
                          </div>
                          <p className="text-sm font-bold text-white mt-2">{apt.client_name}</p>
                          <p className="text-xs text-zinc-400">{apt.client_phone} • {srv?.name}</p>
                          {isDone ? (
                            <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
                              <span>Pago</span>
                              <span>Comissão: R$ {Number(apt.barber_commission).toFixed(2)}</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleCompleteAppointment(apt)}
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
      )}

      {tab === 'team' && isOwner && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-white">Equipe & Serviços Habilitados</h2>
            <button onClick={() => setShowNewBarberModal(true)} className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo Barbeiro
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {barbers.map((barber) => (
              <div key={barber.id} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold text-white">{barber.name}</h3>
                    <p className="text-xs text-zinc-400">{barber.role_title} • Comissão: {barber.commission_percent}%</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {services.map((srv) => {
                    const assigned = (barber.service_ids || []).includes(srv.id);
                    return (
                      <button
                        key={srv.id}
                        onClick={() => toggleBarberService(barber, srv.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${assigned ? 'bg-amber-500/15 text-amber-300 border-amber-500/40' : 'bg-zinc-950 text-zinc-500 border-zinc-800'}`}
                      >
                        {assigned ? '✓ ' : '+ '}{srv.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'services' && isOwner && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-white">Catálogo de Serviços</h2>
            <button onClick={() => setShowNewServiceModal(true)} className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo Serviço
            </button>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {services.map((srv) => (
              <div key={srv.id} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex justify-between items-center">
                <div>
                  <p className="font-bold text-white text-sm">{srv.name}</p>
                  <p className="text-xs text-zinc-400">{srv.duration} min • {srv.category}</p>
                </div>
                <p className="text-lg font-black text-amber-400">R$ {srv.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'finance' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <p className="text-xs text-zinc-400">Faturamento Bruto ({selectedDate})</p>
            <p className="text-2xl font-black text-white mt-1">R$ {finSummary.gross.toFixed(2)}</p>
          </div>
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <p className="text-xs text-zinc-400">Líquido Pós-Taxa ({tenant.gateway_fee_percent}%)</p>
            <p className="text-2xl font-black text-sky-400 mt-1">R$ {finSummary.net.toFixed(2)}</p>
          </div>
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <p className="text-xs text-zinc-400">Comissões Equipe</p>
            <p className="text-2xl font-black text-amber-400 mt-1">R$ {finSummary.commissions.toFixed(2)}</p>
          </div>
          {isOwner && (
            <div className="p-5 rounded-2xl bg-zinc-900 border border-emerald-500/30">
              <p className="text-xs text-emerald-400">Lucro Líquido da Casa</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">R$ {finSummary.shopProfit.toFixed(2)}</p>
            </div>
          )}
        </div>
      )}

      {showNewApptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Novo Encaixe ({selectedDate})</h3>
            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <input required type="text" placeholder="Nome do Cliente" value={newAppt.client_name} onChange={(e) => setNewAppt({ ...newAppt, client_name: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white" />
              <input type="text" placeholder="WhatsApp" value={newAppt.client_phone} onChange={(e) => setNewAppt({ ...newAppt, client_phone: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white" />
              <div className="grid grid-cols-2 gap-3">
                <select value={newAppt.barber_id} onChange={(e) => setNewAppt({ ...newAppt, barber_id: e.target.value })} className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white">
                  {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <input type="time" value={newAppt.time} onChange={(e) => setNewAppt({ ...newAppt, time: e.target.value })} className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white" />
              </div>
              <select value={newAppt.service_id} onChange={(e) => setNewAppt({ ...newAppt, service_id: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white">
                {services.map((s) => <option key={s.id} value={s.id}>{s.name} — R$ {s.price}</option>)}
              </select>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowNewApptModal(false)} className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-bold">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-bold">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewBarberModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Cadastrar Colaborador</h3>
            <form onSubmit={handleCreateBarber} className="space-y-4">
              <input required type="text" placeholder="Nome Completo" value={newBarber.name} onChange={(e) => setNewBarber({ ...newBarber, name: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Cargo" value={newBarber.role_title} onChange={(e) => setNewBarber({ ...newBarber, role_title: e.target.value })} className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white" />
                <input type="number" placeholder="Comissão %" value={newBarber.commission_percent} onChange={(e) => setNewBarber({ ...newBarber, commission_percent: e.target.value })} className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowNewBarberModal(false)} className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-bold">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-bold">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Novo Serviço</h3>
            <form onSubmit={handleCreateService} className="space-y-4">
              <input required type="text" placeholder="Nome do Serviço" value={newSrv.name} onChange={(e) => setNewSrv({ ...newSrv, name: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Preço R$" value={newSrv.price} onChange={(e) => setNewSrv({ ...newSrv, price: e.target.value })} className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white" />
                <input type="number" placeholder="Duração (min)" value={newSrv.duration} onChange={(e) => setNewSrv({ ...newSrv, duration: e.target.value })} className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowNewServiceModal(false)} className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-bold">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-bold">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== 6. LINK PÚBLICO DO CLIENTE (/:slug + HORÁRIOS DINÂMICOS) ==================== */
function PublicBookingPage() {
  const { slug } = useParams();
  const todayStr = new Date().toISOString().split('T')[0];

  const [tenant, setTenant] = useState(null);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [bookedAppointments, setBookedAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadShop = async () => {
      setLoading(true);
      const { data: t } = await supabase.from('tenants').select('*').eq('slug', slug).single();
      if (t) {
        setTenant(t);
        const [{ data: s }, { data: b }] = await Promise.all([
          supabase.from('services').select('*').eq('tenant_id', t.id).eq('active', true),
          supabase.from('barbers').select('*').eq('tenant_id', t.id).eq('active', true),
        ]);
        setServices(s || []);
        setBarbers(b || []);
      }
      setLoading(false);
    };
    loadShop();
  }, [slug]);

  useEffect(() => {
    if (!tenant || !selectedBarber || !selectedDate) return;
    supabase
      .from('appointments')
      .select('time, service_id, status')
      .eq('tenant_id', tenant.id)
      .eq('barber_id', selectedBarber.id)
      .eq('date', selectedDate)
      .neq('status', 'cancelled')
      .then(({ data }) => setBookedAppointments(data || []));
  }, [tenant, selectedBarber, selectedDate]);

  const availableTimes = useMemo(() => {
    const allSlots = ['09:00', '09:45', '10:30', '11:15', '13:00', '13:45', '14:30', '15:15', '16:00', '16:45', '17:30', '18:15'];
    const occupied = new Set(bookedAppointments.map((a) => a.time));
    return allSlots.filter((slot) => !occupied.has(slot));
  }, [bookedAppointments]);

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!clientName || !selectedService || !selectedBarber || !selectedTime) return;
    setSubmitting(true);
    const { error } = await supabase.from('appointments').insert({
      tenant_id: tenant.id,
      barber_id: selectedBarber.id,
      service_id: selectedService.id,
      client_name: clientName,
      client_phone: clientPhone,
      date: selectedDate,
      time: selectedTime,
      status: 'scheduled',
      price_snapshot: selectedService.price,
    });
    setSubmitting(false);
    if (!error) {
      setBookingConfirmed(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-amber-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-black text-white">Barbearia não encontrada</h1>
          <p className="text-sm text-zinc-400 mt-2">Verifique o endereço digitado.</p>
          <Link to="/" className="inline-block mt-4 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-bold">
            Ver Barbearias Disponíveis
          </Link>
        </div>
      </div>
    );
  }

  const eligibleBarbers = selectedService
    ? barbers.filter((b) => (b.service_ids || []).includes(selectedService.id))
    : barbers;

  const whatsappLink = tenant.phone
    ? `https://wa.me/55${tenant.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Olá ${tenant.name}! Acabei de agendar *${selectedService?.name}* com *${selectedBarber?.name}* para o dia *${selectedDate}* às *${selectedTime}*. Meu nome é ${clientName}.`
      )}`
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="border-b border-zinc-800/90 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <BrandLogo subtitle={tenant.name} />
          <Link to="/login" className="text-xs font-semibold text-zinc-400 hover:text-amber-400">
            Área da Equipe
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8">
        {tenant.status === 'blocked' ? (
          <div className="p-8 rounded-2xl bg-zinc-900 border border-rose-500/30 text-center">
            <Lock className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white">Agenda Temporariamente Indisponível</h2>
          </div>
        ) : bookingConfirmed ? (
          <div className="p-8 rounded-2xl bg-zinc-900 border border-emerald-500/30 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h2 className="text-xl font-black text-white">Agendamento Confirmado!</h2>
            <p className="text-sm text-zinc-400 mt-1">Te esperamos na {tenant.name}.</p>

            <div className="mt-5 p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-left text-xs space-y-1.5">
              <p><span className="text-zinc-500">Serviço:</span> <strong className="text-white">{selectedService?.name}</strong></p>
              <p><span className="text-zinc-500">Profissional:</span> <strong className="text-white">{selectedBarber?.name}</strong></p>
              <p><span className="text-zinc-500">Data e Hora:</span> <strong className="text-amber-400">{selectedDate} às {selectedTime}</strong></p>
            </div>

            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="mt-4 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4" /> Enviar Comprovante no WhatsApp
              </a>
            )}

            <button
              onClick={() => {
                setBookingConfirmed(false);
                setStep(1);
                setSelectedService(null);
                setSelectedBarber(null);
                setSelectedTime('');
              }}
              className="mt-3 w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-200 font-bold text-xs"
            >
              Fazer Outro Agendamento
            </button>
          </div>
        ) : (
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Agendamento Online • Passo {step} de 3
            </span>
            <h1 className="text-2xl font-black text-white mt-1 mb-6">{tenant.name}</h1>

            {step === 1 && (
              <div className="space-y-3">
                {services.map((srv) => (
                  <button
                    key={srv.id}
                    onClick={() => {
                      setSelectedService(srv);
                      setStep(2);
                    }}
                    className="w-full p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-amber-500/50 text-left flex items-center justify-between transition"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{srv.category}</span>
                      <h3 className="text-base font-bold text-white mt-1">{srv.name}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {srv.duration} min</p>
                    </div>
                    <span className="text-lg font-black text-amber-400">R$ {srv.price}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <button onClick={() => setStep(1)} className="text-xs text-zinc-400 hover:text-white mb-2">
                  ← Trocar serviço ({selectedService?.name})
                </button>
                {eligibleBarbers.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBarber(b);
                      setStep(3);
                    }}
                    className="w-full p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-amber-500/50 text-left flex items-center justify-between transition"
                  >
                    <div>
                      <h3 className="text-base font-bold text-white">{b.name}</h3>
                      <p className="text-xs text-zinc-400">{b.role_title}</p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-400">Escolher →</span>
                  </button>
                ))}
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleConfirmBooking} className="space-y-5">
                <button type="button" onClick={() => setStep(2)} className="text-xs text-zinc-400 hover:text-white">
                  ← Trocar profissional ({selectedBarber?.name})
                </button>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">Data do Atendimento</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime('');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-2">Horários Livres</label>
                  {availableTimes.length === 0 ? (
                    <p className="text-xs text-rose-400">Todos os horários estão ocupados nesta data.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableTimes.map((t) => (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setSelectedTime(t)}
                          className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                            selectedTime === t
                              ? 'bg-amber-500 text-zinc-950 border-amber-500'
                              : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <input required type="text" placeholder="Seu Nome *" value={clientName} onChange={(e) => setClientName(e.target.value)} className="px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white" />
                  <input required type="text" placeholder="Seu WhatsApp *" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white" />
                </div>

                <button
                  type="submit"
                  disabled={!selectedTime || submitting}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-black text-sm transition shadow-lg shadow-amber-500/20"
                >
                  {submitting ? 'Confirmando...' : `Confirmar Agendamento • R$ ${selectedService?.price}`}
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
