"use client"

import { ReactFlow, Background, type Node, type Edge, MarkerType } from "@xyflow/react"
import "@xyflow/react/dist/style.css"

const edgeStyle = { stroke: "#5f766d", strokeWidth: 1.5 }
const markerEnd = { type: MarkerType.ArrowClosed, color: "#5f766d", width: 14, height: 14 }

const base = (bg: string, border: string, color: string, extra?: object): React.CSSProperties => ({
  fontSize: "12px",
  lineHeight: 1.45,
  textAlign: "center",
  padding: "8px 10px",
  borderRadius: "6px",
  width: "140px",
  background: bg,
  border: `1.5px solid ${border}`,
  color,
  ...extra,
})

const s = {
  start: base("#edf7f2", "#38b48b", "#22322d", { borderRadius: "100px", fontWeight: "bold", width: "180px" }),
  end:   base("#edf7f2", "#38b48b", "#22322d", { borderRadius: "100px", fontWeight: "bold", width: "180px" }),
  proc:  base("#ffffff", "#b7d7cb", "#314640"),
  dec:   base("#fff9e6", "#c9910a", "#7a5800", { fontWeight: "bold", width: "170px" }),
  dur:   base("#e8f0ff", "#3b82f6", "#1d4ed8"),
  step:  (n: string) => ({ ...base("#ffffff", "#b7d7cb", "#314640"), width: "120px" } as React.CSSProperties),
}

const lbl = (top: React.ReactNode, bottom?: React.ReactNode) => (
  <div>
    {top && <div style={{ fontWeight: "bold", marginBottom: bottom ? 2 : 0 }}>{top}</div>}
    {bottom && <div style={{ fontSize: "11px" }}>{bottom}</div>}
  </div>
)

// ── GビズID decision flow ───────────────────────────────────────────────────
const gbizNodes: Node[] = [
  { id: "start", type: "input",  position: { x: 110, y: 0 },   data: { label: "申請スタート" },                    style: s.start },
  { id: "dec",                   position: { x: 65,  y: 90 },  data: { label: lbl("マイナンバーカードを", "持っている？") }, style: s.dec },

  { id: "app",   position: { x: -10, y: 230 }, data: { label: lbl("GビズIDアプリを", "インストール") },     style: s.proc },
  { id: "nfc",   position: { x: -10, y: 320 }, data: { label: lbl("マイナンバーカードを", "NFC読み取り") }, style: s.proc },
  { id: "form",  position: { x: -10, y: 410 }, data: { label: lbl("オンライン申請", "フォームに入力") },    style: s.proc },
  { id: "r_on",  position: { x: -10, y: 500 }, data: { label: lbl("審査", "最短即日") },                  style: s.dur },

  { id: "dl",    position: { x: 210, y: 230 }, data: { label: lbl("申請書を", "ダウンロード・記入") },     style: s.proc },
  { id: "hanko", position: { x: 210, y: 320 }, data: { label: lbl("印鑑証明書を取得", "（3ヶ月以内）") }, style: s.proc },
  { id: "mail",  position: { x: 210, y: 410 }, data: { label: "書類を郵送" },                             style: s.proc },
  { id: "r_pa",  position: { x: 210, y: 500 }, data: { label: lbl("審査", "約1週間") },                  style: s.dur },

  { id: "prime", position: { x: 80,  y: 630 }, data: { label: "プライムアカウント発行" },                 style: s.end },
  { id: "jg",    type: "output", position: { x: 60, y: 720 }, data: { label: lbl("Jグランツで", "補助金申請可能") }, style: s.end },
]

const gbizEdges: Edge[] = [
  { id: "e0",  source: "start", target: "dec",   markerEnd, style: edgeStyle },
  { id: "e1",  source: "dec",   target: "app",   label: "はい",  markerEnd, style: edgeStyle },
  { id: "e2",  source: "dec",   target: "dl",    label: "いいえ", markerEnd, style: edgeStyle },
  { id: "e3",  source: "app",   target: "nfc",   markerEnd, style: edgeStyle },
  { id: "e4",  source: "nfc",   target: "form",  markerEnd, style: edgeStyle },
  { id: "e5",  source: "form",  target: "r_on",  markerEnd, style: edgeStyle },
  { id: "e6",  source: "dl",    target: "hanko", markerEnd, style: edgeStyle },
  { id: "e7",  source: "hanko", target: "mail",  markerEnd, style: edgeStyle },
  { id: "e8",  source: "mail",  target: "r_pa",  markerEnd, style: edgeStyle },
  { id: "e9",  source: "r_on",  target: "prime", markerEnd, style: edgeStyle },
  { id: "e10", source: "r_pa",  target: "prime", markerEnd, style: edgeStyle },
  { id: "e11", source: "prime", target: "jg",    markerEnd, style: edgeStyle },
]

