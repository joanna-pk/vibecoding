import { useState, useEffect, useCallback, useRef } from "react";
import React from 'react';
import ReactDOM from 'react-dom/client';

// ─── Categories: Projects first, then admin/comms, then breaks/social, then "faff" ───
const CATEGORIES = [
  // ── Projects & Research ──
  { id: "xstarNN", label: "xstarNN", color: "#E85D75", icon: "⭐", group: "Projects" },
  { id: "uvex", label: "UVEX", color: "#8B5CF6", icon: "🔭", group: "Projects" },
  { id: "nustar", label: "NuSTAR Team", color: "#06B6D4", icon: "🛰️", group: "Projects" },
  { id: "paper_writing", label: "Paper Writing", color: "#10B981", icon: "📝", group: "Projects" },
  { id: "coauthorship", label: "Co-Authorship", color: "#F59E0B", icon: "👥", group: "Projects" },
  { id: "literature", label: "Literature", color: "#7C3AED", icon: "📚", group: "Projects" },
  { id: "outreach", label: "Outreach", color: "#F472B6", icon: "🌍", group: "Projects" },
  // ── Professional ──
  { id: "admin", label: "Admin", color: "#E8A838", icon: "📋", group: "Professional" },
  { id: "email", label: "Email", color: "#5B8DEF", icon: "✉️", group: "Professional" },
  { id: "meetings", label: "Meetings", color: "#F59E0B", icon: "🤝", group: "Professional" },
  { id: "student_supervision", label: "Student Supervision", color: "#14B8A6", icon: "🎓", group: "Professional" },
  { id: "job_search", label: "Job Search", color: "#EC4899", icon: "🔍", group: "Professional" },
  // ── Growth ──
  { id: "skill_building", label: "Skill Building", color: "#22D3EE", icon: "🧠", group: "Growth" },
  // ── Breaks & Social ──
  { id: "food_break", label: "Food Break", color: "#FB923C", icon: "🥗", group: "Breaks" },
  { id: "drink_break", label: "Drink Break", color: "#38BDF8", icon: "☕", group: "Breaks" },
  { id: "talk_attendance", label: "Talk Attendance", color: "#A78BFA", icon: "🎤", group: "Breaks" },
  { id: "social", label: "Social", color: "#F9A8D4", icon: "💬", group: "Breaks" },
  { id: "social_media", label: "Social Media", color: "#FB7185", icon: "📱", group: "Breaks" },
  // ── The cozy one ──
  { id: "pottering", label: "Pottering About", color: "#9CA3AF", icon: "🦥", group: "Misc" },
];

const PRIORITIES = [
  { id: "critical", label: "Critical", color: "#EF4444", symbol: "🔴" },
  { id: "high", label: "High", color: "#F59E0B", symbol: "🟠" },
  { id: "medium", label: "Medium", color: "#3B82F6", symbol: "🔵" },
  { id: "low", label: "Low", color: "#6B7280", symbol: "⚪" },
];

const GROWTH_STAGES = ["🌱", "🌿", "🌳", "🌲", "🎄"];

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDuration(ms) {
  if (!ms || ms < 0) return "0m";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getGrowthStage(ms) {
  const min = ms / 60000;
  if (min < 60) return 0;    // 🌱 < 1 hour
  if (min < 120) return 1;   // 🌿 1-2 hours
  if (min < 180) return 2;   // 🌳 2-3 hours
  if (min < 240) return 3;   // 🌲 3-4 hours
  return 4;                  // 🎄 4+ hours (Christmas tree!)
}

function usePersistedState(key, defaultVal) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultVal;
    } catch {
      return defaultVal;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState];
}

// ─── XP & Level System ───
function getLevel(xp) {
  let level = 1;
  let needed = 100;
  let remaining = xp;
  while (remaining >= needed) {
    remaining -= needed;
    level++;
    needed = Math.floor(needed * 1.3);
  }
  return { level, currentXP: remaining, neededXP: needed };
}

function xpForTask(task) {
  const base = { critical: 40, high: 25, medium: 15, low: 10 };
  const timeBonus = Math.min(Math.floor((task.totalTime || 0) / 60000) * 2, 30);
  return (base[task.priority] || 15) + timeBonus;
}

// ─── Streak System ───
function computeStreak(completedDates) {
  if (!completedDates.length) return 0;
  const sorted = [...new Set(completedDates)].sort().reverse();
  const today = getToday();
  let streak = 0;
  let checkDate = new Date(today);
  for (const d of sorted) {
    const diff = Math.round((checkDate - new Date(d)) / 86400000);
    if (diff === 0) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
    else if (diff === 1 && streak === 0) { streak++; checkDate = new Date(d); checkDate.setDate(checkDate.getDate() - 1); }
    else break;
  }
  return streak;
}

