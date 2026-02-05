/**
 * 円形ルーレット盤コンポーネント（SVG・回転演出）
 */
import { useMemo } from "react";
import type { Doll } from "../types/doll.js";

interface RouletteWheelProps {
  dolls: Doll[];
  rotation: number;
}

/** 色名をTailwind風の色に変換 */
function getColor(colorName: string): string {
  const map: Record<string, string> = {
    茶色: "#92400e",
    白: "#e5e7eb",
    ピンク: "#ec4899",
    グレー: "#6b7280",
    青: "#3b82f6",
    黄: "#fbbf24",
    黒: "#1f2937",
    その他: "#8b5cf6",
  };
  return map[colorName] ?? "#8b5cf6";
}

export default function RouletteWheel({ dolls, rotation }: RouletteWheelProps) {
  const segments = useMemo(() => {
    if (dolls.length === 0) return [];
    const anglePerSegment = 360 / dolls.length;
    return dolls.map((doll, i) => {
      const startAngle = i * anglePerSegment;
      const endAngle = (i + 1) * anglePerSegment;
      return { doll, startAngle, endAngle, color: getColor(doll.color) };
    });
  }, [dolls]);

  const radius = 150;
  const centerX = 200;
  const centerY = 200;

  /** 扇形のpathを生成 */
  function createSegmentPath(startAngle: number, endAngle: number): string {
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  /** 扇形の中心にテキストを配置する座標 */
  function getTextPosition(startAngle: number, endAngle: number) {
    const midAngle = (startAngle + endAngle) / 2;
    const midRad = ((midAngle - 90) * Math.PI) / 180;
    const textRadius = radius * 0.65;
    const x = centerX + textRadius * Math.cos(midRad);
    const y = centerY + textRadius * Math.sin(midRad);
    return { x, y, angle: midAngle };
  }

  return (
    <div className="relative flex items-center justify-center">
      <svg width="400" height="450" viewBox="0 0 400 450" className="max-w-full">
        {/* 針（上部中央固定） */}
        <g>
          <polygon
            points="200,40 190,70 210,70"
            fill="#ef4444"
            stroke="#991b1b"
            strokeWidth="2"
          />
          <circle cx="200" cy="40" r="8" fill="#ef4444" stroke="#991b1b" strokeWidth="2" />
        </g>

        {/* ルーレット盤（回転） */}
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: `${centerX}px ${centerY}px`,
            transition: "transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)",
          }}
        >
          {segments.map((seg, i) => {
            const path = createSegmentPath(seg.startAngle, seg.endAngle);
            const textPos = getTextPosition(seg.startAngle, seg.endAngle);
            return (
              <g key={seg.doll.id}>
                <path d={path} fill={seg.color} stroke="#fff" strokeWidth="2" />
                <text
                  x={textPos.x}
                  y={textPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize="14"
                  fontWeight="bold"
                  style={{ userSelect: "none" }}
                  transform={`rotate(${textPos.angle}, ${textPos.x}, ${textPos.y})`}
                >
                  {seg.doll.name}
                </text>
              </g>
            );
          })}
          {/* 中央の円 */}
          <circle cx={centerX} cy={centerY} r="30" fill="#fff" stroke="#d1d5db" strokeWidth="2" />
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#374151"
            fontSize="12"
            fontWeight="bold"
            style={{ userSelect: "none" }}
          >
            SPIN
          </text>
        </g>
      </svg>
    </div>
  );
}