// ── Digital AI steps flow ────────────────────────────────────────────────────
const stepStyle: React.CSSProperties = {
  ...base("#ffffff", "#b7d7cb", "#314640"),
  width: "110px",
}
const stepLbl = (n: string, t: string, sub?: string) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ background: "#38b48b", color: "#fff", borderRadius: "3px", fontSize: "10px", fontWeight: "bold", padding: "1px 5px", marginBottom: "3px", display: "inline-block" }}>{n}</div>
    <div style={{ fontSize: "12px" }}>{t}</div>
    {sub && <div style={{ fontSize: "10px", color: "#5f766d", marginTop: "1px" }}>{sub}</div>}
  </div>
)

const digitalNodes: Node[] = [
  { id: "s1",  position: { x: 0,   y: 0 },   data: { label: stepLbl("STEP 1", "公募要領確認") },                 style: stepStyle },
  { id: "s2",  position: { x: 150, y: 0 },   data: { label: stepLbl("STEP 2", "事前準備", "締切3〜4週前") },     style: stepStyle },
  { id: "s3",  position: { x: 300, y: 0 },   data: { label: stepLbl("STEP 3", "ITツール選定") },                 style: stepStyle },
  { id: "s4",  position: { x: 450, y: 0 },   data: { label: stepLbl("STEP 4", "共同で交付申請") },               style: stepStyle },
  { id: "dec", position: { x: 600, y: 0 },   data: { label: lbl("交付決定通知") },                              style: { ...base("#fff9e6", "#c9910a", "#7a5800", { fontWeight: "bold" }), width: "110px" } },
  { id: "s5",  position: { x: 600, y: 130 }, data: { label: stepLbl("STEP 5", "発注・契約・導入") },             style: stepStyle },
  { id: "s6",  type: "output", position: { x: 600, y: 260 }, data: { label: stepLbl("STEP 6", "実績報告", "補助金受取") }, style: { ...stepStyle, ...base("#edf7f2", "#38b48b", "#22322d"), width: "110px" } },
  { id: "end", type: "output", position: { x: 760, y: 130 }, data: { label: "終了（不採択）" },                  style: { ...base("#fef2f2", "#fca5a5", "#991b1b"), width: "110px" } },
]

const digitalEdges: Edge[] = [
  { id: "e1", source: "s1",  target: "s2",  markerEnd, style: edgeStyle },
  { id: "e2", source: "s2",  target: "s3",  markerEnd, style: edgeStyle },
  { id: "e3", source: "s3",  target: "s4",  markerEnd, style: edgeStyle },
  { id: "e4", source: "s4",  target: "dec", markerEnd, style: edgeStyle },
  { id: "e5", source: "dec", target: "s5",  label: "採択",  markerEnd, style: edgeStyle },
  { id: "e6", source: "dec", target: "end", label: "不採択", markerEnd, style: edgeStyle },
  { id: "e7", source: "s5",  target: "s6",  markerEnd, style: edgeStyle },
]

// ────────────────────────────────────────────────────────────────────────────

const DIAGRAMS: Record<string, { nodes: Node[]; edges: Edge[]; height: number }> = {
  "gbizid-flow":      { nodes: gbizNodes,   edges: gbizEdges,   height: 800 },
  "digital-ai-steps": { nodes: digitalNodes, edges: digitalEdges, height: 380 },
}

export function FlowDiagram({ id }: { id: string }) {
  const def = DIAGRAMS[id]
  if (!def) return null

  return (
    <div
      style={{
        height: def.height,
        margin: "1.75rem 0",
        border: "1px solid var(--border-soft)",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#fafffe",
      }}
    >
      <ReactFlow
        nodes={def.nodes}
        edges={def.edges}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#cfe5dc" gap={20} size={1} />
      </ReactFlow>
    </div>
  )
}
