'use client'

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ExternalLink, TrendingUp, Shield, Zap, BarChart2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SourceItem {
  link?: string;
  text?: string;
  title?: string;
  url?: string;
}

interface FactCheckResult {
  verdict: string;
  confidence: number;
  analysis: string;
  supporting_points: string[];
  opposing_points: string[];
  reason: string;
  reddit: SourceItem[];
  quora: SourceItem[];
  youtube: SourceItem[];
  other: SourceItem[];
  analytics: {
    source_distribution?: {
      reddit?: number;
      quora?: number;
      youtube?: number;
      other?: number;
    };
    signals?: string[];
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const exampleClaims = [
  'Boat earbuds have connectivity issues',
  'Realme earbuds are better than Boat',
  'iPhone battery drains too fast',
  'AI will replace software engineers',
  'Protein powder is harmful',
];

// Shared tri-gradient (pink → yellow → blue) — applied via inline style for full control
const TRI_GRADIENT = 'linear-gradient(to right, #ec4899, #f59e0b, #3b82f6)';

const SOURCE_CONFIG: Record<
  string,
  { color: string; bg: string; reliability: number; icon: JSX.Element; label: string }
> = {
  Reddit: {
    label: 'Reddit',
    color: '#FF4500',
    bg: 'rgba(255,69,0,0.08)',
    reliability: 72,
    icon: (
      <svg viewBox="0 0 20 20" className="w-4 h-4 flex-shrink-0">
        <circle cx="10" cy="10" r="10" fill="#FF4500" />
        <path
          fill="white"
          d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.07 2.13.45a1 1 0 1 0 .13-.53l-2.38-.5a.25.25 0 0 0-.3.19l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .4c0 2 2.33 3.61 5.2 3.61s5.2-1.62 5.2-3.61a2.87 2.87 0 0 0 0-.4 1.46 1.46 0 0 0 .82-1.37zM7.57 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.71a3.58 3.58 0 0 1-3.14.5 3.58 3.58 0 0 1-3.14-.5.25.25 0 0 1 .35-.35 3.08 3.08 0 0 0 2.79.43 3.08 3.08 0 0 0 2.79-.43.25.25 0 1 1 .35.35zm-.21-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"
        />
      </svg>
    ),
  },
  Quora: {
    label: 'Quora',
    color: '#B92B27',
    bg: 'rgba(185,43,39,0.07)',
    reliability: 80,
    icon: (
      <svg viewBox="0 0 20 20" className="w-4 h-4 flex-shrink-0">
        <circle cx="10" cy="10" r="10" fill="#B92B27" />
        <text x="5.5" y="14.5" fontSize="11" fill="white" fontWeight="bold">
          Q
        </text>
      </svg>
    ),
  },
  YouTube: {
    label: 'YouTube',
    color: '#FF0000',
    bg: 'rgba(255,0,0,0.07)',
    reliability: 65,
    icon: (
      <svg viewBox="0 0 20 20" className="w-4 h-4 flex-shrink-0">
        <rect width="20" height="20" rx="4" fill="#FF0000" />
        <polygon points="7,5 16,10 7,15" fill="white" />
      </svg>
    ),
  },
  Other: {
    label: 'Other',
    color: '#6366F1',
    bg: 'rgba(99,102,241,0.08)',
    reliability: 55,
    icon: (
      <svg viewBox="0 0 20 20" className="w-4 h-4 flex-shrink-0">
        <circle cx="10" cy="10" r="9" fill="#6366F1" />
        <circle cx="10" cy="10" r="3.5" fill="white" />
      </svg>
    ),
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getVerdictStyle(verdict?: string) {
  switch (verdict?.toUpperCase()) {
    case 'SUPPORTED':
      return {
        pill: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
        glow: 'shadow-emerald-100',
      };
    case 'REFUTED':
      return {
        pill: 'bg-red-100 text-red-800 border-red-200',
        dot: 'bg-red-500',
        glow: 'shadow-red-100',
      };
    case 'MIXED':
      return {
        pill: 'bg-amber-100 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
        glow: 'shadow-amber-100',
      };
    default:
      return {
        pill: 'bg-gray-100 text-gray-700 border-gray-200',
        dot: 'bg-gray-400',
        glow: 'shadow-gray-100',
      };
  }
}

function getDisplayText(item: SourceItem) {
  return item.title || item.text || item.url || item.link || 'View source';
}

function getLink(item: SourceItem) {
  return item.link || item.url || '#';
}

function getSentiment(supporting: number, opposing: number): {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
} {
  if (supporting === 0 && opposing === 0)
    return { label: 'No Data', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', icon: '—' };
  const ratio = supporting / (supporting + opposing);
  if (ratio >= 0.65) return { label: 'Positive', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '↑' };
  if (ratio >= 0.4) return { label: 'Mixed', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: '~' };
  return { label: 'Negative', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: '↓' };
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
      {children}
    </p>
  );
}

// ─── Animated Progress Bar ────────────────────────────────────────────────────

function AnimBar({
  value,
  color,
  delay = 0,
  height = 'h-2',
  gradient,
}: {
  value: number;
  color?: string;
  delay?: number;
  height?: string;
  gradient?: string;
}) {
  return (
    <div className={`w-full bg-gray-100 rounded-full ${height} overflow-hidden`}>
      <motion.div
        className={`${height} rounded-full`}
        style={{ background: gradient ?? color ?? '#6366f1' }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut', delay }}
      />
    </div>
  );
}

// ─── Donut Chart (improved) ───────────────────────────────────────────────────

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        No source data available.
      </div>
    );
  }

  const R = 72;
  const cx = 90;
  const cy = 90;
  const circumference = 2 * Math.PI * R;
  const GAP = 0.018; // gap between slices (radians)

  const activeSlices = data.filter((d) => d.value > 0);
  let cumAngle = -Math.PI / 2; // start at top

  const slices = activeSlices.map((d) => {
    const fraction = d.value / total;
    const angle = fraction * 2 * Math.PI - GAP;
    const startA = cumAngle + GAP / 2;
    const endA = startA + angle;
    cumAngle += fraction * 2 * Math.PI;

    const x1 = cx + R * Math.cos(startA);
    const y1 = cy + R * Math.sin(startA);
    const x2 = cx + R * Math.cos(endA);
    const y2 = cy + R * Math.sin(endA);
    const large = angle > Math.PI ? 1 : 0;

    const innerR = 48;
    const ix1 = cx + innerR * Math.cos(startA);
    const iy1 = cy + innerR * Math.sin(startA);
    const ix2 = cx + innerR * Math.cos(endA);
    const iy2 = cy + innerR * Math.sin(endA);

    const path = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1} Z`;

    return { ...d, path, fraction };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative flex-shrink-0">
        <svg viewBox="0 0 180 180" className="w-36 h-36 drop-shadow-sm">
          {slices.map((slice, i) => (
            <motion.path
              key={i}
              d={slice.path}
              fill={slice.color}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          ))}
          {/* Center circle with total count */}
          <circle cx={cx} cy={cy} r="40" fill="white" />
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fontSize="18"
            fontWeight="700"
            fill="#111827"
          >
            {total}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="8" fill="#9CA3AF">
            sources
          </text>
        </svg>
      </div>

      {/* Legend */}
      <ul className="flex flex-col gap-2.5 min-w-[130px]">
        {slices.map((slice, i) => (
          <li key={i} className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: slice.color }}
            />
            <span className="text-sm text-gray-700">{slice.label}</span>
            <span className="ml-auto text-sm font-semibold text-gray-500">
              {Math.round(slice.fraction * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Dashboard Stat Card ──────────────────────────────────────────────────────

function DashCard({
  icon,
  title,
  children,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      className="bg-white/70 backdrop-blur-sm border border-white/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gray-400">{icon}</span>
        <SectionLabel>{title}</SectionLabel>
      </div>
      {children}
    </motion.div>
  );
}

// ─── Analytics Dashboard ─────────────────────────────────────────────────────

function AnalyticsDashboard({ result }: { result: FactCheckResult }) {
  const dist = result.analytics?.source_distribution ?? {};
  const signals = result.analytics?.signals ?? [];

  const chartData = [
    {
      label: 'Reddit',
      value: dist.reddit ?? result.reddit?.length ?? 0,
      color: '#FF4500',
    },
    {
      label: 'Quora',
      value: dist.quora ?? result.quora?.length ?? 0,
      color: '#B92B27',
    },
    {
      label: 'YouTube',
      value: dist.youtube ?? result.youtube?.length ?? 0,
      color: '#FF0000',
    },
    {
      label: 'Other',
      value: dist.other ?? result.other?.length ?? 0,
      color: '#6366F1',
    },
  ];

  const total = chartData.reduce((s, d) => s + d.value, 0);
  const dominantSource = [...chartData].sort((a, b) => b.value - a.value)[0];
  const confidencePct = Math.round((result.confidence ?? 0) * 100);

  const sCount = result.supporting_points?.length ?? 0;
  const oCount = result.opposing_points?.length ?? 0;
  const sentiment = getSentiment(sCount, oCount);

  // Auto insight
  const diverseSources = chartData.filter((d) => d.value > 0).length;
  let insightText =
    signals.length > 0
      ? signals[0]
      : (() => {
          const parts: string[] = [];
          if (dominantSource?.value > 0)
            parts.push(
              `Most ${sCount > oCount ? 'supporting' : 'opposing'} signals come from ${dominantSource.label}`
            );
          if (diverseSources <= 1) parts.push('evidence is concentrated in a single source type');
          else if (diverseSources >= 3) parts.push('evidence spans multiple platforms');
          if (oCount > 0 && sCount > oCount * 2)
            parts.push('while opposing signals are limited but present');
          return parts.length > 0
            ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + (parts[1] ? `, ${parts[1]}` : '') + (parts[2] ? `, ${parts[2]}` : '') + '.'
            : 'Insufficient data to generate an insight summary.';
        })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.12, ease: 'easeOut' }}
      className="mt-8 rounded-2xl overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(248,245,255,0.92) 50%, rgba(240,249,255,0.85) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow:
          '0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 40px -8px rgba(99,102,241,0.08)',
      }}
    >
      {/* Header band */}
      <div
        className="px-7 py-4 flex items-center gap-3 border-b border-white/60"
        style={{
          background:
            'linear-gradient(to right, rgba(236,72,153,0.06), rgba(245,158,11,0.04), rgba(59,130,246,0.06))',
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: TRI_GRADIENT }}
        >
          <BarChart2 className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900 leading-tight">
            Analysis Insights
          </h3>
          <p className="text-[11px] text-gray-400">Evidence breakdown &amp; confidence signals</p>
        </div>
        {/* Live badge */}
        <div className="ml-auto flex items-center gap-1.5 bg-white/80 rounded-full px-3 py-1 border border-gray-100">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            Live
          </span>
        </div>
      </div>

      {/* Grid of cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* 1. Source Distribution */}
        <DashCard icon={<TrendingUp className="w-3.5 h-3.5" />} title="Source Distribution" delay={0.15}>
          <DonutChart data={chartData} />
        </DashCard>

        {/* 2. Verdict Breakdown */}
        <DashCard icon={<BarChart2 className="w-3.5 h-3.5" />} title="Verdict Breakdown" delay={0.2}>
          {sCount === 0 && oCount === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No signal data.</p>
          ) : (
            <div className="space-y-4">
              {/* Supporting */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Supporting signals
                  </span>
                  <span className="text-gray-500 font-medium">
                    {sCount + oCount > 0 ? Math.round((sCount / (sCount + oCount)) * 100) : 0}%
                  </span>
                </div>
                <AnimBar
                  value={sCount + oCount > 0 ? (sCount / (sCount + oCount)) * 100 : 0}
                  color="#10b981"
                  delay={0.3}
                  height="h-2.5"
                />
              </div>
              {/* Opposing */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-red-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                    Opposing signals
                  </span>
                  <span className="text-gray-500 font-medium">
                    {sCount + oCount > 0 ? Math.round((oCount / (sCount + oCount)) * 100) : 0}%
                  </span>
                </div>
                <AnimBar
                  value={sCount + oCount > 0 ? (oCount / (sCount + oCount)) * 100 : 0}
                  color="#ef4444"
                  delay={0.4}
                  height="h-2.5"
                />
              </div>

              {/* Mini stats row */}
              <div className="flex gap-3 pt-1">
                <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-xl font-bold text-emerald-700">{sCount}</p>
                  <p className="text-[10px] text-emerald-500 uppercase tracking-wide">Supporting</p>
                </div>
                <div className="flex-1 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-xl font-bold text-red-600">{oCount}</p>
                  <p className="text-[10px] text-red-400 uppercase tracking-wide">Opposing</p>
                </div>
              </div>
            </div>
          )}
        </DashCard>

        {/* 3. Source Reliability */}
        <DashCard icon={<Shield className="w-3.5 h-3.5" />} title="Source Reliability" delay={0.25}>
          <div className="space-y-3.5">
            {Object.entries(SOURCE_CONFIG).map(([key, cfg], i) => (
              <div key={key} className="flex items-center gap-3">
                <span className="flex-shrink-0">{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700 font-medium">{cfg.label}</span>
                    <span className="text-gray-400">{cfg.reliability}%</span>
                  </div>
                  <AnimBar
                    value={cfg.reliability}
                    color={cfg.color}
                    delay={0.3 + i * 0.07}
                    height="h-1.5"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
            Reliability scores reflect editorial quality and peer-review standards across platforms.
          </p>
        </DashCard>

        {/* 4. Sentiment + Signal Strength + Insight combined */}
        <DashCard icon={<Zap className="w-3.5 h-3.5" />} title="Sentiment &amp; Confidence" delay={0.3}>
          <div className="space-y-5">
            {/* Sentiment badge */}
            <div className="flex items-center gap-3">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${sentiment.bg} ${sentiment.border} ${sentiment.color}`}
              >
                <span className="text-base font-bold">{sentiment.icon}</span>
                {sentiment.label} Sentiment
              </div>
            </div>

            {/* Confidence bar */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-600 font-medium">Overall Confidence</span>
                <span className="font-bold text-gray-900">{confidencePct}%</span>
              </div>
              <AnimBar
                value={confidencePct}
                gradient={TRI_GRADIENT}
                delay={0.4}
                height="h-3"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>

            {/* Source count mini-bars */}
            {total > 0 && (
              <div className="space-y-2 pt-1">
                {chartData
                  .filter((d) => d.value > 0)
                  .map((d, i) => (
                    <div key={d.label} className="flex items-center gap-2.5 text-xs">
                      <span className="w-12 text-right text-gray-500 flex-shrink-0">
                        {d.label}
                      </span>
                      <div className="flex-1">
                        <AnimBar value={(d.value / total) * 100} color={d.color} delay={0.45 + i * 0.06} height="h-1.5" />
                      </div>
                      <span className="w-5 text-gray-400 flex-shrink-0">{d.value}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </DashCard>
      </div>

      {/* Insight Summary — full width strip */}
      <div
        className="mx-6 mb-6 rounded-2xl border border-indigo-100/60 overflow-hidden"
        style={{
          background:
            'linear-gradient(100deg, rgba(236,72,153,0.04) 0%, rgba(245,158,11,0.04) 50%, rgba(99,102,241,0.06) 100%)',
        }}
      >
        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: TRI_GRADIENT }}
            >
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                Insight Summary
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{insightText}</p>
              {signals.length > 1 &&
                signals.slice(1).map((s, i) => (
                  <p key={i} className="text-sm text-gray-600 leading-relaxed mt-1">
                    {s}
                  </p>
                ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Source Card ──────────────────────────────────────────────────────────────

function SourceCard({ item, platform }: { item: SourceItem; platform: string }) {
  const cfg = SOURCE_CONFIG[platform] ?? SOURCE_CONFIG['Other'];
  const link = getLink(item);
  const displayText = getDisplayText(item);
  const truncated = displayText.length > 90 ? displayText.slice(0, 90) + '…' : displayText;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <span className="mt-0.5 flex-shrink-0">{cfg.icon}</span>
      <span className="flex-1 text-sm text-gray-600 group-hover:text-gray-900 transition-colors line-clamp-2 leading-relaxed">
        {truncated}
      </span>
      <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 flex-shrink-0 mt-0.5 transition-colors" />
    </a>
  );
}

// ─── Sources Section ──────────────────────────────────────────────────────────

function SourcesSection({ result }: { result: FactCheckResult }) {
  const sections = [
    { name: 'Reddit', data: result.reddit ?? [] },
    { name: 'Quora', data: result.quora ?? [] },
    { name: 'YouTube', data: result.youtube ?? [] },
    { name: 'Other', data: result.other ?? [] },
  ].filter((s) => s.data.length > 0);

  if (sections.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="mt-7 pt-7 border-t border-gray-100"
    >
      <h3 className="text-xl font-bold text-gray-900 mb-5">Source Signals</h3>
      <div className="space-y-6">
        {sections.map((section) => {
          const cfg = SOURCE_CONFIG[section.name] ?? SOURCE_CONFIG['Other'];
          return (
            <div key={section.name}>
              <div className="flex items-center gap-2 mb-3">
                {cfg.icon}
                <span className="text-sm font-semibold" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
                <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 ml-1">
                  {section.data.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {section.data.map((item, i) => (
                  <SourceCard key={i} item={item} platform={section.name} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ResultSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 animate-pulse space-y-5">
        <div className="flex justify-between items-center">
          <div className="h-7 w-20 bg-gray-200 rounded-lg" />
          <div className="h-9 w-28 bg-gray-200 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-3.5 w-24 bg-gray-200 rounded" />
            <div className="h-3.5 w-10 bg-gray-200 rounded" />
          </div>
          <div className="h-2.5 w-full bg-gray-100 rounded-full" />
        </div>
        <div className="h-20 bg-gray-50 rounded-xl border border-gray-100" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-28 bg-emerald-50 rounded-xl border border-emerald-100" />
          <div className="h-28 bg-red-50 rounded-xl border border-red-50" />
        </div>
        <div className="h-16 bg-blue-50 rounded-xl border border-blue-50" />
      </div>
      <div className="bg-white/60 rounded-2xl border border-gray-100 animate-pulse h-48" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CheckPage() {
  const [claim, setClaim] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!claim.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: claim }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to check claim');

      setResult({
        verdict: data.system_output?.verdict ?? 'Unknown',
        confidence: (data.system_output?.confidence ?? 0) / 100,
        analysis: data.ai_output?.analysis ?? '',
        supporting_points: Array.isArray(data.ai_output?.supporting_points)
          ? data.ai_output.supporting_points
          : [],
        opposing_points: Array.isArray(data.ai_output?.opposing_points)
          ? data.ai_output.opposing_points
          : [],
        reason: data.ai_output?.reason ?? '',
        reddit: Array.isArray(data.system_output?.reddit) ? data.system_output.reddit : [],
        quora: Array.isArray(data.system_output?.quora) ? data.system_output.quora : [],
        youtube: Array.isArray(data.system_output?.youtube) ? data.system_output.youtube : [],
        other: Array.isArray(data.system_output?.other) ? data.system_output.other : [],
        analytics: data.analytics ?? {},
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setClaim(example);
    setResult(null);
    setError(null);
  };

  const verdictStyle = getVerdictStyle(result?.verdict);

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: [0.43, 0.13, 0.23, 0.96] }}
      className="min-h-screen bg-white relative overflow-hidden"
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-[-10%] w-[480px] h-[480px] bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-35 animate-blob" />
        <div className="absolute top-10 right-[-8%] w-[420px] h-[420px] bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob animation-delay-2000" />
        <div className="absolute bottom-10 right-[10%] w-[380px] h-[380px] bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
        <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 max-w-4xl">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          {/* Gradient accent line above title */}
          <div
            className="w-12 h-1 rounded-full mx-auto mb-4"
            style={{ background: TRI_GRADIENT }}
          />
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-3 tracking-tight">
            Brand &amp; Claim Analysis AI
          </h1>
          <p className="text-gray-500 text-base max-w-md mx-auto">
            Turn reviews, opinions, and online signals into structured insights.
          </p>
        </motion.div>

        {/* Input Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-5 border border-gray-100 hover:shadow-2xl transition-shadow duration-300"
        >
          <Textarea
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="Enter a claim (e.g., 'Realme earbuds are better than Boat')"
            className="min-h-[120px] text-base resize-none border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all mb-5"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCheck();
            }}
          />
          <Button
            onClick={handleCheck}
            disabled={!claim.trim() || loading}
            className="w-full h-12 text-base font-semibold text-white rounded-full shadow-lg hover:shadow-xl hover:scale-[1.015] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
            style={{ background: TRI_GRADIENT }}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing claim…
              </>
            ) : (
              'Analyze Claim →'
            )}
          </Button>
        </motion.div>

        {/* Example chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2 justify-center mb-10 items-center"
        >
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Try:
          </span>
          {exampleClaims.map((example, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleExampleClick(example)}
              className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 transition-all shadow-sm hover:shadow"
            >
              {example}
            </motion.button>
          ))}
        </motion.div>

        {/* Error state */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-800 text-sm"
            >
              <span className="font-semibold">Error: </span>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skeleton */}
        <AnimatePresence>
          {loading && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResultSkeleton />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            >
              {/* ── Main Result Card ── */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-100">

                {/* Verdict row */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Analysis Result</h3>
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 240 }}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full border-2 font-bold text-sm shadow-sm ${verdictStyle.pill} ${verdictStyle.glow}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${verdictStyle.dot}`} />
                    {result.verdict ?? 'Unknown'}
                  </motion.div>
                </div>

                {/* Confidence */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-gray-500">Signal Confidence</span>
                    <span className="font-bold text-gray-900">
                      {Math.round((result.confidence ?? 0) * 100)}%
                    </span>
                  </div>
                  <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ background: TRI_GRADIENT }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(result.confidence ?? 0) * 100}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                    />
                  </div>
                </div>

                {/* Analysis */}
                {result.analysis && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gray-50 rounded-xl p-5 border border-gray-100 mb-4"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                      Analysis
                    </p>
                    <p className="text-gray-700 leading-relaxed text-sm">{result.analysis}</p>
                  </motion.div>
                )}

                {/* Supporting & Opposing */}
                {(result.supporting_points.length > 0 || result.opposing_points.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {result.supporting_points.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                        className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 hover:shadow-sm transition-shadow duration-200"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2.5">
                          ✅ Supporting Points
                        </p>
                        <ul className="space-y-2">
                          {result.supporting_points.map((point, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-emerald-400 mt-1 flex-shrink-0 text-xs">▸</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                    {result.opposing_points.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-red-50 border border-red-100 rounded-xl p-4 hover:shadow-sm transition-shadow duration-200"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-2.5">
                          ❌ Opposing Points
                        </p>
                        <ul className="space-y-2">
                          {result.opposing_points.map((point, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-red-400 mt-1 flex-shrink-0 text-xs">▸</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Final Conclusion */}
                {result.reason && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="rounded-xl p-5 border border-blue-100 hover:shadow-sm transition-shadow duration-200"
                    style={{
                      background:
                        'linear-gradient(100deg, rgba(236,72,153,0.04) 0%, rgba(245,158,11,0.03) 50%, rgba(59,130,246,0.05) 100%)',
                    }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-2">
                      Final Conclusion
                    </p>
                    <p className="text-gray-700 leading-relaxed text-sm">{result.reason}</p>
                  </motion.div>
                )}

                {/* Sources */}
                <SourcesSection result={result} />
              </div>

              {/* Analytics Dashboard */}
              <AnalyticsDashboard result={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}