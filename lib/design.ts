import type { CSSProperties } from "react";

export const C = {
  yellow:      "#F5C100",
  yellowLight: "#FFFAE0",
  yellowBorder:"#F0BA00",
  bg:          "#FFFCF5",
  card:        "#FFFFFF",
  text:        "#1A1A1A",
  sub:         "#555555",
  muted:       "#9E9E9E",
  border:      "#EBE5D5",
  red:         "#DC2626",
  redBg:       "#FEF2F2",
  redBorder:   "#FECACA",
  green:       "#16A34A",
  greenBg:     "#F0FDF4",
  greenBorder: "#86EFAC",
} as const;

export const S = {
  page: (): CSSProperties => ({
    maxWidth: 660,
    margin: "0 auto",
    padding: "32px 20px 60px",
  }),

  card: (pad = 20): CSSProperties => ({
    background: C.card,
    border: `1.5px solid ${C.border}`,
    borderRadius: 16,
    padding: pad,
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  }),

  primaryBtn: (disabled = false): CSSProperties => ({
    flex: 1,
    width: "100%",
    padding: "14px 20px",
    borderRadius: 12,
    border: "none",
    background: disabled ? "#D4D4D4" : C.yellow,
    color: disabled ? "#FFFFFF" : C.text,
    fontSize: 15,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    textAlign: "center",
    letterSpacing: "0.2px",
  }),

  backBtn: (): CSSProperties => ({
    padding: "13px 18px",
    borderRadius: 12,
    border: `1.5px solid ${C.border}`,
    background: C.card,
    color: C.sub,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  }),

  input: (): CSSProperties => ({
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: `1.5px solid ${C.border}`,
    fontSize: 15,
    color: C.text,
    background: C.card,
    boxSizing: "border-box",
  }),

  select: (): CSSProperties => ({
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: `1.5px solid ${C.border}`,
    fontSize: 15,
    color: C.text,
    background: C.card,
    boxSizing: "border-box",
  }),

  label: (): CSSProperties => ({
    display: "block",
    fontWeight: 700,
    fontSize: 14,
    color: C.text,
    marginBottom: 8,
  }),

  errorBox: (): CSSProperties => ({
    background: C.redBg,
    border: `1px solid ${C.redBorder}`,
    borderRadius: 10,
    padding: "12px 16px",
    fontSize: 14,
    color: C.red,
    marginBottom: 16,
  }),

  successBox: (): CSSProperties => ({
    background: C.greenBg,
    border: `1px solid ${C.greenBorder}`,
    borderRadius: 10,
    padding: "12px 16px",
    fontSize: 14,
    color: C.green,
    marginBottom: 16,
  }),
};