// ─── CSV Export ───
function generateCSV(tasks) {
  const header = "task_id,title,category,priority,status,due_date,created_at,completed_at,total_time_minutes,session_date,session_duration_minutes";
  const rows = [];

  for (const t of tasks) {
    const base = [
      t.id,
      `"${(t.title || "").replace(/"/g, '""')}"`,
      t.category,
      t.priority,
      t.status,
      t.dueDate || "",
      t.createdAt ? new Date(t.createdAt).toISOString() : "",
      t.completedAt ? new Date(t.completedAt).toISOString() : "",
      ((t.totalTime || 0) / 60000).toFixed(2),
    ];

    if (t.sessions && t.sessions.length > 0) {
      for (const s of t.sessions) {
        rows.push([...base, s.date, (s.duration / 60000).toFixed(2)].join(","));
      }
    } else {
      rows.push([...base, "", ""].join(","));
    }
  }

  return header + "\n" + rows.join("\n");
}

function downloadCSV(tasks) {
  const csv = generateCSV(tasks);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quest_log_export_${getToday()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Growing Tree Animation ───
function GrowingTree({ elapsed, isActive }) {
  const stage = getGrowthStage(elapsed);
  const progress = Math.min(elapsed / 14400000, 1);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      padding: "16px 0",
    }}>
      <div style={{
        fontSize: 48 + stage * 10,
        transition: "font-size 1s ease",
        filter: isActive ? "none" : "grayscale(0.5)",
        animation: isActive ? "gentle-sway 3s ease-in-out infinite" : "none",
      }}>
        {GROWTH_STAGES[stage]}
      </div>
      <div style={{
        width: 120, height: 6, background: "#2a2a3e", borderRadius: 3, overflow: "hidden",
      }}>
        <div style={{
          width: `${progress * 100}%`, height: "100%",
          background: "linear-gradient(90deg, #4ade80, #22d3ee)",
          borderRadius: 3, transition: "width 1s ease",
        }} />
      </div>
      <span style={{ fontSize: 11, color: "#7a7a9a" }}>
        {stage < 4 ? "Growing..." : "Fully grown! 🌟"}
      </span>
    </div>
  );
}

