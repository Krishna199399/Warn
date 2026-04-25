import React from 'react';
import HierarchyNode from './HierarchyNode';

// ─── Recursive tree column layout ────────────────────────────────────────────
// Renders a tree of nodes as nested columns connected by lines.
// Each level is a horizontal row of siblings; parents are centred above children.

function TreeLevel({ treeNode, highlightedId, onNodeClick }) {
  if (!treeNode) return null;

  const hasChildren = treeNode.children && treeNode.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* The node itself */}
      <HierarchyNode
        node={treeNode}
        isHighlighted={treeNode.id === highlightedId}
        onClick={onNodeClick}
      />

      {/* Vertical connector line down to children */}
      {hasChildren && (
        <div className="w-px h-6 bg-slate-200 mt-1" />
      )}

      {/* Children row */}
      {hasChildren && (
        <div className="relative flex items-start gap-8">
          {/* Horizontal bar spanning all children */}
          {treeNode.children.length > 1 && (
            <div
              className="absolute top-0 left-0 right-0 h-px bg-slate-200"
              style={{ top: 0 }}
            />
          )}

          {treeNode.children.map((child, idx) => (
            <div key={child.id} className="flex flex-col items-center">
              {/* Vertical drop from horizontal bar */}
              <div className="w-px h-4 bg-slate-200" />
              <TreeLevel
                treeNode={child}
                highlightedId={highlightedId}
                onNodeClick={onNodeClick}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── HierarchyTree ────────────────────────────────────────────────────────────
// Props:
//   treeData       — recursive tree object from HierarchyContext.buildTree(rootId)
//   highlightedId  — userId to highlight (e.g. newly promoted user)
//   onNodeClick    — (node) => void
export default function HierarchyTree({ treeData, highlightedId, onNodeClick }) {
  if (!treeData) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
        No hierarchy data available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="inline-flex justify-center min-w-full px-8 pt-6">
        <TreeLevel
          treeNode={treeData}
          highlightedId={highlightedId}
          onNodeClick={onNodeClick}
        />
      </div>
    </div>
  );
}
