import React, { useState, useCallback } from 'react';
import {
  Network, Users, Star, ChevronRight, Award, Clock,
  TrendingUp, Shield, GitBranch, Info
} from 'lucide-react';
import { useAuth, ROLES, ROLE_LABELS } from '../contexts/AuthContext';
import { useHierarchy, COMMISSION_RATES } from '../contexts/HierarchyContext';
import { PageHeader, Card } from '../components/ui';
import { formatCurrency } from '../utils/helpers';
import HierarchyTree from '../components/hierarchy/HierarchyTree';

// ─── Role legend ─────────────────────────────────────────────────────────────
const ROLE_LEGEND = [
  { role: 'STATE_HEAD',    label: 'State Head',    color: 'bg-purple-700'  },
  { role: 'ZONAL_MANAGER', label: 'Zonal Manager', color: 'bg-blue-600'    },
  { role: 'AREA_MANAGER',  label: 'Area Manager',  color: 'bg-indigo-500'  },
  { role: 'DO_MANAGER',    label: 'DO Manager',    color: 'bg-green-600'   },
  { role: 'ADVISOR',       label: 'Advisor',       color: 'bg-amber-500'   },
];

// ─── Node detail panel (shows on click) ───────────────────────────────────────
function NodeDetailPanel({ node, commissions, onClose }) {
  if (!node) return null;
  const myCommissions = commissions.filter(c => c.userId === node.id);
  const totalEarned   = myCommissions.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="card p-5 space-y-4 animate-fadeIn border border-green-100">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
            {node.avatar || node.name?.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800">{node.name}</h3>
              {node.isPromoted && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">
                  <Star size={9} className="fill-yellow-600 text-yellow-600" /> PROMOTED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{ROLE_LABELS[node.role]} · {node.region}</p>
            {node.advisorCode && (
              <p className={`text-xs font-mono mt-0.5 ${node.isPromoted ? 'text-slate-400 line-through' : 'text-blue-600'}`}>
                {node.advisorCode}
              </p>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
      </div>

      {/* Commission rate */}
      <div className="bg-green-50 rounded-xl p-3">
        <p className="text-xs text-slate-500 mb-1">Commission Rate</p>
        <p className="text-lg font-bold text-green-700">
          {((COMMISSION_RATES[node.role] || 0) * 100).toFixed(1)}%
          <span className="text-xs font-normal text-slate-400 ml-1.5">per sale</span>
        </p>
        <p className="text-xs text-slate-500 mt-0.5">Total earnings from snapshot orders:</p>
        <p className="text-base font-semibold text-slate-800">{formatCurrency(totalEarned)}</p>
      </div>

      {/* Role history */}
      <div>
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Role History</p>
        <div className="space-y-1.5">
          {(node.roleHistory || []).map((h, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${h.to ? 'bg-slate-300' : 'bg-green-500'}`} />
              <span className="font-medium text-slate-700">{ROLE_LABELS[h.role] || h.role}</span>
              <span className="text-slate-400">
                {h.from} → {h.to || <span className="text-green-600 font-semibold">Present</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent commissions */}
      {myCommissions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Recent Commissions</p>
          <div className="space-y-1">
            {myCommissions.slice(-4).reverse().map(c => (
              <div key={c.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">{c.orderId}</span>
                <span className="text-slate-500">{c.role}</span>
                <span className="font-semibold text-green-700">+{formatCurrency(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {node.promotedAt && (
        <p className="text-[10px] text-slate-400 flex items-center gap-1">
          <Clock size={10} /> Promoted on {node.promotedAt}
        </p>
      )}
    </div>
  );
}

// ─── Promotion timeline ────────────────────────────────────────────────────────
function PromotionTimeline({ nodes }) {
  const promoted = nodes
    .filter(n => n.isPromoted && n.promotedAt)
    .sort((a, b) => b.promotedAt.localeCompare(a.promotedAt));

  if (promoted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Award size={28} className="text-slate-200 mb-2" />
        <p className="text-sm text-slate-400">No promotions yet. Approve a promotion request to see history here.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-50">
      {promoted.map(n => (
        <div key={n.id} className="px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-yellow-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Star size={16} className="text-yellow-500 fill-yellow-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-semibold text-slate-800">{n.name}</p>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="text-slate-500">{ROLE_LABELS[n.previousRole]}</span>
              <ChevronRight size={11} />
              <span className="text-green-600 font-semibold">{ROLE_LABELS[n.role]}</span>
              <span className="mx-1">·</span>
              {n.promotedAt}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Commission rate legend ────────────────────────────────────────────────────
function CommissionRateCard() {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={15} className="text-green-600" />
        <h3 className="text-sm font-semibold text-slate-800">Commission Rates</h3>
      </div>
      <div className="space-y-2">
        {Object.entries(COMMISSION_RATES).map(([role, rate]) => (
          <div key={role} className="flex items-center justify-between text-xs">
            <span className="text-slate-600">{ROLE_LABELS[role] || role}</span>
            <span className="font-bold text-green-700">{(rate * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
      <div className="mt-3 p-2.5 bg-blue-50 rounded-lg">
        <p className="text-[10px] text-blue-600 flex items-start gap-1">
          <Info size={10} className="flex-shrink-0 mt-0.5" />
          Commissions are frozen at the hierarchy snapshot taken when the order was placed.
          Promotions don't affect past earnings.
        </p>
      </div>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HierarchyPage() {
  const { user } = useAuth();
  const { nodes, commissions, buildTree, getEmployeeRoots } = useHierarchy();
  const isAdmin = user?.role === ROLES.ADMIN;

  const [selectedNode, setSelectedNode] = useState(null);
  const [activeTab,    setActiveTab]    = useState('tree');
  const [highlightId,  setHighlightId]  = useState(null);

  // Admin sees the full tree from STATE_HEAD level; others see their own subtree
  const roots = isAdmin
    ? getEmployeeRoots().filter(n => n.role !== 'ADMIN')
    : [nodes.find(n => n.id === user?.id)].filter(Boolean);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    setHighlightId(node.id);
  }, []);

  const promotedNodes = nodes.filter(n => n.isPromoted);

  const tabs = [
    { id: 'tree',      label: 'Org Chart',           icon: Network },
    { id: 'timeline',  label: `Promotions (${promotedNodes.length})`, icon: Star },
    { id: 'rates',     label: 'Commission Rates',     icon: TrendingUp },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Hierarchy & Org Chart"
        subtitle={isAdmin
          ? 'Full employee network — click any node to see details & role history'
          : `Viewing your downline — ${nodes.filter(n => n.parentId === user?.id).length} direct reports`}
        actions={
          promotedNodes.length > 0 && (
            <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full flex items-center gap-1.5">
              <Star size={11} className="fill-yellow-600" />
              {promotedNodes.length} promoted employee{promotedNodes.length > 1 ? 's' : ''}
            </span>
          )
        }
      />

      {/* Role legend */}
      <div className="flex flex-wrap gap-2">
        {ROLE_LEGEND.map(l => (
          <span key={l.role} className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-white px-2.5 py-1 rounded-full" style={{}}>
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold text-white px-2.5 py-1 rounded-full ${l.color}`}>
              {l.label}
            </span>
          </span>
        ))}
        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 px-2 py-1">
          <Star size={10} className="fill-yellow-400 text-yellow-400" /> = Promoted
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-100">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Org Chart Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'tree' && (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Tree */}
          <div className={`${selectedNode ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            {roots.map(root => {
              const tree = buildTree(root.id);
              return (
                <Card key={root.id} padding={false}>
                  <div className="p-4 border-b border-slate-50 flex items-center gap-2">
                    <GitBranch size={14} className="text-green-600" />
                    <h3 className="text-sm font-semibold text-slate-800">
                      {root.name}'s Network
                    </h3>
                    <span className="text-xs text-slate-400">· {ROLE_LABELS[root.role]}</span>
                  </div>
                  <div className="p-4 overflow-x-auto">
                    <HierarchyTree
                      treeData={tree}
                      highlightedId={highlightId}
                      onNodeClick={handleNodeClick}
                    />
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Detail panel */}
          {selectedNode && (
            <div className="lg:col-span-1">
              <NodeDetailPanel
                node={selectedNode}
                commissions={commissions}
                onClose={() => { setSelectedNode(null); setHighlightId(null); }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Promotion Timeline Tab ─────────────────────────────────────────── */}
      {activeTab === 'timeline' && (
        <Card padding={false}>
          <div className="p-5 border-b border-slate-50">
            <h3 className="text-sm font-semibold text-slate-800">Promotion History</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              All employees who have been promoted. Their previous advisor codes remain archived.
            </p>
          </div>
          <PromotionTimeline nodes={nodes} />
        </Card>
      )}

      {/* ── Commission Rates Tab ───────────────────────────────────────────── */}
      {activeTab === 'rates' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <CommissionRateCard />
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={15} className="text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-800">Snapshot Protection</h3>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-700 text-xs font-bold">1</span>
                </div>
                <p>Every new order captures a <strong>hierarchySnapshot</strong> — recording exactly who was advisor, DO, area manager, etc. at the time of sale.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-700 text-xs font-bold">2</span>
                </div>
                <p>Commissions are always calculated from the snapshot. <strong>Past orders are frozen</strong> — a promotion never changes old earnings.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-700 text-xs font-bold">3</span>
                </div>
                <p>Future orders use the <strong>new hierarchy</strong>. The promoted employee earns at their new role rate, and commission skips their old position.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-amber-700 text-xs font-bold">4</span>
                </div>
                <p>Advisor code is <strong>archived</strong> (not deleted) — it's preserved in role history for audit purposes.</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