// ─── Analytics Chart ───
function AnalyticsChart({ tasks, days = 7, allCategories }) {
  const today = new Date();
  const dayLabels = [];
  const dayData = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dayLabels.push(d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" }));

    const catTotals = {};
    tasks.forEach(t => {
      (t.sessions || []).forEach(s => {
        if (s.date === key) {
          catTotals[t.category] = (catTotals[t.category] || 0) + (s.duration || 0);
        }
      });
    });
    dayData.push(catTotals);
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Hour scale on the left */}
      <div style={{ display: "flex", gap: 4 }}>
        <div style={{ 
          width: 24, 
          height: 280,
          padding: "12px 0", 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "center",
          alignItems: "flex-end" 
        }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: 260, alignItems: "flex-end" }}>
            <span style={{ fontSize: 8, color: "#5a5a7a" }}>12h</span>
            <span style={{ fontSize: 8, color: "#5a5a7a" }}>9h</span>
            <span style={{ fontSize: 8, color: "#5a5a7a" }}>6h</span>
            <span style={{ fontSize: 8, color: "#5a5a7a" }}>3h</span>
            <span style={{ fontSize: 8, color: "#7a7a9a", fontWeight: 600 }}>0h</span>
            <span style={{ fontSize: 8, color: "#5a5a7a" }}>3h</span>
            <span style={{ fontSize: 8, color: "#5a5a7a" }}>6h</span>
            <span style={{ fontSize: 8, color: "#5a5a7a" }}>9h</span>
            <span style={{ fontSize: 8, color: "#5a5a7a" }}>12h</span>
          </div>
        </div>
        
        {/* Grid lines */}
        <div style={{ position: "relative", flex: 1, height: 280, padding: "12px 0", overflow: "hidden" }}>
          {/* Horizontal grid lines */}
          <div style={{ position: "absolute", top: 10, left: 0, right: 0, height: 260, pointerEvents: "none" }}>
            {/* Grid lines above and below center */}
            {[0, 25, 50, 75, 100].map(pct => (
              <div key={`pos-${pct}`} style={{
                position: "absolute",
                top: `${50 - pct/2}%`,
                left: 0,
                right: 0,
                height: 1,
                background: pct === 0 ? "#4a4a6e" : "#2a2a3e",
                opacity: pct === 0 ? 1 : 0.4
              }} />
            ))}
            {[25, 50, 75, 100].map(pct => (
              <div key={`neg-${pct}`} style={{
                position: "absolute",
                top: `${50 + pct/2}%`,
                left: 0,
                right: 0,
                height: 1,
                background: "#2a2a3e",
                opacity: 0.4
              }} />
            ))}
          </div>
          
          {/* Bars container */}
          <div style={{ 
            display: "flex", 
            gap: days > 14 ? 2 : 4,
            height: "100%",
            position: "relative",
            zIndex: 1,
            justifyContent: "center"
          }}>
            {dayData.map((catTotals, i) => {
              const totalMin = Object.values(catTotals).reduce((a, b) => a + b, 0) / 60000;
              const barHeight = Math.max(2, (totalMin / 720) * 130); // 720min = 12h max, 130px max height
              
              // Calculate category segments
              const segments = allCategories.filter(c => catTotals[c.id]).map(c => ({
                id: c.id, 
                color: c.color, 
                ratio: catTotals[c.id] / (Object.values(catTotals).reduce((a, b) => a + b, 0) || 1),
              }));

              // Rainbow gradient based on total time
              let barGradient;
              if (totalMin >= 480) { // 8+ hours - glowing green/teal
                barGradient = "linear-gradient(180deg, #22d3ee, #4ade80)";
              } else if (totalMin >= 360) { // 6-8 hours - solid green
                barGradient = "#4ade80";
              } else if (totalMin >= 240) { // 4-6 hours - yellow
                barGradient = "#fbbf24";
              } else if (totalMin >= 120) { // 2-4 hours - orange
                barGradient = "#f97316";
              } else if (totalMin >= 60) { // 1-2 hours - dim orange
                barGradient = "#fb923c";
              } else if (totalMin > 0) { // < 1 hour - gray
                barGradient = "#6b7280";
              } else {
                barGradient = "#2a2a3e"; // No work
              }

              const isToday = (i === dayData.length - 1);
              const shouldGlow = totalMin >= 480;

              return (
                <div key={i} style={{ 
                  flex: days > 14 ? "0 1 auto" : 1,
                  minWidth: days > 14 ? 12 : 24,
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center",
                  position: "relative",
                  height: "100%"
                }}>
                  {/* Container that positions bars around center */}
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, 0)",
                    width: days > 14 ? 18 : 36,
                    height: 0,  // Zero height - just a positioning point
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                  }}>
                    {/* Positive bar - grows UPWARD from center (rainbow colored) */}
                    <div style={{
                      width: "100%",
                      height: barHeight, 
                      borderRadius: "4px 4px 0 0", 
                      overflow: "hidden",
                      background: barGradient,
                      boxShadow: shouldGlow ? "0 0 12px rgba(74, 222, 128, 0.6)" : "none",
                      border: isToday ? "1px solid rgba(74, 222, 128, 0.4)" : "none",
                      transition: "height 0.3s ease",
                      position: "absolute",
                      bottom: 0,  // Anchor to bottom of container (which is at center line)
                    }} />
                    
                    {/* Negative bar - grows DOWNWARD from center (category colored) */}
                    <div style={{
                      width: "100%",
                      height: barHeight, 
                      borderRadius: "0 0 4px 4px", 
                      overflow: "hidden",
                      display: "flex", 
                      flexDirection: "column",
                      border: isToday ? "1px solid rgba(74, 222, 128, 0.4)" : "none",
                      position: "absolute",
                      top: 0,  // Anchor to top of container (which is at center line)
                    }}>
                      {segments.map(s => (
                        <div key={s.id} style={{ 
                          width: "100%", 
                          height: `${s.ratio * 100}%`, 
                          background: s.color, 
                          minHeight: 2,
                          opacity: 0.85
                        }} />
                      ))}
                    </div>
                  </div>
                  
                  {/* Labels positioned absolutely at bottom */}
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2
                  }}>
                    {days <= 14 && (
                      <span style={{ fontSize: 9, color: "#7a7a9a" }}>
                        {totalMin > 0 ? `${Math.round(totalMin)}m` : ""}
                      </span>
                    )}
                    <span style={{ 
                      fontSize: days > 14 ? 7 : 9,
                      color: "#9a9ab0", 
                      writingMode: "vertical-rl", 
                      transform: "rotate(180deg)", 
                      height: 48
                    }}>
                      {days > 14 ? dayLabels[i].split(' ')[1] : dayLabels[i]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Category Breakdown ───
function CategoryBreakdown({ tasks, allCategories }) {
  const catTotals = {};
  tasks.forEach(t => {
    const time = t.totalTime || 0;
    if (time > 0) catTotals[t.category] = (catTotals[t.category] || 0) + time;
  });
  const total = Object.values(catTotals).reduce((a, b) => a + b, 0) || 1;
  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) return <div style={{ color: "#7a7a9a", fontSize: 13, padding: 12 }}>No time tracked yet</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {sorted.map(([catId, ms]) => {
        const cat = allCategories.find(c => c.id === catId);
        const pct = (ms / total) * 100;
        return (
          <div key={catId} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, width: 24 }}>{cat?.icon || "📌"}</span>
            <span style={{ fontSize: 12, color: "#d0d0e0", width: 110, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {cat?.label || catId}
            </span>
            <div style={{ flex: 1, height: 8, background: "#2a2a3e", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: cat?.color || "#666", borderRadius: 4, transition: "width 0.5s" }} />
            </div>
            <span style={{ fontSize: 11, color: "#9a9ab0", width: 55, textAlign: "right" }}>{formatDuration(ms)}</span>
            <span style={{ fontSize: 10, color: "#5a5a7a", width: 36, textAlign: "right" }}>{pct.toFixed(0)}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main App ───
export default function QuestLog() {
  const [tasks, setTasks] = usePersistedState("ql_tasks_v2", []);
  const [xp, setXP] = usePersistedState("ql_xp_v2", 0);
  const [completedDays, setCompletedDays] = usePersistedState("ql_completed_days_v2", []);
  const [view, setView] = useState("tasks");
  const [now, setNow] = useState(Date.now());
  const [editingCategories, setEditingCategories] = useState(false);
  const [customCategories, setCustomCategories] = usePersistedState("ql_custom_cats_v2", []);
  const [newCatName, setNewCatName] = useState("");

  // Form state
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState(CATEGORIES[0].id);
  const [newPriority, setNewPriority] = useState("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");
  const [analyticsRange, setAnalyticsRange] = useState(7);

  const allCategories = [...CATEGORIES, ...customCategories];

  // Tick for active timers
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const activeTask = tasks.find(t => t.status === "active");

  function getElapsed(task) {
    let total = task.totalTime || 0;
    if (task.status === "active" && task.startedAt) {
      total += now - task.startedAt;
    }
    return total;
  }

  function addTask() {
    if (!newTitle.trim()) return;
    const task = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      dueDate: newDueDate || null,
      status: "pending",
      totalTime: 0,
      startedAt: null,
      sessions: [],
      createdAt: Date.now(),
    };
    setTasks(prev => [task, ...prev]);
    setNewTitle("");
    setNewDueDate("");
    setView("tasks");
  }

  function startTask(id) {
    setTasks(prev => prev.map(t => {
      if (t.id === id) return { ...t, status: "active", startedAt: Date.now() };
      if (t.status === "active") {
        const elapsed = Date.now() - (t.startedAt || Date.now());
        return {
          ...t, status: "paused",
          totalTime: (t.totalTime || 0) + elapsed,
          startedAt: null,
          sessions: [...(t.sessions || []), { date: getToday(), duration: elapsed }],
        };
      }
      return t;
    }));
  }

  function pauseTask(id) {
    setTasks(prev => prev.map(t => {
      if (t.id === id && t.status === "active") {
        const elapsed = Date.now() - (t.startedAt || Date.now());
        return {
          ...t, status: "paused",
          totalTime: (t.totalTime || 0) + elapsed,
          startedAt: null,
          sessions: [...(t.sessions || []), { date: getToday(), duration: elapsed }],
        };
      }
      return t;
    }));
  }

  function completeTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    let finalTime = task.totalTime || 0;
    let finalSessions = [...(task.sessions || [])];
    if (task.status === "active" && task.startedAt) {
      const elapsed = Date.now() - task.startedAt;
      finalTime += elapsed;
      finalSessions.push({ date: getToday(), duration: elapsed });
    }

    const earned = xpForTask({ ...task, totalTime: finalTime });
    setXP(prev => prev + earned);

    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, status: "done", totalTime: finalTime, startedAt: null, sessions: finalSessions, completedAt: Date.now() } : t
    ));

    const todayTasks = tasks.filter(t => t.id !== id && t.status !== "done" && t.dueDate === getToday());
    if (todayTasks.length === 0) {
      setCompletedDays(prev => [...new Set([...prev, getToday()])]);
    }
  }

  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function addCustomCategory() {
    if (!newCatName.trim()) return;
    const id = newCatName.trim().toLowerCase().replace(/\s+/g, "_");
    if (allCategories.find(c => c.id === id)) return;
    const colors = ["#EC4899", "#14B8A6", "#F97316", "#8B5CF6", "#EF4444", "#06B6D4"];
    setCustomCategories(prev => [...prev, {
      id, label: newCatName.trim(),
      color: colors[prev.length % colors.length],
      icon: "📌",
      group: "Custom",
    }]);
    setNewCatName("");
  }

  const { level, currentXP, neededXP } = getLevel(xp);
  const streak = computeStreak(completedDays);
  const todayCompleted = tasks.filter(t => t.status === "done" && t.completedAt && new Date(t.completedAt).toISOString().split("T")[0] === getToday()).length;
  const todayPending = tasks.filter(t => t.status !== "done").length;

  const filteredTasks = tasks.filter(t => {
    if (filterStatus === "active" && t.status === "done") return false;
    if (filterStatus === "done" && t.status !== "done") return false;
    if (filterCat !== "all" && t.category !== filterCat) return false;
    return true;
  }).sort((a, b) => {
    if (a.status === "active") return -1;
    if (b.status === "active") return 1;
    const priOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return (priOrder[a.priority] || 2) - (priOrder[b.priority] || 2);
  });

  // Group categories for the dropdown
  const groupedCats = {};
  allCategories.forEach(c => {
    const g = c.group || "Other";
    if (!groupedCats[g]) groupedCats[g] = [];
    groupedCats[g].push(c);
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
      color: "#e0e0f0",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      padding: "0 0 80px 0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes gentle-sway { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
        @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 8px rgba(74,222,128,0.3); } 50% { box-shadow: 0 0 20px rgba(74,222,128,0.6); } }
        @keyframes slide-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .task-card { animation: slide-in 0.3s ease; transition: transform 0.15s ease; }
        .task-card:hover { transform: translateY(-1px); }
        input, select, button { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3a3a5e; border-radius: 3px; }
        optgroup { font-style: normal; color: #7a7a9a; background: #1e1e3a; }
        option { color: #e0e0f0; background: #1e1e3a; }
      `}</style>

      {/* ─── Header ─── */}
      <div style={{
        background: "linear-gradient(135deg, #1e1e3a, #2a1a3e)",
        borderBottom: "1px solid #3a3a5e",
        padding: "16px 20px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 22, fontWeight: 700,
              background: "linear-gradient(90deg, #4ade80, #22d3ee)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              letterSpacing: -0.5,
            }}>
              ⚔️ Quest Log
            </h1>
            <div style={{ fontSize: 11, color: "#7a7a9a", marginTop: 2 }}>
              Level {level} Adventurer · {streak > 0 ? `🔥 ${streak}-day streak` : "Start your streak!"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#9a9ab0" }}>Today: ✅ {todayCompleted} · 📋 {todayPending} left</div>
          </div>
        </div>

        {/* XP Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: "#7a7a9a", width: 40 }}>Lv.{level}</span>
          <div style={{ flex: 1, height: 8, background: "#2a2a3e", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              width: `${(currentXP / neededXP) * 100}%`, height: "100%",
              background: "linear-gradient(90deg, #4ade80, #22d3ee)",
              borderRadius: 4, transition: "width 0.5s ease",
            }} />
          </div>
          <span style={{ fontSize: 10, color: "#7a7a9a", width: 70, textAlign: "right" }}>{currentXP}/{neededXP} XP</span>
        </div>
      </div>

      {/* ─── Active Task Banner ─── */}
      {activeTask && (
        <div style={{
          margin: "12px 16px 0",
          background: "linear-gradient(135deg, #1a3a2a, #1a2a3e)",
          border: "1px solid #2a5a3a",
          borderRadius: 12, padding: 16,
          animation: "pulse-glow 3s ease-in-out infinite",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
              ▶ Currently Focused
            </span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#4ade80", fontVariantNumeric: "tabular-nums" }}>
              {formatTime(getElapsed(activeTask))}
            </span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#e0f0e8", marginBottom: 8 }}>{activeTask.title}</div>
          <GrowingTree elapsed={getElapsed(activeTask)} isActive={true} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => pauseTask(activeTask.id)} style={{
              flex: 1, padding: "10px", background: "#3a3a2a", border: "1px solid #5a5a3a",
              borderRadius: 8, color: "#fbbf24", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>⏸ Pause</button>
            <button onClick={() => completeTask(activeTask.id)} style={{
              flex: 1, padding: "10px", background: "#2a3a2a", border: "1px solid #3a5a3a",
              borderRadius: 8, color: "#4ade80", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>✅ Complete</button>
          </div>
        </div>
      )}

      {/* ─── Tab Navigation ─── */}
      <div style={{ display: "flex", gap: 0, margin: "16px 16px 0", borderBottom: "1px solid #2a2a3e" }}>
        {[
          { id: "tasks", label: "📋 Tasks" },
          { id: "analytics", label: "📊 Analytics" },
          { id: "add", label: "➕ New" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{
            flex: 1, padding: "10px 0", background: "none", border: "none",
            borderBottom: view === tab.id ? "2px solid #4ade80" : "2px solid transparent",
            color: view === tab.id ? "#4ade80" : "#7a7a9a",
            fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
          }}>{tab.label}</button>
        ))}
      </div>

      <div style={{ padding: "12px 16px" }}>
        {/* ─── Add Task View ─── */}
        {view === "add" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="text" placeholder="Quest title..." value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTask()}
              style={{
                width: "100%", padding: "14px 16px", background: "#1e1e3a",
                border: "1px solid #3a3a5e", borderRadius: 10, color: "#e0e0f0",
                fontSize: 15, outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, color: "#7a7a9a", display: "block", marginBottom: 4 }}>CATEGORY</label>
                <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{
                  width: "100%", padding: "10px", background: "#1e1e3a",
                  border: "1px solid #3a3a5e", borderRadius: 8, color: "#e0e0f0", fontSize: 12,
                }}>
                  {Object.entries(groupedCats).map(([group, cats]) => (
                    <optgroup key={group} label={`── ${group} ──`}>
                      {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, color: "#7a7a9a", display: "block", marginBottom: 4 }}>PRIORITY</label>
                <select value={newPriority} onChange={e => setNewPriority(e.target.value)} style={{
                  width: "100%", padding: "10px", background: "#1e1e3a",
                  border: "1px solid #3a3a5e", borderRadius: 8, color: "#e0e0f0", fontSize: 13,
                }}>
                  {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.symbol} {p.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 10, color: "#7a7a9a", display: "block", marginBottom: 4 }}>DUE DATE (optional)</label>
              <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} style={{
                width: "100%", padding: "10px", background: "#1e1e3a",
                border: "1px solid #3a3a5e", borderRadius: 8, color: "#e0e0f0", fontSize: 13,
              }} />
            </div>
            <button onClick={addTask} style={{
              padding: "14px", background: "linear-gradient(135deg, #4ade80, #22d3ee)",
              border: "none", borderRadius: 10, color: "#0f0f1a", fontSize: 15,
              fontWeight: 700, cursor: "pointer", letterSpacing: 0.5,
            }}>
              ⚔️ Add Quest
            </button>

            {/* Category Manager */}
            <div style={{ marginTop: 12, padding: 12, background: "#1a1a2e", borderRadius: 10, border: "1px solid #2a2a3e" }}>
              <button onClick={() => setEditingCategories(!editingCategories)} style={{
                background: "none", border: "none", color: "#7a7a9a", fontSize: 12,
                cursor: "pointer", width: "100%", textAlign: "left",
              }}>
                {editingCategories ? "▼" : "▶"} Manage Categories ({allCategories.length})
              </button>
              {editingCategories && (
                <div style={{ marginTop: 8 }}>
                  {Object.entries(groupedCats).map(([group, cats]) => (
                    <div key={group} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: "#5a5a7a", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{group}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {cats.map(c => (
                          <span key={c.id} style={{
                            fontSize: 11, padding: "3px 8px", borderRadius: 12,
                            background: c.color + "22", color: c.color, border: `1px solid ${c.color}44`,
                          }}>
                            {c.icon} {c.label}
                            {customCategories.find(cc => cc.id === c.id) && (
                              <span onClick={() => setCustomCategories(prev => prev.filter(cc => cc.id !== c.id))}
                                style={{ marginLeft: 4, cursor: "pointer", opacity: 0.7 }}>×</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <input type="text" placeholder="New category..." value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addCustomCategory()}
                      style={{
                        flex: 1, padding: "8px", background: "#0f0f1a", border: "1px solid #3a3a5e",
                        borderRadius: 6, color: "#e0e0f0", fontSize: 12,
                      }} />
                    <button onClick={addCustomCategory} style={{
                      padding: "8px 14px", background: "#3a3a5e", border: "none",
                      borderRadius: 6, color: "#e0e0f0", fontSize: 12, cursor: "pointer",
                    }}>Add</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Tasks View ─── */}
        {view === "tasks" && (
          <div>
            {/* Filters */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              <button onClick={() => setFilterStatus(filterStatus === "active" ? "all" : filterStatus === "all" ? "done" : "active")}
                style={{
                  padding: "6px 12px", borderRadius: 16, border: "1px solid #3a3a5e",
                  background: "#1e1e3a", color: "#9a9ab0", fontSize: 11, cursor: "pointer",
                }}>
                {filterStatus === "active" ? "📋 Active" : filterStatus === "done" ? "✅ Done" : "🔄 All"}
              </button>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{
                padding: "6px 12px", borderRadius: 16, border: "1px solid #3a3a5e",
                background: "#1e1e3a", color: "#9a9ab0", fontSize: 11,
              }}>
                <option value="all">All Categories</option>
                {Object.entries(groupedCats).map(([group, cats]) => (
                  <optgroup key={group} label={`── ${group} ──`}>
                    {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Task List */}
            {filteredTasks.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#5a5a7a" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏰</div>
                <div style={{ fontSize: 14 }}>No quests here. Add one!</div>
              </div>
            )}

            {filteredTasks.map(task => {
              const cat = allCategories.find(c => c.id === task.category);
              const pri = PRIORITIES.find(p => p.id === task.priority);
              const elapsed = getElapsed(task);
              const isActive = task.status === "active";
              const isDone = task.status === "done";

              return (
                <div key={task.id} className="task-card" style={{
                  background: isActive
                    ? "linear-gradient(135deg, #1a3a2a, #1a2a3e)"
                    : isDone ? "#1a1a2e88" : "#1e1e3a",
                  border: `1px solid ${isActive ? "#2a5a3a" : isDone ? "#2a2a3e" : "#3a3a5e"}`,
                  borderLeft: `3px solid ${pri?.color || "#3a3a5e"}`,
                  borderRadius: 10, padding: 14, marginBottom: 8,
                  opacity: isDone ? 0.6 : 1,
                  transition: "all 0.2s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 600,
                        textDecoration: isDone ? "line-through" : "none",
                        color: isDone ? "#7a7a9a" : "#e0e0f0",
                      }}>
                        {task.title}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{
                          fontSize: 10, padding: "2px 8px", borderRadius: 10,
                          background: (cat?.color || "#666") + "22",
                          color: cat?.color || "#999",
                          border: `1px solid ${(cat?.color || "#666")}33`,
                        }}>
                          {cat?.icon} {cat?.label || task.category}
                        </span>
                        <span style={{ fontSize: 10, color: pri?.color }}>{pri?.symbol}</span>
                        {task.dueDate && (
                          <span style={{
                            fontSize: 10, color: task.dueDate < getToday() && !isDone ? "#ef4444" : "#7a7a9a",
                          }}>
                            📅 {task.dueDate}
                          </span>
                        )}
                        {elapsed > 0 && (
                          <span style={{ fontSize: 10, color: isActive ? "#4ade80" : "#7a7a9a", fontVariantNumeric: "tabular-nums" }}>
                            ⏱ {isActive ? formatTime(elapsed) : formatDuration(elapsed)}
                          </span>
                        )}
                        {isDone && (task.totalTime || 0) > 0 && (
                          <span style={{ fontSize: 14 }}>{GROWTH_STAGES[getGrowthStage(task.totalTime)]}</span>
                        )}
                      </div>
                    </div>

                    {!isDone && (
                      <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
                        {!isActive && (
                          <button onClick={() => startTask(task.id)} style={{
                            width: 36, height: 36, borderRadius: 8, border: "1px solid #3a5a3a",
                            background: "#1a3a2a", color: "#4ade80", fontSize: 16,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }}>▶</button>
                        )}
                        {!isActive && (
                          <button onClick={() => completeTask(task.id)} style={{
                            width: 36, height: 36, borderRadius: 8, border: "1px solid #3a3a5e",
                            background: "#1e1e3a", color: "#7a7a9a", fontSize: 14,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }}>✓</button>
                        )}
                        <button onClick={() => deleteTask(task.id)} style={{
                          width: 36, height: 36, borderRadius: 8, border: "1px solid #3a2a2a",
                          background: "#2a1a1a", color: "#ef4444", fontSize: 12,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>✕</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Analytics View ─── */}
        {view === "analytics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Export Button */}
            <div style={{
              background: "#1e1e3a", borderRadius: 12, padding: 16,
              border: "1px solid #2a2a3e",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: 13, color: "#9a9ab0", fontWeight: 600 }}>💾 Export Data</h3>
                  <p style={{ fontSize: 11, color: "#5a5a7a", marginTop: 4 }}>
                    CSV with per-session rows — load with pandas, polars, or any tool
                  </p>
                </div>
                <button onClick={() => downloadCSV(tasks)} style={{
                  padding: "10px 18px", background: "linear-gradient(135deg, #4ade80, #22d3ee)",
                  border: "none", borderRadius: 8, color: "#0f0f1a", fontSize: 12,
                  fontWeight: 700, cursor: "pointer",
                }}>
                  📥 Export CSV
                </button>
              </div>
              <div style={{
                marginTop: 10, padding: 10, background: "#0f0f1a", borderRadius: 6,
                fontSize: 10, color: "#5a5a7a", fontFamily: "monospace", lineHeight: 1.6,
                whiteSpace: "pre", overflowX: "auto",
              }}>
{`import pandas as pd
df = pd.read_csv("quest_log_export_${getToday()}.csv",
                  parse_dates=["created_at","completed_at"])
daily = df.groupby(["session_date","category"])\\
          ["session_duration_minutes"].sum().unstack(fill_value=0)
daily.plot.bar(stacked=True)  # time per category per day`}
              </div>
            </div>

            {/* Time range toggle */}
            <div style={{ display: "flex", gap: 6 }}>
              {[7, 14, 30].map(d => (
                <button key={d} onClick={() => setAnalyticsRange(d)} style={{
                  padding: "6px 14px", borderRadius: 16, fontSize: 11, cursor: "pointer",
                  border: analyticsRange === d ? "1px solid #4ade80" : "1px solid #3a3a5e",
                  background: analyticsRange === d ? "#1a3a2a" : "#1e1e3a",
                  color: analyticsRange === d ? "#4ade80" : "#7a7a9a",
                }}>{d}d</button>
              ))}
            </div>

            <div style={{
              background: "#1e1e3a", borderRadius: 12, padding: 16,
              border: "1px solid #2a2a3e",
            }}>
              <h3 style={{ fontSize: 13, color: "#9a9ab0", marginBottom: 8, fontWeight: 600 }}>📊 Last {analyticsRange} Days</h3>
              <AnalyticsChart tasks={tasks} days={analyticsRange} allCategories={allCategories} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {allCategories.filter(c => tasks.some(t => t.category === c.id && (t.totalTime || 0) > 0)).map(c => (
                  <span key={c.id} style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 3 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, display: "inline-block" }} />
                    <span style={{ color: "#7a7a9a" }}>{c.label}</span>
                  </span>
                ))}
              </div>
            </div>

            <div style={{
              background: "#1e1e3a", borderRadius: 12, padding: 16,
              border: "1px solid #2a2a3e",
            }}>
              <h3 style={{ fontSize: 13, color: "#9a9ab0", marginBottom: 12, fontWeight: 600 }}>⏱ Time by Category (All Time)</h3>
              <CategoryBreakdown tasks={tasks} allCategories={allCategories} />
            </div>

            <div style={{
              background: "#1e1e3a", borderRadius: 12, padding: 16,
              border: "1px solid #2a2a3e",
            }}>
              <h3 style={{ fontSize: 13, color: "#9a9ab0", marginBottom: 12, fontWeight: 600 }}>🏆 Stats</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Total XP", value: xp, icon: "⚡" },
                  { label: "Quests Done", value: tasks.filter(t => t.status === "done").length, icon: "✅" },
                  { label: "Best Streak", value: `${streak}d`, icon: "🔥" },
                  { label: "Total Focus", value: formatDuration(tasks.reduce((a, t) => a + (t.totalTime || 0), 0)), icon: "⏱" },
                ].map(s => (
                  <div key={s.label} style={{
                    background: "#0f0f1a", borderRadius: 8, padding: 12, textAlign: "center",
                  }}>
                    <div style={{ fontSize: 22 }}>{s.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#e0e0f0", marginTop: 4 }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "#7a7a9a" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Forest */}
            <div style={{
              background: "#1e1e3a", borderRadius: 12, padding: 16,
              border: "1px solid #2a2a3e",
            }}>
              <h3 style={{ fontSize: 13, color: "#9a9ab0", marginBottom: 12, fontWeight: 600 }}>🌳 Your Forest</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, minHeight: 40 }}>
                {tasks.filter(t => t.status === "done" && (t.totalTime || 0) > 0).map(t => (
                  <span key={t.id} title={`${t.title} (${formatDuration(t.totalTime)})`}
                    style={{ fontSize: 20 + getGrowthStage(t.totalTime) * 4, cursor: "default" }}>
                    {GROWTH_STAGES[getGrowthStage(t.totalTime)]}
                  </span>
                ))}
                {tasks.filter(t => t.status === "done" && (t.totalTime || 0) > 0).length === 0 && (
                  <span style={{ color: "#5a5a7a", fontSize: 12 }}>Complete timed quests to grow your forest!</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QuestLog />
  </React.StrictMode>
);
