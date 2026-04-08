import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Wrench, Plus, Camera, CheckCircle2, Clock, AlertTriangle, MapPin, Calendar, User } from 'lucide-react';

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

interface Task {
  id: number;
  road: string;
  type: string;
  contractor: string;
  status: TaskStatus;
  deadline: string;
  location: string;
  priority: string;
}

const MOCK_TASKS: Task[] = [
  { id: 1, road: "NH-58 Delhi-Meerut Expressway", type: "Pothole Patching", contractor: "Bharat Infra Pvt Ltd", status: "in_progress", deadline: "2026-04-15", location: "Km 34.5", priority: "CRITICAL" },
  { id: 2, road: "NH-48 Jaipur Highway", type: "Blackspot Lighting", contractor: "Suraksha Electricals", status: "pending", deadline: "2026-04-20", location: "Km 112", priority: "HIGH" },
  { id: 3, road: "Outer Ring Road", type: "Lane Marking", contractor: "Delhi Road Corp", status: "completed", deadline: "2026-04-05", location: "Sec 14-18", priority: "HIGH" },
  { id: 4, road: "Mumbai-Pune Expressway", type: "Guardrail Repair", contractor: "Western Infra Ltd", status: "overdue", deadline: "2026-04-01", location: "Km 78 Khandala", priority: "CRITICAL" },
  { id: 5, road: "GT Karnal Road", type: "Speed Camera Install", contractor: "TechVision Systems", status: "in_progress", deadline: "2026-04-18", location: "Km 5-12", priority: "MEDIUM" },
  { id: 6, road: "ITO Flyover", type: "Surface Resurfacing", contractor: "Capital Roads Ltd", status: "pending", deadline: "2026-04-25", location: "Full stretch", priority: "HIGH" },
];

const statusConfig: Record<TaskStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: <Clock size={14} /> },
  in_progress: { label: "In Progress", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: <Wrench size={14} /> },
  completed: { label: "Completed", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: <CheckCircle2 size={14} /> },
  overdue: { label: "Overdue", color: "bg-rose-500/10 text-rose-400 border-rose-500/20", icon: <AlertTriangle size={14} /> },
};

export default function ContractorPortal() {
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const filtered = filter === 'all' ? MOCK_TASKS : MOCK_TASKS.filter(t => t.status === filter);

  const counts = {
    all: MOCK_TASKS.length,
    pending: MOCK_TASKS.filter(t => t.status === 'pending').length,
    in_progress: MOCK_TASKS.filter(t => t.status === 'in_progress').length,
    completed: MOCK_TASKS.filter(t => t.status === 'completed').length,
    overdue: MOCK_TASKS.filter(t => t.status === 'overdue').length,
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Navbar />
        <main className="p-6 flex-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <Wrench className="text-cyan-400" size={24} /> Contractor & Maintenance Portal
              </h1>
              <p className="text-slate-500 text-xs font-semibold mt-0.5">Assign, track, and verify road repair tasks across the network</p>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black text-sm rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5">
              <Plus size={16} /> Assign New Task
            </button>
          </div>

          {/* Status Filters */}
          <div className="flex gap-2 mb-6">
            {(['all', 'pending', 'in_progress', 'completed', 'overdue'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                  filter === s 
                    ? 'bg-slate-700/50 text-white border-slate-600' 
                    : 'bg-slate-800/30 text-slate-400 border-slate-700/30 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                {s === 'all' ? 'All' : s.replace('_', ' ')} ({counts[s]})
              </button>
            ))}
          </div>

          {/* Task Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(task => {
              const sc = statusConfig[task.status];
              return (
                <div key={task.id} className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5 hover:border-slate-600/50 transition-all group cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-[15px] font-black text-white group-hover:text-cyan-300 transition-colors">{task.road}</h3>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">{task.type}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${sc.color}`}>
                      {sc.icon} {sc.label}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <User size={13} className="text-slate-500" />
                      <span className="font-semibold">{task.contractor}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <MapPin size={13} className="text-slate-500" />
                      <span className="font-semibold">{task.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar size={13} className="text-slate-500" />
                      <span className="font-semibold">{task.deadline}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`font-black uppercase tracking-wider text-[10px] px-2 py-0.5 rounded ${
                        task.priority === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400' : 
                        task.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>{task.priority}</span>
                    </div>
                  </div>

                  {task.status === 'completed' && (
                    <div className="mt-4 flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-3 py-2">
                      <Camera size={14} className="text-emerald-400" />
                      <span className="text-[11px] text-emerald-300 font-bold">Repair proof uploaded · Verified by Officer</span>
                    </div>
                  )}
                  {task.status === 'overdue' && (
                    <div className="mt-4 flex items-center gap-2 bg-rose-500/5 border border-rose-500/10 rounded-xl px-3 py-2">
                      <AlertTriangle size={14} className="text-rose-400" />
                      <span className="text-[11px] text-rose-300 font-bold">Deadline exceeded · Escalation notice sent</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
