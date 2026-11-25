import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Printer,
  User,
  Scissors,
  DollarSign,
  CheckCircle2,
  XCircle,
  UserX,
  Filter,
  Edit3,
  MessageCircle,
} from 'lucide-react';

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function AgendaCalendarReport({
  appointments = [],
  services = [],
  barbers = [],
  barbershopName = 'Barbearia',
  selectedMonth,
  onMonthChange,
  onEditAppointment,
  onConfirmWhatsApp,
  onUpdateStatus,
}) {
  const todayObj = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = `${todayObj.getFullYear()}-${pad(todayObj.getMonth() + 1)}-${pad(todayObj.getDate())}`;
  const currentMonthStr = todayStr.slice(0, 7);

  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'report'
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [calendarMonth, setCalendarMonth] = useState(selectedMonth || currentMonthStr);
  const [reportMonth, setReportMonth] = useState(selectedMonth || currentMonthStr);
  const [selectedBarberFilter, setSelectedBarberFilter] = useState('all');

  useEffect(() => {
    if (selectedMonth) {
      setCalendarMonth(selectedMonth);
      setReportMonth(selectedMonth);
    }
  }, [selectedMonth]);

  const syncMonth = (ym) => {
    if (!ym) return;
    setCalendarMonth(ym);
    setReportMonth(ym);
    if (onMonthChange) onMonthChange(ym);
  };

  const normalizedAppointments = useMemo(() => {
    return appointments.map((item) => {
      const srv = services.find((s) => s.id === item.service_id);
      const brb = barbers.find((b) => b.id === item.barber_id);
      return {
        raw: item,
        id: item.id,
        date: (item.date || '').slice(0, 10),
        time: (item.time || '00:00').slice(0, 5),
        client: item.client_name || 'Cliente',
        phone: item.client_phone || '',
        barberId: item.barber_id || '',
        service: srv?.name || item.service_name || 'Serviço',
        barber: brb?.name || item.barber_name || 'Qualquer profissional',
        price: Number(item.price_snapshot ?? srv?.price ?? 0),
        status: item.status || 'scheduled',
      };
    });
  }, [appointments, services, barbers]);

  const filteredByBarber = useMemo(() => {
    if (selectedBarberFilter === 'all') return normalizedAppointments;
    return normalizedAppointments.filter((a) => a.barberId === selectedBarberFilter);
  }, [normalizedAppointments, selectedBarberFilter]);

  // Mapa de quantidade de agendamentos ativos por data (YYYY-MM-DD)
  const countsByDate = useMemo(() => {
    const map = {};
    filteredByBarber.forEach((a) => {
      if (!a.date) return;
      if (!map[a.date]) map[a.date] = { active: 0, total: 0 };
      map[a.date].total += 1;
      if (a.status !== 'cancelled' && a.status !== 'no_show') {
        map[a.date].active += 1;
      }
    });
    return map;
  }, [filteredByBarber]);

  // Células do calendário visual do mês
  const calendarCells = useMemo(() => {
    const [y, m] = calendarMonth.split('-').map(Number);
    const firstWeekday = new Date(y, m - 1, 1).getDay();
    const daysInMonth = new Date(y, m, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = `${y}-${pad(m)}-${pad(day)}`;
      cells.push({ day, iso });
    }
    return cells;
  }, [calendarMonth]);

  const dailyAppointments = useMemo(() => {
    return filteredByBarber
      .filter((a) => a.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredByBarber, selectedDate]);

  const monthlyAppointments = useMemo(() => {
    return filteredByBarber
      .filter((a) => a.date.startsWith(reportMonth))
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }, [filteredByBarber, reportMonth]);

  const monthlyStats = useMemo(() => {
    const active = monthlyAppointments.filter(
      (a) => a.status !== 'cancelled' && a.status !== 'no_show'
    );
    const completed = monthlyAppointments.filter((a) => a.status === 'completed');
    const revenue = active.reduce((sum, a) => sum + a.price, 0);
    const completedRevenue = completed.reduce((sum, a) => sum + a.price, 0);
    const ticket = active.length > 0 ? revenue / active.length : 0;
    return {
      activeCount: active.length,
      completedCount: completed.length,
      cancelledCount: monthlyAppointments.length - active.length,
      revenue,
      completedRevenue,
      ticket,
    };
  }, [monthlyAppointments]);

  const shiftCalendarMonth = (offset) => {
    const [y, m] = calendarMonth.split('-').map(Number);
    const dt = new Date(y, m - 1 + offset, 1);
    syncMonth(`${dt.getFullYear()}-${pad(dt.getMonth() + 1)}`);
  };

  const formatBRL = (val) =>
    Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDateBR = (isoDate) => {
    if (!isoDate) return '-';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  };

  const formatMonthLabel = (ym) => {
    if (!ym) return '';
    const [y, m] = ym.split('-').map(Number);
    return `${MONTHS_PT[m - 1]} de ${y}`;
  };

  const getStatusLabel = (status) => {
    if (status === 'completed') return 'Concluído';
    if (status === 'cancelled') return 'Cancelado';
    if (status === 'no_show') return 'Faltou';
    return 'Agendado';
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank', 'width=950,height=720');
    if (!printWindow) return;

    const barberLabel =
      selectedBarberFilter === 'all'
        ? 'Todos os profissionais'
        : barbers.find((b) => b.id === selectedBarberFilter)?.name || 'Profissional';

    const rowsHtml = monthlyAppointments
      .map(
        (a) => `
        <tr>
          <td>${formatDateBR(a.date)}</td>
          <td>${a.time}</td>
          <td>${a.client}</td>
          <td>${a.service}</td>
          <td>${a.barber}</td>
          <td>${getStatusLabel(a.status)}</td>
          <td style="text-align:right;">${formatBRL(a.price)}</td>
        </tr>`
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Relatório Mensal - ${barbershopName}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #18181b; padding: 24px; }
          h1 { margin: 0 0 4px; font-size: 20px; }
          p.sub { margin: 0 0 20px; color: #52525b; font-size: 13px; }
          .cards { display: flex; gap: 12px; margin-bottom: 20px; }
          .card { flex: 1; border: 1px solid #e4e4e7; border-radius: 8px; padding: 12px; }
          .card span { display: block; font-size: 11px; color: #71717a; text-transform: uppercase; }
          .card strong { font-size: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border-bottom: 1px solid #e4e4e7; padding: 8px; text-align: left; }
          th { background: #f4f4f5; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>${barbershopName} — Relatório Mensal de Agendamentos</h1>
        <p class="sub">Competência: ${formatMonthLabel(reportMonth)} • Profissional: ${barberLabel} • Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
        <div class="cards">
          <div class="card"><span>Atendimentos Ativos</span><strong>${monthlyStats.activeCount}</strong></div>
          <div class="card"><span>Concluídos</span><strong>${monthlyStats.completedCount}</strong></div>
          <div class="card"><span>Cancelados / Faltas</span><strong>${monthlyStats.cancelledCount}</strong></div>
          <div class="card"><span>Ticket Médio</span><strong>${formatBRL(monthlyStats.ticket)}</strong></div>
          <div class="card"><span>Faturamento Previsto/Real</span><strong>${formatBRL(monthlyStats.revenue)}</strong></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Hora</th>
              <th>Cliente</th>
              <th>Serviço</th>
              <th>Profissional</th>
              <th>Status</th>
              <th style="text-align:right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${
              rowsHtml ||
              '<tr><td colspan="7" style="text-align:center;">Nenhum agendamento encontrado neste mês.</td></tr>'
            }
          </tbody>
        </table>
        <script>window.onload = () => { window.print(); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-5">
      {/* Barra superior: alternância entre Calendário e Relatório Mensal + Filtro de Barbeiro */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition ${
              viewMode === 'calendar'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calendário & Dia
          </button>
          <button
            type="button"
            onClick={() => setViewMode('report')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition ${
              viewMode === 'report'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Relatório do Mês
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {barbers.length > 0 && (
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={selectedBarberFilter}
                onChange={(e) => setSelectedBarberFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-zinc-200 focus:outline-none"
              >
                <option value="all" className="bg-zinc-950">Todos os barbeiros</option>
                {barbers.map((b) => (
                  <option key={b.id} value={b.id} className="bg-zinc-950">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'report' && (
            <>
              <input
                type="month"
                value={reportMonth}
                onChange={(e) => syncMonth(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleExportPDF}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
              >
                <Printer className="w-4 h-4" />
                Exportar PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* MODO 1: CALENDÁRIO VISUAL + AGENDAMENTOS DO DIA SELECIONADO */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Grade do Calendário Mensal */}
          <div className="lg:col-span-5 bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => shiftCalendarMonth(-1)}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-center">
                <p className="text-sm font-black text-white capitalize">
                  {formatMonthLabel(calendarMonth)}
                </p>
                {selectedDate !== todayStr && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(todayStr);
                      syncMonth(currentMonthStr);
                    }}
                    className="text-[10px] font-bold text-amber-400 hover:underline"
                  >
                    Voltar para hoje
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => shiftCalendarMonth(1)}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {WEEKDAYS_PT.map((w) => (
                <span key={w} className="text-[10px] font-bold uppercase text-zinc-500 py-1">
                  {w}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((cell, idx) => {
                if (!cell) return <div key={`empty-${idx}`} className="h-11" />;
                const isSelected = cell.iso === selectedDate;
                const isToday = cell.iso === todayStr;
                const dayInfo = countsByDate[cell.iso];
                const activeCount = dayInfo?.active || 0;

                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => setSelectedDate(cell.iso)}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center relative transition border ${
                      isSelected
                        ? 'bg-amber-500 border-amber-400 text-zinc-950 font-black shadow-md shadow-amber-500/20'
                        : isToday
                        ? 'bg-zinc-900 border-amber-500/50 text-amber-400 font-bold'
                        : 'bg-zinc-900/50 border-zinc-800/70 text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs leading-none">{cell.day}</span>
                    {activeCount > 0 && (
                      <span
                        className={`mt-1 px-1.5 py-0.2 rounded-full text-[9px] font-black leading-tight ${
                          isSelected
                            ? 'bg-zinc-950 text-amber-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {activeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista de Agendamentos do Dia Selecionado */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-black text-white">
                  Agenda de {formatDateBR(selectedDate)}
                </h3>
                <p className="text-[11px] text-zinc-400">
                  {dailyAppointments.length} horário(s) encontrado(s) neste dia
                </p>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  setSelectedDate(val);
                  syncMonth(val.slice(0, 7));
                }}
                className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {dailyAppointments.length === 0 ? (
              <div className="flex-1 bg-zinc-950/60 border border-dashed border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <Calendar className="w-7 h-7 text-zinc-600 mb-2" />
                <p className="text-sm font-semibold text-zinc-400">
                  Nenhum agendamento para {formatDateBR(selectedDate)}.
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Clique em outro dia no calendário ao lado para consultar.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {dailyAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="px-2.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-xs flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {apt.time}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          {apt.client}
                        </p>
                        <p className="text-xs text-zinc-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="inline-flex items-center gap-1 text-zinc-200">
                            <Scissors className="w-3 h-3 text-amber-400" />
                            {apt.service}
                          </span>
                          <span>•</span>
                          <span>{apt.barber}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-emerald-400 flex items-center gap-0.5">
                        <DollarSign className="w-3.5 h-3.5" />
                        {formatBRL(apt.price)}
                      </span>

                      {onConfirmWhatsApp && apt.phone && apt.status === 'scheduled' && (
                        <button
                          type="button"
                          onClick={() => onConfirmWhatsApp(apt.raw)}
                          className="p-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 transition"
                          title="Confirmar horário no WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {onEditAppointment && (
                        <button
                          type="button"
                          onClick={() => onEditAppointment(apt.raw)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-zinc-950 text-[11px] font-bold flex items-center gap-1 transition"
                          title="Alterar data, horário, barbeiro ou serviço"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Alterar
                        </button>
                      )}

                      {onUpdateStatus && apt.status === 'scheduled' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(apt.id, 'completed')}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-zinc-950 text-[11px] font-bold flex items-center gap-1 transition"
                            title="Concluir atendimento"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Concluir
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(apt.id, 'no_show')}
                            className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 transition"
                            title="Registrar falta (No-show)"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(apt.id, 'cancelled')}
                            className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 transition"
                            title="Cancelar horário"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                            apt.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : apt.status === 'cancelled' || apt.status === 'no_show'
                              ? 'bg-rose-500/15 text-rose-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {getStatusLabel(apt.status)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODO 2: RELATÓRIO MENSAL FILTRÁVEL + EXPORTAÇÃO PDF */}
      {viewMode === 'report' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
              <span className="text-[11px] text-zinc-400 uppercase font-bold">
                Atendimentos Ativos
              </span>
              <p className="text-xl font-black text-white mt-1">
                {monthlyStats.activeCount}
              </p>
              <span className="text-[10px] text-emerald-400">
                {monthlyStats.completedCount} concluído(s)
              </span>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
              <span className="text-[11px] text-zinc-400 uppercase font-bold">
                Cancelados / Faltas
              </span>
              <p className="text-xl font-black text-rose-400 mt-1">
                {monthlyStats.cancelledCount}
              </p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
              <span className="text-[11px] text-zinc-400 uppercase font-bold">
                Ticket Médio
              </span>
              <p className="text-xl font-black text-amber-400 mt-1">
                {formatBRL(monthlyStats.ticket)}
              </p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
              <span className="text-[11px] text-zinc-400 uppercase font-bold">
                Faturamento Mês
              </span>
              <p className="text-xl font-black text-emerald-400 mt-1">
                {formatBRL(monthlyStats.revenue)}
              </p>
              <span className="text-[10px] text-zinc-500">
                Realizado: {formatBRL(monthlyStats.completedRevenue)}
              </span>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/90 text-zinc-400 uppercase border-b border-zinc-800">
                <tr>
                  <th className="p-3.5">Data</th>
                  <th className="p-3.5">Hora</th>
                  <th className="p-3.5">Cliente</th>
                  <th className="p-3.5">Serviço</th>
                  <th className="p-3.5">Barbeiro</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Valor</th>
                  {onEditAppointment && <th className="p-3.5 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-200">
                {monthlyAppointments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={onEditAppointment ? 8 : 7}
                      className="p-6 text-center text-zinc-400"
                    >
                      Nenhum agendamento encontrado para {formatMonthLabel(reportMonth)}.
                    </td>
                  </tr>
                ) : (
                  monthlyAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-zinc-900/50">
                      <td className="p-3.5 font-medium">{formatDateBR(apt.date)}</td>
                      <td className="p-3.5">{apt.time}</td>
                      <td className="p-3.5 font-bold text-white">{apt.client}</td>
                      <td className="p-3.5">{apt.service}</td>
                      <td className="p-3.5">{apt.barber}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            apt.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : apt.status === 'cancelled' || apt.status === 'no_show'
                              ? 'bg-rose-500/15 text-rose-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {getStatusLabel(apt.status)}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">
                        {formatBRL(apt.price)}
                      </td>
                      {onEditAppointment && (
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => onEditAppointment(apt.raw)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-zinc-950 text-[11px] font-bold transition"
                          >
                            <Edit3 className="w-3 h-3" /> Alterar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
