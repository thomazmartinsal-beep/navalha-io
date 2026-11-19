import React, { useState } from 'react';
import {
  Scissors, Calendar, Clock, User, CheckCircle2, ChevronRight,
  ChevronLeft, Shield, LayoutDashboard, BarChart3, Settings,
  Plus, DollarSign, TrendingUp, Award, Package, AlertTriangle,
  Sparkles, LogOut, QrCode, CreditCard, Banknote, X, Check,
  Smartphone, Users, Store, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// Componente Inteligente de Logo (Usa public/logo.png se existir, senão usa ícone padrão)
const BrandLogo = ({ size = "md" }) => {
  const [imgError, setImgError] = useState(false);
  const sizeClasses = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-14 h-14" : "w-10 h-10";

  if (!imgError) {
    return (
      <img
        src="/logo.png"
        alt="Navalha.io"
        onError={() => setImgError(true)}
        className={`${sizeClasses} rounded-xl object-cover border border-amber-500/30 shadow-lg shadow-amber-500/10`}
      />
    );
  }

  return (
    <div className={`${sizeClasses} rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-500/20`}>
      <Scissors className={size === "sm" ? "w-4 h-4" : "w-5 h-5"} strokeWidth={2.5} />
    </div>
  );
};

// Dados Iniciais Simulados (MVP)
const INITIAL_SERVICES = [
  { id: 1, name: 'Corte Degradê / Navalhado', duration: '45 min', price: 50, category: 'Cabelo' },
  { id: 2, name: 'Barba Terapia & Toalha Quente', duration: '30 min', price: 40, category: 'Barba' },
  { id: 3, name: 'Combo Navalha (Corte + Barba)', duration: '75 min', price: 80, category: 'Combo', popular: true },
  { id: 4, name: 'Sobrancelha na Navalha', duration: '15 min', price: 15, category: 'Acabamento' },
];

const INITIAL_BARBERS = [
  { id: 1, name: 'Lucas "Navalha"', role: 'Master Barber', commission: 50, rating: 4.9, cuts: 142, ticket: 74.50, avatar: 'LN' },
  { id: 2, name: 'Mateus Silva', role: 'Barbeiro Sênior', commission: 45, rating: 4.8, cuts: 118, ticket: 68.00, avatar: 'MS' },
  { id: 3, name: 'Rafael Costa', role: 'Barbeiro', commission: 40, rating: 4.7, cuts: 89, ticket: 55.20, avatar: 'RC' },
];

const INITIAL_APPOINTMENTS = [
  { id: 101, client: 'Gabriel Oliveira', phone: '(82) 99912-3456', service: 'Combo Navalha (Corte + Barba)', barber: 'Lucas "Navalha"', barberId: 1, time: '09:00', price: 80, status: 'paid', method: 'Pix' },
  { id: 102, client: 'Pedro Henrique', phone: '(82) 98823-4567', service: 'Corte Degradê / Navalhado', barber: 'Mateus Silva', barberId: 2, time: '10:00', price: 50, status: 'pending', method: null },
  { id: 103, client: 'Thiago Martins', phone: '(82) 99134-5678', service: 'Barba Terapia & Toalha Quente', barber: 'Lucas "Navalha"', barberId: 1, time: '11:00', price: 40, status: 'pending', method: null },
  { id: 104, client: 'Bruno Ferreira', phone: '(82) 99645-6789', service: 'Combo Navalha (Corte + Barba)', barber: 'Rafael Costa', barberId: 3, time: '14:00', price: 80, status: 'pending', method: null },
];

const INITIAL_INVENTORY = [
  { id: 1, name: 'Pomada Efeito Matte 150g', stock: 4, minStock: 8, price: 45, sold15d: 28, daysIdle: 1, curve: 'A' },
  { id: 2, name: 'Óleo para Barba Cedro 30ml', stock: 19, minStock: 5, price: 55, sold15d: 1, daysIdle: 38, curve: 'C' },
  { id: 3, name: 'Balm Pós-Barba Refrescante', stock: 12, minStock: 6, price: 40, sold15d: 14, daysIdle: 3, curve: 'B' },
  { id: 4, name: 'Shampoo Anti-Resíduos Mentol', stock: 15, minStock: 4, price: 60, sold15d: 0, daysIdle: 45, curve: 'C' },
];

export default function App() {
  const [view, setView] = useState('client'); // 'client' | 'login' | 'admin'
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [services] = useState(INITIAL_SERVICES);
  const [barbers] = useState(INITIAL_BARBERS);
  const [inventory] = useState(INITIAL_INVENTORY);

  // Estados do Fluxo do Cliente
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState('Hoje, 19 Nov');
  const [selectedTime, setSelectedTime] = useState(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Estados do Admin
  const [adminTab, setAdminTab] = useState('dashboard'); // 'dashboard' | 'reports' | 'settings'
  const [checkoutItem, setCheckoutItem] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  // Confirmar Agendamento do Cliente
  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!clientName || !selectedService || !selectedBarber || !selectedTime) return;

    const newApp = {
      id: Date.now(),
      client: clientName,
      phone: clientPhone || '(82) 99999-0000',
      service: selectedService.name,
      barber: selectedBarber.name,
      barberId: selectedBarber.id,
      time: selectedTime,
      price: selectedService.price,
      status: 'pending',
      method: null,
    };

    setAppointments([newApp, ...appointments]);
    setBookingConfirmed(true);
  };

  const resetClientFlow = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedTime(null);
    setClientName('');
    setClientPhone('');
    setBookingConfirmed(false);
  };

  // Processar Pagamento no Checkout Admin
  const handleFinishPayment = () => {
    if (!checkoutItem) return;
    setAppointments(appointments.map(app =>
      app.id === checkoutItem.id ? { ...app, status: 'paid', method: paymentMethod } : app
    ));
    setCheckoutItem(null);
  };

  // Cálculos Financeiros em Tempo Real
  const paidApps = appointments.filter(a => a.status === 'paid');
  const grossRevenue = paidApps.reduce((acc, curr) => acc + curr.price, 0);
  const totalCommissions = paidApps.reduce((acc, curr) => {
    const barber = barbers.find(b => b.id === curr.barberId);
    const rate = barber ? barber.commission / 100 : 0.45;
    return acc + (curr.price * rate);
  }, 0);
  const netProfit = grossRevenue - totalCommissions;

  // ==========================================
  // 1. TELA DO CLIENTE (MOBILE-FIRST BOOKING)
  // ==========================================
  if (view === 'client') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex justify-center">
        <div className="w-full max-w-md bg-zinc-900/60 min-h-screen border-x border-zinc-800/80 flex flex-col justify-between relative">
          {/* Header */}
          <div>
            <header className="p-5 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <BrandLogo size="md" />
                <div>
                  <h1 className="font-bold text-lg tracking-tight text-white">
                    NAVALHA<span className="text-amber-500">.io</span>
                  </h1>
                  <p className="text-xs text-zinc-400">Barbearia Premium • Maceió</p>
                </div>
              </div>
              <button
                onClick={() => setView('login')}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-amber-400 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg transition"
              >
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                Acesso Equipe
              </button>
            </header>

            {/* Barra de Progresso */}
            {!bookingConfirmed && (
              <div className="px-5 pt-4">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                  <span>Passo {step} de 4</span>
                  <span className="text-amber-400 font-medium">
                    {step === 1 && 'Escolha o Serviço'}
                    {step === 2 && 'Escolha o Profissional'}
                    {step === 3 && 'Data e Horário'}
                    {step === 4 && 'Seus Dados'}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-300"
                    style={{ width: `${step * 25}%` }}
                  />
                </div>
              </div>
            )}

            {/* Conteúdo Principal do Agendamento */}
            <main className="p-5">
              {bookingConfirmed ? (
                <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-4 mt-4">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Horário Reservado!</h2>
                  <p className="text-sm text-zinc-400">
                    Tudo certo, <span className="text-white font-medium">{clientName}</span>. Seu horário está garantido na agenda.
                  </p>

                  <div className="bg-zinc-950 rounded-xl p-4 text-left space-y-2.5 border border-zinc-800 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Serviço:</span>
                      <span className="font-medium text-zinc-200">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Profissional:</span>
                      <span className="font-medium text-zinc-200">{selectedBarber?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Quando:</span>
                      <span className="font-medium text-amber-400">{selectedDate} às {selectedTime}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-zinc-800">
                      <span className="text-zinc-500">Total no local:</span>
                      <span className="font-bold text-white">R$ {selectedService?.price},00</span>
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3 text-left">
                    <Smartphone className="w-5 h-5 text-amber-400 shrink-0" />
                    <p className="text-xs text-amber-200/90">
                      Tire um <strong>print desta tela</strong> como comprovante. Integração automática via WhatsApp em breve.
                    </p>
                  </div>

                  <button
                    onClick={resetClientFlow}
                    className="w-full py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition"
                  >
                    Fazer Novo Agendamento
                  </button>
                </div>
              ) : (
                <>
                  {/* PASSO 1: SERVIÇOS */}
                  {step === 1 && (
                    <div className="space-y-3">
                      <h2 className="text-lg font-bold text-white mb-3">Qual o estilo de hoje?</h2>
                      {services.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => {
                            setSelectedService(service);
                            setStep(2);
                          }}
                          className={`w-full text-left p-4 rounded-2xl border transition flex items-center justify-between ${
                            selectedService?.id === service.id
                              ? 'bg-amber-500/10 border-amber-500'
                              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-100">{service.name}</span>
                              {service.popular && (
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                                  Mais Pedido
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-zinc-400">
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {service.duration}</span>
                              <span>• {service.category}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-400 text-base">R$ {service.price}</span>
                            <ChevronRight className="w-4 h-4 text-zinc-500" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* PASSO 2: BARBEIROS */}
                  {step === 2 && (
                    <div className="space-y-3">
                      <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white mb-2">
                        <ChevronLeft className="w-4 h-4" /> Voltar aos serviços
                      </button>
                      <h2 className="text-lg font-bold text-white mb-3">Escolha o profissional</h2>
                      {barbers.map((barber) => (
                        <button
                          key={barber.id}
                          onClick={() => {
                            setSelectedBarber(barber);
                            setStep(3);
                          }}
                          className="w-full text-left p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 transition flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-full bg-zinc-800 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400">
                              {barber.avatar}
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{barber.name}</h3>
                              <p className="text-xs text-zinc-400">{barber.role} • ⭐ {barber.rating}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-500" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* PASSO 3: DATA E HORÁRIO */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <button onClick={() => setStep(2)} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white">
                        <ChevronLeft className="w-4 h-4" /> Trocar profissional
                      </button>
                      <h2 className="text-lg font-bold text-white">Quando fica melhor?</h2>

                      <div className="grid grid-cols-3 gap-2">
                        {['Hoje, 19 Nov', 'Amanhã, 20 Nov', 'Sáb, 21 Nov'].map((date) => (
                          <button
                            key={date}
                            onClick={() => setSelectedDate(date)}
                            className={`p-2.5 rounded-xl text-xs font-medium border text-center transition ${
                              selectedDate === date
                                ? 'bg-amber-500 text-zinc-950 border-amber-500 font-bold'
                                : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                            }`}
                          >
                            {date}
                          </button>
                        ))}
                      </div>

                      <div>
                        <p className="text-xs text-zinc-400 mb-2.5">Horários disponíveis com {selectedBarber?.name}:</p>
                        <div className="grid grid-cols-3 gap-2.5">
                          {['09:00', '10:00', '11:30', '14:00', '15:30', '17:00', '18:30', '19:30'].map((time) => (
                            <button
                              key={time}
                              onClick={() => {
                                setSelectedTime(time);
                                setStep(4);
                              }}
                              className="py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500 hover:text-amber-400 font-semibold text-sm transition"
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PASSO 4: CONFIRMAÇÃO */}
                  {step === 4 && (
                    <form onSubmit={handleConfirmBooking} className="space-y-4">
                      <button type="button" onClick={() => setStep(3)} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white">
                        <ChevronLeft className="w-4 h-4" /> Alterar horário
                      </button>
                      <h2 className="text-lg font-bold text-white">Quase lá! Seus dados</h2>

                      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-2 text-sm">
                        <div className="flex justify-between text-zinc-400">
                          <span>Serviço</span>
                          <span className="text-white font-medium">{selectedService?.name}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Barbeiro</span>
                          <span className="text-white font-medium">{selectedBarber?.name}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Data/Hora</span>
                          <span className="text-amber-400 font-medium">{selectedDate} • {selectedTime}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-zinc-800 font-bold text-base">
                          <span>Valor</span>
                          <span className="text-amber-400">R$ {selectedService?.price},00</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Seu Nome Completo *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Carlos Eduardo"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-500 focus:outline-none text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">WhatsApp (para lembretes)</label>
                          <input
                            type="tel"
                            placeholder="(82) 99999-9999"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-500 focus:outline-none text-white text-sm"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition"
                      >
                        Confirmar Agendamento
                      </button>
                    </form>
                  )}
                </>
              )}
            </main>
          </div>

          <footer className="p-4 text-center text-[11px] text-zinc-600 border-t border-zinc-900">
            Powered by Navalha.io • Sistema de Gestão
          </footer>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. TELA DE LOGIN DA EQUIPE
  // ==========================================
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <BrandLogo size="lg" />
            <h1 className="text-xl font-bold text-white pt-2">Painel Administrativo</h1>
            <p className="text-xs text-zinc-400">Acesso exclusivo para gestão e barbeiros</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">E-mail de Acesso</label>
              <input
                type="email"
                defaultValue="admin@navalha.io"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Senha</label>
              <input
                type="password"
                defaultValue="123456"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => setView('admin')}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition"
            >
              Entrar no Painel
            </button>
            <button
              onClick={() => setView('client')}
              className="w-full py-2.5 rounded-xl text-zinc-400 hover:text-white text-xs transition"
            >
              ← Voltar para visão do cliente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. DASHBOARD ADMINISTRATIVO (DONO)
  // ==========================================
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 bg-zinc-900 border-r border-zinc-800 flex-col justify-between p-5">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
            <div>
              <span className="font-bold text-lg text-white block leading-none">
                NAVALHA<span className="text-amber-500">.io</span>
              </span>
              <span className="text-[11px] text-zinc-400">Gestão Inteligente</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setAdminTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                adminTab === 'dashboard' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-zinc-400 hover:bg-zinc-800/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Caixa & Agenda
            </button>
            <button
              onClick={() => setAdminTab('reports')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                adminTab === 'reports' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-zinc-400 hover:bg-zinc-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Relatórios & BI
            </button>
            <button
              onClick={() => setAdminTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                adminTab === 'settings' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-zinc-400 hover:bg-zinc-800/50'
              }`}
            >
              <Settings className="w-4 h-4" /> Ajustes
            </button>
          </nav>
        </div>

        <button
          onClick={() => setView('client')}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-red-400 px-3 py-2 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" /> Sair para App Cliente
        </button>
      </aside>

      {/* Conteúdo Principal Admin */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="p-4 md:px-8 md:py-5 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <BrandLogo size="sm" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white">
                {adminTab === 'dashboard' && 'Visão Geral do Dia'}
                {adminTab === 'reports' && 'Inteligência & Estoque'}
                {adminTab === 'settings' && 'Configurações da Unidade'}
              </h1>
              <p className="text-xs text-zinc-400 hidden sm:block">Quinta-feira, 19 de Novembro</p>
            </div>
          </div>

          <button
            onClick={() => setQuickActionOpen(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4" /> Nova Ação
          </button>
        </header>

        <main className="p-4 md:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* ABA 1: DASHBOARD & AGENDA */}
          {adminTab === 'dashboard' && (
            <>
              {/* KPIs Financeiros */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                    <span>Faturamento Bruto (Hoje)</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">R$ {grossRevenue.toFixed(2)}</div>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-3 h-3" /> {paidApps.length} atendimentos pagos
                  </span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                    <span>Comissões Barbeiros</span>
                    <Users className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-amber-400">R$ {totalCommissions.toFixed(2)}</div>
                  <span className="text-[11px] text-zinc-400 mt-1 block">Repasse automático calculado</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                    <span>Lucro Líquido Casa</span>
                    <TrendingUp className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-2xl font-bold text-sky-400">R$ {netProfit.toFixed(2)}</div>
                  <span className="text-[11px] text-zinc-400 mt-1 block">Livre de comissões</span>
                </div>
              </div>

              {/* Lista de Agendamentos */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                  <h2 className="font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500" /> Agenda de Hoje
                  </h2>
                  <span className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full">
                    {appointments.length} horários
                  </span>
                </div>

                <div className="divide-y divide-zinc-800/80">
                  {appointments.map((app) => (
                    <div key={app.id} className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-800/30 transition">
                      <div className="flex items-start gap-4">
                        <div className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl text-center min-w-[68px]">
                          <span className="text-sm font-bold text-amber-400 block">{app.time}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{app.client}</h3>
                          <p className="text-xs text-zinc-400">{app.service}</p>
                          <span className="text-[11px] text-zinc-500 mt-0.5 inline-block">
                            Profissional: <strong className="text-zinc-300">{app.barber}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                        <span className="font-bold text-white">R$ {app.price},00</span>
                        {app.status === 'paid' ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                            <Check className="w-3.5 h-3.5" /> Pago ({app.method})
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setCheckoutItem(app);
                              setPaymentMethod('Pix');
                            }}
                            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs px-4 py-2 rounded-lg transition"
                          >
                            Cobrar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ABA 2: RELATÓRIOS, RANKING & ESTOQUE INTELIGENTE */}
          {adminTab === 'reports' && (
            <div className="space-y-6">
              {/* Ranking de Barbeiros */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <h2 className="font-bold text-white flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-amber-500" /> Ranking de Performance (Ticket Médio)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {barbers.map((barber, index) => (
                    <div key={barber.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          index === 0 ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-white">{barber.name}</h3>
                          <p className="text-xs text-zinc-400">{barber.cuts} cortes no mês</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-zinc-500 block">Ticket Médio</span>
                        <span className="font-bold text-emerald-400 text-sm">R$ {barber.ticket.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inteligência de Estoque & Combos */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-500" /> Inteligência de Estoque (Curva A / C)
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inventory.map((item) => {
                    const isLowStock = item.stock <= item.minStock;
                    const isStagnant = item.daysIdle >= 30;

                    return (
                      <div key={item.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              item.curve === 'A' ? 'bg-emerald-500/20 text-emerald-400' :
                              item.curve === 'C' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              Curva {item.curve}
                            </span>
                            <h3 className="font-semibold text-white mt-1">{item.name}</h3>
                          </div>
                          <span className="font-bold text-zinc-200">R$ {item.price},00</span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-zinc-400">
                          <span>Em estoque: <strong className="text-white">{item.stock} un.</strong></span>
                          <span>Saídas (15d): <strong className="text-white">{item.sold15d} un.</strong></span>
                        </div>

                        {isLowStock && (
                          <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg flex items-center gap-2 text-xs text-amber-300">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>Alta procura! Repor estoque para evitar ruptura.</span>
                          </div>
                        )}

                        {isStagnant && (
                          <div className="bg-purple-500/10 border border-purple-500/30 p-2.5 rounded-lg flex items-start gap-2 text-xs text-purple-200">
                            <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>Sugestão de Combo:</strong> Parado há {item.daysIdle} dias. Ofertar <em>Corte + {item.name}</em> com 20% OFF no produto para girar caixa.
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: AJUSTES */}
          {adminTab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-amber-500" /> Catálogo de Serviços
                </h2>
                <div className="space-y-2.5">
                  {services.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-sm">
                      <div>
                        <span className="font-medium text-white block">{s.name}</span>
                        <span className="text-xs text-zinc-500">{s.duration}</span>
                      </div>
                      <span className="font-bold text-amber-400">R$ {s.price},00</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-500" /> Equipe & Comissões
                </h2>
                <div className="space-y-2.5">
                  {barbers.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-sm">
                      <div>
                        <span className="font-medium text-white block">{b.name}</span>
                        <span className="text-xs text-zinc-500">{b.role}</span>
                      </div>
                      <span className="text-xs font-bold bg-zinc-800 text-emerald-400 px-2.5 py-1 rounded-lg">
                        Comissão: {b.commission}%
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setView('client')}
                  className="w-full mt-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition"
                >
                  Sair da Conta Administrativa
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Navegação Inferior Mobile Admin */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-zinc-900 border-t border-zinc-800 flex justify-around py-2.5 z-30">
        <button
          onClick={() => setAdminTab('dashboard')}
          className={`flex flex-col items-center gap-1 text-[11px] ${adminTab === 'dashboard' ? 'text-amber-400 font-bold' : 'text-zinc-400'}`}
        >
          <LayoutDashboard className="w-5 h-5" /> Caixa
        </button>
        <button
          onClick={() => setAdminTab('reports')}
          className={`flex flex-col items-center gap-1 text-[11px] ${adminTab === 'reports' ? 'text-amber-400 font-bold' : 'text-zinc-400'}`}
        >
          <BarChart3 className="w-5 h-5" /> Relatórios
        </button>
        <button
          onClick={() => setAdminTab('settings')}
          className={`flex flex-col items-center gap-1 text-[11px] ${adminTab === 'settings' ? 'text-amber-400 font-bold' : 'text-zinc-400'}`}
        >
          <Settings className="w-5 h-5" /> Ajustes
        </button>
      </nav>

      {/* MODAL DE CHECKOUT / PAGAMENTO */}
      {checkoutItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Fechar Conta</h3>
              <button onClick={() => setCheckoutItem(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
              <div>
                <p className="font-semibold text-white">{checkoutItem.client}</p>
                <p className="text-xs text-zinc-400">{checkoutItem.service}</p>
              </div>
              <span className="text-xl font-bold text-amber-400">R$ {checkoutItem.price},00</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'Pix', icon: QrCode },
                { id: 'Cartão', icon: CreditCard },
                { id: 'Dinheiro', icon: Banknote },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition ${
                    paymentMethod === m.id
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <m.icon className="w-5 h-5" />
                  {m.id}
                </button>
              ))}
            </div>

            {paymentMethod === 'Pix' && (
              <div className="bg-white p-4 rounded-xl flex flex-col items-center text-zinc-950 space-y-2">
                <QrCode className="w-28 h-28 text-zinc-900" />
                <span className="text-xs font-bold">QR Code Pix Instantâneo (Simulação)</span>
              </div>
            )}

            <button
              onClick={handleFinishPayment}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition"
            >
              Confirmar Recebimento (R$ {checkoutItem.price},00)
            </button>
          </div>
        </div>
      )}

      {/* MODAL AÇÃO RÁPIDA (+) */}
      {quickActionOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white">Ação Rápida</h3>
              <button onClick={() => setQuickActionOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setQuickActionOpen(false);
                  setView('client');
                }}
                className="w-full p-3.5 rounded-xl bg-zinc-950 hover:border-amber-500/50 border border-zinc-800 text-left flex items-center gap-3 text-sm"
              >
                <Calendar className="w-4 h-4 text-amber-400" /> Novo Agendamento Balcão
              </button>
              <button
                onClick={() => {
                  setQuickActionOpen(false);
                  setAdminTab('reports');
                }}
                className="w-full p-3.5 rounded-xl bg-zinc-950 hover:border-amber-500/50 border border-zinc-800 text-left flex items-center gap-3 text-sm"
              >
                <ArrowDownRight className="w-4 h-4 text-red-400" /> Registrar Sangria / Despesa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

