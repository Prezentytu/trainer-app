/* @ds-bundle: {"format":4,"namespace":"WorkoutAlchemistDesignSystem_5f0610","components":[{"name":"Badge","sourcePath":"components/display/Badge.jsx"},{"name":"Card","sourcePath":"components/display/Card.jsx"},{"name":"Icon","sourcePath":"components/display/Icon.jsx"},{"name":"StatBlock","sourcePath":"components/display/StatBlock.jsx"},{"name":"Tag","sourcePath":"components/display/Tag.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"ProgressRing","sourcePath":"components/feedback/ProgressRing.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"IconButton","sourcePath":"components/forms/IconButton.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"SegmentedControl","sourcePath":"components/navigation/SegmentedControl.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/display/Badge.jsx":"ff95d02a4721","components/display/Card.jsx":"82f8c75da80c","components/display/Icon.jsx":"fcd358d12a34","components/display/StatBlock.jsx":"22cb767a8c4b","components/display/Tag.jsx":"3d6c8143e17e","components/feedback/Dialog.jsx":"b6ae127bbe9f","components/feedback/ProgressRing.jsx":"7f191b16716a","components/feedback/Toast.jsx":"2e3835cddfea","components/feedback/Tooltip.jsx":"23410445c927","components/forms/Button.jsx":"2ac577d7ccae","components/forms/Checkbox.jsx":"d4db34e2d41f","components/forms/IconButton.jsx":"1f188425f514","components/forms/Input.jsx":"52ef3a793bbf","components/forms/Radio.jsx":"23d025a7b9c1","components/forms/Select.jsx":"09c34051fc23","components/forms/Switch.jsx":"9ab322110cb0","components/navigation/SegmentedControl.jsx":"3870b7f1e453","components/navigation/Tabs.jsx":"19acd6101355","ui_kits/client_app/ProgressScreen.jsx":"a45f24954aca","ui_kits/client_app/TodayScreen.jsx":"3972220551db","ui_kits/client_app/WorkoutScreen.jsx":"48d438c535bb","ui_kits/client_app/data.js":"971348c19243","ui_kits/trainer_studio/ClientDetailScreen.jsx":"53d6f27f08a6","ui_kits/trainer_studio/ClientsScreen.jsx":"1e97449434cc","ui_kits/trainer_studio/PlanBuilderScreen.jsx":"546f8fd25658","ui_kits/trainer_studio/Shell.jsx":"d30f834742dc","ui_kits/trainer_studio/data.js":"3964e7ae105d"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.WorkoutAlchemistDesignSystem_5f0610 = window.WorkoutAlchemistDesignSystem_5f0610 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/display/Badge.jsx
try { (() => {
const T = {
  pr: ["var(--pr-dim)", "var(--gold-300)"],
  gold: ["var(--pr-dim)", "var(--gold-300)"],
  accent: ["var(--accent-dim)", "var(--teal-300)"],
  positive: ["var(--positive-dim)", "var(--teal-300)"],
  danger: ["var(--danger-dim)", "var(--clay-400)"],
  neutral: ["var(--ink-700)", "var(--bone-300)"]
};
function Badge({
  tone = "neutral",
  icon,
  children,
  style
}) {
  const [bg, fg] = T[tone] || T.neutral;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      height: 22,
      padding: "0 9px",
      borderRadius: "var(--radius-pill)",
      background: bg,
      color: fg,
      font: "var(--type-label)",
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      ...style
    }
  }, icon, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
function Card({
  title,
  eyebrow,
  meta,
  interactive,
  selected,
  children,
  style,
  ...rest
}) {
  const [hov, setHov] = useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => setHov(true),
    onMouseLeave: () => setHov(false),
    style: {
      background: hov && interactive ? "var(--surface-hover)" : "var(--surface-card)",
      border: `1px solid ${selected ? "var(--accent)" : interactive && hov ? "var(--border-strong)" : "var(--border-subtle)"}`,
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-card)",
      padding: "var(--space-5)",
      cursor: interactive ? "pointer" : "default",
      transition: "background var(--dur-fast) var(--ease-out), border var(--dur-fast) var(--ease-out)",
      ...style
    }
  }, rest), eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-muted)",
      letterSpacing: "var(--tracking-caps)",
      textTransform: "uppercase",
      marginBottom: 6
    }
  }, eyebrow), title && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-h3)",
      color: "var(--text-primary)"
    }
  }, title), meta && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)",
      marginTop: 4
    }
  }, meta), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Card.jsx", error: String((e && e.message) || e) }); }

// components/display/Icon.jsx
try { (() => {
function Icon({
  name,
  size = 20,
  strokeWidth = 1.75,
  style
}) {
  const lib = typeof window !== "undefined" && window.lucide && window.lucide.icons;
  const pascal = String(name).split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join("");
  const node = lib && (lib[pascal] || lib[name]);
  if (!node) return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: style
  });
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      flex: "none",
      ...style
    }
  }, node.map(([tag, attrs], i) => React.createElement(tag, {
    key: i,
    ...attrs
  })));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Icon.jsx", error: String((e && e.message) || e) }); }

// components/display/StatBlock.jsx
try { (() => {
function StatBlock({
  label,
  value,
  unit,
  delta,
  size = "md",
  style
}) {
  const up = typeof delta === "string" && delta.trim().startsWith("+");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-muted)",
      letterSpacing: "var(--tracking-caps)",
      textTransform: "uppercase"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: size === "lg" ? "var(--type-stat-lg)" : "var(--type-stat)",
      color: "var(--text-primary)"
    }
  }, value), unit && /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-mono-sm)",
      color: "var(--text-muted)"
    }
  }, unit)), delta && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-mono-sm)",
      color: up ? "var(--positive)" : "var(--text-muted)"
    }
  }, delta));
}
Object.assign(__ds_scope, { StatBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/StatBlock.jsx", error: String((e && e.message) || e) }); }

// components/display/Tag.jsx
try { (() => {
function Tag({
  onRemove,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 28,
      padding: "0 10px",
      borderRadius: "var(--radius-pill)",
      background: "var(--bg-raised)",
      border: "1px solid var(--border-strong)",
      color: "var(--text-secondary)",
      font: "var(--type-caption)",
      ...style
    }
  }, children, onRemove && /*#__PURE__*/React.createElement("button", {
    onClick: onRemove,
    "aria-label": "Remove",
    style: {
      all: "unset",
      cursor: "pointer",
      color: "var(--text-faint)",
      lineHeight: 1,
      padding: 2
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ProgressRing.jsx
try { (() => {
function ProgressRing({
  value = 0,
  size = 64,
  stroke = 5,
  color = "var(--accent)",
  label,
  sub,
  style
}) {
  const r = (size - stroke) / 2,
    c = 2 * Math.PI * r,
    v = Math.max(0, Math.min(1, value));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: size,
      height: size,
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: {
      transform: "rotate(-90deg)"
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "var(--ink-700)",
    strokeWidth: stroke
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeDasharray: c,
    strokeDashoffset: c * (1 - v),
    style: {
      transition: "stroke-dashoffset var(--dur-med) var(--ease-out)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-stat)",
      fontSize: size / 4.2,
      color: "var(--text-primary)"
    }
  }, label), sub && /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-label)",
      fontSize: Math.max(9, size / 7.5),
      color: "var(--text-muted)",
      textTransform: "uppercase",
      letterSpacing: "0.05em"
    }
  }, sub)));
}
Object.assign(__ds_scope, { ProgressRing });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ProgressRing.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const T = {
  neutral: "var(--bone-300)",
  positive: "var(--teal-300)",
  danger: "var(--clay-400)",
  pr: "var(--pr)",
  gold: "var(--pr)"
};
function Toast({
  tone = "neutral",
  icon,
  action,
  onAction,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "12px 16px",
      background: "var(--ink-800)",
      border: "1px solid var(--border-strong)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-raised)",
      font: "var(--type-body)",
      color: "var(--text-primary)",
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: T[tone],
      display: "flex"
    }
  }, icon), /*#__PURE__*/React.createElement("span", null, children), action && /*#__PURE__*/React.createElement("button", {
    onClick: onAction,
    style: {
      all: "unset",
      cursor: "pointer",
      font: "var(--type-body-strong)",
      fontSize: "var(--text-sm)",
      color: "var(--teal-300)",
      marginLeft: 6
    }
  }, action));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
const {
  useState
} = React;
function Tooltip({
  label,
  side = "top",
  children
}) {
  const [on, setOn] = useState(false);
  const pos = side === "bottom" ? {
    top: "calc(100% + 8px)"
  } : {
    bottom: "calc(100% + 8px)"
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "inline-flex"
    },
    onMouseEnter: () => setOn(true),
    onMouseLeave: () => setOn(false),
    onFocus: () => setOn(true),
    onBlur: () => setOn(false)
  }, children, on && /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
      ...pos,
      whiteSpace: "nowrap",
      background: "var(--ink-700)",
      border: "1px solid var(--border-strong)",
      color: "var(--text-primary)",
      font: "var(--type-caption)",
      padding: "5px 9px",
      borderRadius: "var(--radius-sm)",
      boxShadow: "var(--shadow-raised)",
      zIndex: 50,
      pointerEvents: "none"
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
const SIZES = {
  sm: ["--control-h-sm", "0 14px", "var(--text-sm)"],
  md: ["--control-h-md", "0 20px", "var(--text-base)"],
  lg: ["--control-h-lg", "0 26px", "var(--text-md)"]
};
const V = {
  primary: {
    bg: "var(--accent)",
    hov: "var(--accent-hover)",
    act: "var(--accent-press)",
    fg: "var(--text-on-accent)",
    bd: "none"
  },
  secondary: {
    bg: "var(--surface-card)",
    hov: "var(--surface-hover)",
    act: "var(--surface-active)",
    fg: "var(--text-primary)",
    bd: "1px solid var(--border-strong)"
  },
  ghost: {
    bg: "transparent",
    hov: "var(--surface-hover)",
    act: "var(--surface-active)",
    fg: "var(--text-secondary)",
    bd: "none"
  },
  danger: {
    bg: "var(--clay-400)",
    hov: "var(--clay-400)",
    act: "var(--clay-500)",
    fg: "var(--ink-950)",
    bd: "none"
  }
};
function Button({
  variant = "primary",
  size = "md",
  icon,
  disabled,
  full,
  children,
  style,
  ...rest
}) {
  const [hov, setHov] = useState(false);
  const [act, setAct] = useState(false);
  const v = V[variant] || V.primary;
  const [h, pad, fs] = SIZES[size] || SIZES.md;
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled,
    onMouseEnter: () => setHov(true),
    onMouseLeave: () => {
      setHov(false);
      setAct(false);
    },
    onMouseDown: () => setAct(true),
    onMouseUp: () => setAct(false),
    style: {
      height: `var(${h})`,
      padding: pad,
      borderRadius: "var(--radius-md)",
      border: v.bd,
      cursor: disabled ? "default" : "pointer",
      background: disabled ? v.bg : act ? v.act : hov ? v.hov : v.bg,
      color: v.fg,
      font: `600 ${fs}/1 var(--font-body)`,
      display: full ? "flex" : "inline-flex",
      width: full ? "100%" : undefined,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      opacity: disabled ? 0.4 : 1,
      transform: act ? "scale(0.98)" : "none",
      transition: "background var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)",
      ...style
    }
  }, rest), icon, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function Dialog({
  open = true,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger,
  onConfirm,
  onCancel,
  children,
  style
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onCancel,
    style: {
      position: "fixed",
      inset: 0,
      background: "var(--overlay-scrim)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation(),
    style: {
      width: 400,
      maxWidth: "calc(100vw - 40px)",
      background: "var(--bg-raised)",
      border: "1px solid var(--border-strong)",
      borderRadius: "var(--radius-xl)",
      boxShadow: "var(--shadow-modal)",
      padding: "var(--space-6)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-h3)",
      color: "var(--text-primary)"
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-body)",
      color: "var(--text-secondary)",
      marginTop: 8
    }
  }, description), children, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 10,
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "ghost",
    onClick: onCancel
  }, cancelLabel), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: danger ? "danger" : "primary",
    onClick: onConfirm
  }, confirmLabel))));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  label,
  checked,
  onChange,
  disabled,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.4 : 1,
      font: "var(--type-body)",
      color: "var(--text-primary)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      width: 20,
      height: 20,
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: "absolute",
      inset: 0,
      opacity: 0,
      cursor: "inherit",
      margin: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: "var(--radius-sm)",
      background: checked ? "var(--accent)" : "var(--bg-raised)",
      border: checked ? "1px solid var(--accent)" : "1px solid var(--border-strong)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background var(--dur-fast) var(--ease-out)"
    }
  }, checked && /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--text-on-accent)",
    strokeWidth: "3.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 6 9 17l-5-5"
  })))), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
function IconButton({
  label,
  size = "md",
  variant = "ghost",
  active,
  disabled,
  children,
  style,
  ...rest
}) {
  const [hov, setHov] = useState(false);
  const d = size === "sm" ? 32 : size === "lg" ? 48 : 40;
  const bg = active ? "var(--accent-dim)" : hov && !disabled ? "var(--surface-hover)" : variant === "outline" ? "var(--surface-card)" : "transparent";
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    title: label,
    disabled: disabled,
    onMouseEnter: () => setHov(true),
    onMouseLeave: () => setHov(false),
    style: {
      width: d,
      height: d,
      borderRadius: "var(--radius-md)",
      border: variant === "outline" ? "1px solid var(--border-strong)" : "none",
      background: bg,
      color: active ? "var(--accent)" : "var(--text-secondary)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.4 : 1,
      transition: "background var(--dur-fast) var(--ease-out)",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
function Input({
  label,
  hint,
  error,
  prefix,
  suffix,
  mono,
  size = "md",
  style,
  ...rest
}) {
  const [foc, setFoc] = useState(false);
  const h = size === "sm" ? "var(--control-h-sm)" : "var(--control-h-md)";
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      font: "var(--type-label)",
      color: "var(--text-muted)",
      letterSpacing: "var(--tracking-caps)",
      textTransform: "uppercase",
      ...style
    }
  }, label, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: h,
      padding: "0 12px",
      borderRadius: "var(--radius-md)",
      background: "var(--bg-raised)",
      border: `1px solid ${error ? "var(--danger)" : foc ? "var(--border-focus)" : "var(--border-strong)"}`,
      boxShadow: foc ? "var(--glow-accent)" : "none",
      transition: "box-shadow var(--dur-fast) var(--ease-out)"
    }
  }, prefix && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-faint)",
      font: "var(--type-caption)",
      textTransform: "none",
      letterSpacing: 0
    }
  }, prefix), /*#__PURE__*/React.createElement("input", _extends({
    onFocus: () => setFoc(true),
    onBlur: () => setFoc(false),
    style: {
      flex: 1,
      minWidth: 0,
      background: "none",
      border: "none",
      outline: "none",
      color: "var(--text-primary)",
      font: mono ? "var(--type-mono-sm)" : "var(--type-body)",
      letterSpacing: 0,
      textTransform: "none"
    }
  }, rest)), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-faint)",
      font: "var(--type-caption)",
      textTransform: "none",
      letterSpacing: 0
    }
  }, suffix)), (error || hint) && /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: error ? "var(--danger)" : "var(--text-faint)",
      textTransform: "none",
      letterSpacing: 0
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function Radio({
  label,
  checked,
  onChange,
  name,
  value,
  disabled,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.4 : 1,
      font: "var(--type-body)",
      color: "var(--text-primary)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      width: 20,
      height: 20,
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: name,
    value: value,
    checked: checked,
    disabled: disabled,
    onChange: () => onChange && onChange(value),
    style: {
      position: "absolute",
      inset: 0,
      opacity: 0,
      cursor: "inherit",
      margin: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: "50%",
      background: "var(--bg-raised)",
      border: checked ? "6px solid var(--accent)" : "1px solid var(--border-strong)",
      boxSizing: "border-box",
      transition: "border var(--dur-fast) var(--ease-out)"
    }
  })), label);
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
function Select({
  label,
  options = [],
  size = "md",
  style,
  ...rest
}) {
  const [foc, setFoc] = useState(false);
  const h = size === "sm" ? "var(--control-h-sm)" : "var(--control-h-md)";
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      font: "var(--type-label)",
      color: "var(--text-muted)",
      letterSpacing: "var(--tracking-caps)",
      textTransform: "uppercase",
      ...style
    }
  }, label, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "flex"
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    onFocus: () => setFoc(true),
    onBlur: () => setFoc(false),
    style: {
      appearance: "none",
      width: "100%",
      height: h,
      padding: "0 36px 0 12px",
      borderRadius: "var(--radius-md)",
      background: "var(--bg-raised)",
      border: `1px solid ${foc ? "var(--border-focus)" : "var(--border-strong)"}`,
      boxShadow: foc ? "var(--glow-accent)" : "none",
      color: "var(--text-primary)",
      font: "var(--type-body)",
      letterSpacing: 0,
      textTransform: "none",
      cursor: "pointer"
    }
  }, rest), options.map(o => {
    const v = typeof o === "string" ? {
      value: o,
      label: o
    } : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v.value,
      value: v.value
    }, v.label);
  })), /*#__PURE__*/React.createElement("svg", {
    style: {
      position: "absolute",
      right: 12,
      top: "50%",
      marginTop: -8,
      pointerEvents: "none",
      color: "var(--text-muted)"
    },
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6 6 6-6"
  }))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  label,
  checked,
  onChange,
  disabled,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.4 : 1,
      font: "var(--type-body)",
      color: "var(--text-primary)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      width: 40,
      height: 24,
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    role: "switch",
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: "absolute",
      inset: 0,
      opacity: 0,
      cursor: "inherit",
      margin: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: "var(--radius-pill)",
      background: checked ? "var(--accent)" : "var(--ink-700)",
      border: "1px solid " + (checked ? "var(--accent)" : "var(--border-strong)"),
      transition: "background var(--dur-med) var(--ease-out)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 3,
      left: checked ? 19 : 3,
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: checked ? "var(--ink-950)" : "var(--bone-300)",
      transition: "left var(--dur-med) var(--ease-out)"
    }
  })), label);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SegmentedControl.jsx
try { (() => {
function SegmentedControl({
  items = [],
  value,
  onChange,
  full,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: full ? "flex" : "inline-flex",
      background: "var(--bg-raised)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      padding: 3,
      gap: 2,
      ...style
    }
  }, items.map(it => {
    const t = typeof it === "string" ? {
      value: it,
      label: it
    } : it;
    const on = t.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: t.value,
      onClick: () => onChange && onChange(t.value),
      style: {
        all: "unset",
        cursor: "pointer",
        flex: full ? 1 : "none",
        textAlign: "center",
        padding: "7px 14px",
        borderRadius: "calc(var(--radius-md) - 3px)",
        font: "var(--type-body-strong)",
        fontSize: "var(--text-sm)",
        color: on ? "var(--text-primary)" : "var(--text-muted)",
        background: on ? "var(--surface-active)" : "transparent",
        boxShadow: on ? "inset 0 1px 0 rgba(243,241,236,0.05)" : "none",
        transition: "background var(--dur-fast) var(--ease-out)"
      }
    }, t.label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  items = [],
  value,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: "flex",
      gap: 4,
      borderBottom: "1px solid var(--border-subtle)",
      ...style
    }
  }, items.map(it => {
    const t = typeof it === "string" ? {
      value: it,
      label: it
    } : it;
    const on = t.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: t.value,
      role: "tab",
      "aria-selected": on,
      onClick: () => onChange && onChange(t.value),
      style: {
        all: "unset",
        cursor: "pointer",
        padding: "10px 14px",
        font: "var(--type-body-strong)",
        fontSize: "var(--text-sm)",
        color: on ? "var(--text-primary)" : "var(--text-muted)",
        borderBottom: on ? "2px solid var(--accent)" : "2px solid transparent",
        marginBottom: -1,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        transition: "color var(--dur-fast) var(--ease-out)"
      }
    }, t.label, t.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--type-mono-sm)",
        color: "var(--text-faint)"
      }
    }, t.count));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/client_app/ProgressScreen.jsx
try { (() => {
function ProgressScreen() {
  const {
    Card,
    StatBlock,
    Badge,
    Icon,
    SegmentedControl
  } = window.WorkoutAlchemistDesignSystem_5f0610;
  const [range, setRange] = React.useState("Month");
  const bars = [42, 55, 48, 61, 58, 70, 66, 74];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 20px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: "var(--type-h2)",
      margin: 0,
      flex: 1
    }
  }, "Progress"), /*#__PURE__*/React.createElement(SegmentedControl, {
    items: ["Week", "Month", "Year"],
    value: range,
    onChange: setRange
  })), /*#__PURE__*/React.createElement(Card, {
    eyebrow: "Bench press \xB7 top set",
    title: ""
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-stat-lg)",
      color: "var(--pr)"
    }
  }, "62.5"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-mono-sm)",
      color: "var(--text-muted)"
    }
  }, "kg"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-mono-sm)",
      color: "var(--positive)",
      marginLeft: "auto"
    }
  }, "+12% this ", range.toLowerCase())), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 6,
      height: 72,
      marginTop: 16
    }
  }, bars.map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      height: h + "%",
      borderRadius: "4px 4px 0 0",
      background: i === bars.length - 1 ? "var(--pr)" : "var(--ink-700)"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(Card, {
    style: {
      flex: 1,
      padding: 16
    }
  }, /*#__PURE__*/React.createElement(StatBlock, {
    label: "Volume",
    value: "48.2k",
    unit: "kg",
    delta: "+8%"
  })), /*#__PURE__*/React.createElement(Card, {
    style: {
      flex: 1,
      padding: 16
    }
  }, /*#__PURE__*/React.createElement(StatBlock, {
    label: "Sessions",
    value: "14",
    delta: "+2"
  })), /*#__PURE__*/React.createElement(Card, {
    style: {
      flex: 1,
      padding: 16
    }
  }, /*#__PURE__*/React.createElement(StatBlock, {
    label: "PRs",
    value: "3"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-muted)",
      letterSpacing: "var(--tracking-caps)",
      textTransform: "uppercase",
      margin: "20px 0 10px"
    }
  }, "History"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, window.WAAppData.history.map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 14px",
      background: "var(--surface-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-faint)",
      width: 30
    }
  }, h.d), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-body-strong)",
      fontSize: "var(--text-sm)",
      flex: 1
    }
  }, h.t), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-mono-sm)",
      fontSize: "var(--text-xs)",
      color: "var(--text-muted)"
    }
  }, h.m), h.pr && /*#__PURE__*/React.createElement(Badge, {
    tone: "pr"
  }, "PR"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 14,
    style: {
      color: "var(--text-faint)"
    }
  })))));
}
window.WAProgressScreen = ProgressScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/client_app/ProgressScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/client_app/TodayScreen.jsx
try { (() => {
function TodayScreen({
  onStart
}) {
  const {
    Button,
    Badge,
    Card,
    Icon,
    ProgressRing
  } = window.WorkoutAlchemistDesignSystem_5f0610;
  const w = window.WAAppData.workout;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 20px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-muted)",
      letterSpacing: "var(--tracking-caps)",
      textTransform: "uppercase"
    }
  }, "Thursday \xB7 Week ", w.week), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: "var(--type-h2)",
      margin: "4px 0 0"
    }
  }, "Today")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement(ProgressRing, {
    value: 2 / 3,
    label: "2/3",
    sub: "week",
    size: 56,
    stroke: 4
  }))), /*#__PURE__*/React.createElement(Card, {
    eyebrow: "Day " + w.dayNum + " · from Coach Kasia",
    title: w.label,
    meta: w.ex.length + " exercises · ~" + w.mins + " min"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 0,
      margin: "14px 0 18px"
    }
  }, w.ex.map((x, i) => /*#__PURE__*/React.createElement("div", {
    key: x.name,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "11px 0",
      borderBottom: i < w.ex.length - 1 ? "1px solid var(--border-subtle)" : "none"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "dumbbell",
    size: 18,
    style: {
      color: "var(--text-faint)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-body-strong)",
      fontSize: "var(--text-sm)",
      flex: 1
    }
  }, x.name), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-mono-sm)",
      fontSize: "var(--text-xs)",
      color: "var(--text-muted)"
    }
  }, x.target)))), /*#__PURE__*/React.createElement(Button, {
    full: true,
    size: "lg",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "play",
      size: 20
    }),
    onClick: onStart
  }, "Start workout")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Card, {
    style: {
      flex: 1,
      padding: 16
    },
    eyebrow: "Streak",
    title: "9 sessions",
    meta: "Keep the chain going"
  }), /*#__PURE__*/React.createElement(Card, {
    style: {
      flex: 1,
      padding: 16
    },
    eyebrow: "Last gold",
    title: "62.5 kg bench"
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "pr",
    style: {
      marginTop: 8
    }
  }, "PR"))));
}
window.WATodayScreen = TodayScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/client_app/TodayScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/client_app/WorkoutScreen.jsx
try { (() => {
function WorkoutScreen({
  onFinish
}) {
  const {
    Button,
    Icon,
    ProgressRing,
    Badge
  } = window.WorkoutAlchemistDesignSystem_5f0610;
  const w = window.WAAppData.workout;
  const [exi, setExi] = React.useState(0);
  const [done, setDone] = React.useState(w.ex.map(x => x.sets.map(() => false)));
  const [rest, setRest] = React.useState(0);
  React.useEffect(() => {
    if (rest <= 0) return;
    const t = setTimeout(() => setRest(rest - 1), 1000);
    return () => clearTimeout(t);
  }, [rest]);
  const x = w.ex[exi];
  const total = w.ex.reduce((a, e) => a + e.sets.length, 0);
  const nDone = done.flat().filter(Boolean).length;
  const toggle = si => {
    const was = done[exi][si];
    setDone(done.map((d, i) => i === exi ? d.map((v, j) => j === si ? !v : v) : d));
    if (!was) setRest(x.rest);
  };
  const fmt = s => String(Math.floor(s / 60)) + ":" + String(s % 60).padStart(2, "0");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      minHeight: "100%"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "14px 20px",
      borderBottom: "1px solid var(--border-subtle)",
      position: "sticky",
      top: 0,
      background: "rgba(11,12,10,0.8)",
      backdropFilter: "blur(12px)",
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onFinish,
    style: {
      all: "unset",
      cursor: "pointer",
      color: "var(--text-muted)",
      display: "flex"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 22
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-body-strong)",
      fontSize: "var(--text-sm)"
    }
  }, w.label), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-mono-sm)",
      fontSize: "var(--text-xs)",
      color: "var(--text-faint)"
    }
  }, nDone, "/", total, " sets")), rest > 0 ? /*#__PURE__*/React.createElement(ProgressRing, {
    value: rest / x.rest,
    color: "var(--teal-300)",
    label: fmt(rest),
    size: 46,
    stroke: 4
  }) : /*#__PURE__*/React.createElement(Badge, {
    tone: "positive"
  }, "Live")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "18px 20px",
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-muted)",
      letterSpacing: "var(--tracking-caps)",
      textTransform: "uppercase"
    }
  }, "Exercise ", exi + 1, " of ", w.ex.length), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: "var(--type-h2)",
      margin: "4px 0 2px"
    }
  }, x.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-mono-sm)",
      color: "var(--accent)",
      marginBottom: 16
    }
  }, x.target, " \xB7 rest ", fmt(x.rest)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, x.sets.map((s, si) => {
    const on = done[exi][si];
    return /*#__PURE__*/React.createElement("button", {
      key: si,
      onClick: () => toggle(si),
      style: {
        all: "unset",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 14,
        minHeight: 44,
        padding: "10px 14px",
        borderRadius: "var(--radius-md)",
        background: on ? "var(--positive-dim)" : "var(--surface-card)",
        border: "1px solid " + (on ? "var(--teal-700)" : "var(--border-subtle)"),
        transition: "background var(--dur-fast) var(--ease-out)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--type-label)",
        color: "var(--text-faint)",
        letterSpacing: "var(--tracking-caps)",
        width: 40
      }
    }, "SET ", si + 1), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--type-stat)",
        fontSize: 20
      }
    }, s.w, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--type-mono-sm)",
        color: "var(--text-muted)"
      }
    }, " kg")), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--type-stat)",
        fontSize: 20
      }
    }, s.r, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--type-mono-sm)",
        color: "var(--text-muted)"
      }
    }, " reps")), /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: "auto",
        width: 26,
        height: 26,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: on ? "var(--teal-300)" : "var(--ink-700)",
        color: on ? "var(--ink-950)" : "var(--text-faint)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 16
    })));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      padding: "14px 20px 24px",
      position: "sticky",
      bottom: 0,
      background: "rgba(11,12,10,0.8)",
      backdropFilter: "blur(12px)",
      borderTop: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    full: true,
    disabled: exi === 0,
    onClick: () => setExi(exi - 1),
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-left",
      size: 18
    })
  }, "Back"), exi < w.ex.length - 1 ? /*#__PURE__*/React.createElement(Button, {
    full: true,
    onClick: () => setExi(exi + 1),
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 18
    })
  }, "Next exercise") : /*#__PURE__*/React.createElement(Button, {
    full: true,
    onClick: onFinish,
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 18
    })
  }, "Finish workout")));
}
window.WAWorkoutScreen = WorkoutScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/client_app/WorkoutScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/client_app/data.js
try { (() => {
window.WAAppData = {
  workout: {
    label: "Push day",
    week: 3,
    dayNum: 1,
    mins: 55,
    ex: [{
      name: "Bench press",
      target: "4 × 6 @ 62.5 kg",
      rest: 150,
      sets: [{
        w: "62.5",
        r: "6"
      }, {
        w: "62.5",
        r: "6"
      }, {
        w: "62.5",
        r: "6"
      }, {
        w: "62.5",
        r: "6"
      }]
    }, {
      name: "Overhead press",
      target: "3 × 8 @ 40 kg",
      rest: 120,
      sets: [{
        w: "40",
        r: "8"
      }, {
        w: "40",
        r: "8"
      }, {
        w: "40",
        r: "8"
      }]
    }, {
      name: "Incline DB press",
      target: "3 × 10 @ 24 kg",
      rest: 90,
      sets: [{
        w: "24",
        r: "10"
      }, {
        w: "24",
        r: "10"
      }, {
        w: "24",
        r: "10"
      }]
    }, {
      name: "Lateral raise",
      target: "3 × 15 @ 8 kg",
      rest: 60,
      sets: [{
        w: "8",
        r: "15"
      }, {
        w: "8",
        r: "15"
      }, {
        w: "8",
        r: "15"
      }]
    }]
  },
  history: [{
    d: "Tue",
    t: "Pull day",
    m: "52 min · 8 420 kg",
    pr: false
  }, {
    d: "Mon",
    t: "Push day",
    m: "58 min · 7 180 kg · PR",
    pr: true
  }, {
    d: "Sat",
    t: "Leg day",
    m: "61 min · 11 240 kg",
    pr: false
  }, {
    d: "Thu",
    t: "Pull day",
    m: "49 min · 8 105 kg",
    pr: false
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/client_app/data.js", error: String((e && e.message) || e) }); }

// ui_kits/trainer_studio/ClientDetailScreen.jsx
try { (() => {
function ClientDetailScreen({
  client,
  onBack,
  onEditPlan
}) {
  const {
    Button,
    Badge,
    Card,
    StatBlock,
    Icon,
    ProgressRing
  } = window.WorkoutAlchemistDesignSystem_5f0610;
  const plan = window.WAData.plan;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "28px 32px",
      maxWidth: 1080
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      all: "unset",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 6,
      font: "var(--type-caption)",
      color: "var(--text-muted)",
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 16
  }), " Clients"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: "50%",
      background: "var(--ink-700)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      font: "var(--type-body-strong)",
      color: "var(--bone-300)"
    }
  }, client.initials), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: "var(--type-h2)",
      margin: 0
    }
  }, client.name), /*#__PURE__*/React.createElement(Badge, {
    tone: client.tone
  }, client.status)), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)",
      marginTop: 2
    }
  }, client.plan, " \xB7 week 3 of ", plan.weeks)), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "message-circle",
      size: 18
    })
  }, "Message"), /*#__PURE__*/React.createElement(Button, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "flask-conical",
      size: 18
    }),
    onClick: onEditPlan
  }, "Edit plan")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr",
      gap: 14,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatBlock, {
    label: "Adherence",
    value: Math.round(client.adherence * 100) + "%",
    delta: "+4% vs last month"
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatBlock, {
    label: "Sessions this week",
    value: "2/3"
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatBlock, {
    label: "Bench top set",
    value: "62.5",
    unit: "kg",
    delta: "+2.5 vs last week"
  })), /*#__PURE__*/React.createElement(Card, {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(ProgressRing, {
    value: 0.68,
    label: "68%",
    sub: "plan",
    size: 72
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, "Week 3 of 6", /*#__PURE__*/React.createElement("br", null), "on schedule"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.4fr 1fr",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, {
    eyebrow: "Current plan",
    title: plan.name,
    meta: plan.days.length + " days / week · " + plan.weeks + " weeks"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 14
    }
  }, plan.days.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: d.label,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 12px",
      background: "var(--bg-raised)",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-faint)",
      letterSpacing: "var(--tracking-caps)",
      width: 44
    }
  }, "DAY ", i + 1), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-body-strong)",
      flex: 1
    }
  }, d.label), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-mono-sm)",
      color: "var(--text-muted)"
    }
  }, d.ex.length, " exercises"))))), /*#__PURE__*/React.createElement(Card, {
    eyebrow: "Recent activity",
    title: "Last 7 days"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      marginTop: 10
    }
  }, [["check", "Completed Pull day", "Yesterday · 52 min", "var(--positive)"], ["flame", "PR — bench press 62.5 kg", "Tuesday", "var(--pr)"], ["check", "Completed Push day", "Tuesday · 58 min", "var(--positive)"], ["x", "Skipped Leg day", "Sunday", "var(--danger)"]].map(([ic, t, m, col], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
      padding: "10px 0",
      borderBottom: i < 3 ? "1px solid var(--border-subtle)" : "none"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 18,
    style: {
      color: col,
      marginTop: 2
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-body)",
      fontSize: "var(--text-sm)"
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-caption)",
      fontSize: "var(--text-xs)",
      color: "var(--text-faint)"
    }
  }, m))))))));
}
window.WAClientDetailScreen = ClientDetailScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/trainer_studio/ClientDetailScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/trainer_studio/ClientsScreen.jsx
try { (() => {
function ClientsScreen({
  onOpen
}) {
  const {
    Button,
    Input,
    Tabs,
    Badge,
    Icon
  } = window.WorkoutAlchemistDesignSystem_5f0610;
  const [tab, setTab] = React.useState("active");
  const [q, setQ] = React.useState("");
  const rows = window.WAData.clients.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "28px 32px",
      maxWidth: 1080
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: "var(--type-h1)",
      margin: 0,
      flex: 1
    }
  }, "Clients"), /*#__PURE__*/React.createElement(Input, {
    placeholder: "Search clients",
    value: q,
    onChange: e => setQ(e.target.value),
    style: {
      width: 220
    }
  }), /*#__PURE__*/React.createElement(Button, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 18
    })
  }, "Invite client")), /*#__PURE__*/React.createElement(Tabs, {
    items: [{
      value: "active",
      label: "Active",
      count: 5
    }, {
      value: "pending",
      label: "Pending",
      count: 2
    }, {
      value: "archived",
      label: "Archived"
    }],
    value: tab,
    onChange: setTab,
    style: {
      marginBottom: 8
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(220px,1.4fr) 1.2fr 100px 1fr 1fr 90px 24px",
      gap: 16,
      padding: "10px 16px",
      font: "var(--type-label)",
      color: "var(--text-faint)",
      letterSpacing: "var(--tracking-caps)",
      textTransform: "uppercase"
    }
  }, /*#__PURE__*/React.createElement("span", null, "Client"), /*#__PURE__*/React.createElement("span", null, "Plan"), /*#__PURE__*/React.createElement("span", null, "Adherence"), /*#__PURE__*/React.createElement("span", null, "Last session"), /*#__PURE__*/React.createElement("span", null, "Next up"), /*#__PURE__*/React.createElement("span", null, "Status"), /*#__PURE__*/React.createElement("span", null)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, rows.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    onClick: () => onOpen(c),
    className: "wa-row",
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(220px,1.4fr) 1.2fr 100px 1fr 1fr 90px 24px",
      gap: 16,
      alignItems: "center",
      padding: "12px 16px",
      background: "var(--surface-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-card)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: "50%",
      background: "var(--ink-700)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      font: "var(--type-label)",
      color: "var(--bone-300)",
      flex: "none"
    }
  }, c.initials), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-body-strong)"
    }
  }, c.name)), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: c.plan.startsWith("No") ? "var(--text-faint)" : "var(--text-secondary)"
    }
  }, c.plan), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-mono-sm)",
      color: c.adherence >= 0.85 ? "var(--positive)" : c.adherence >= 0.6 ? "var(--text-secondary)" : c.adherence > 0 ? "var(--danger)" : "var(--text-faint)"
    }
  }, c.adherence ? Math.round(c.adherence * 100) + "%" : "—"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, c.last), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: c.next === "Overdue" ? "var(--danger)" : "var(--text-secondary)"
    }
  }, c.next), /*#__PURE__*/React.createElement(Badge, {
    tone: c.tone
  }, c.status), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 16,
    style: {
      color: "var(--text-faint)"
    }
  })))));
}
window.WAClientsScreen = ClientsScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/trainer_studio/ClientsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/trainer_studio/PlanBuilderScreen.jsx
try { (() => {
function PlanBuilderScreen({
  client,
  onBack
}) {
  const {
    Button,
    Input,
    Select,
    Tag,
    Icon,
    Dialog,
    Toast,
    IconButton
  } = window.WorkoutAlchemistDesignSystem_5f0610;
  const [days, setDays] = React.useState(() => JSON.parse(JSON.stringify(window.WAData.plan.days)));
  const [sel, setSel] = React.useState(0);
  const [q, setQ] = React.useState("");
  const [dlg, setDlg] = React.useState(false);
  const [toast, setToast] = React.useState(false);
  const lib = window.WAData.library.filter(e => e.name.toLowerCase().includes(q.toLowerCase()));
  const add = e => setDays(days.map((d, i) => i === sel ? {
    ...d,
    ex: [...d.ex, {
      name: e.name,
      sets: "3 × 10",
      load: "— kg",
      rest: "90s"
    }]
  } : d));
  const remove = (di, xi) => setDays(days.map((d, i) => i === di ? {
    ...d,
    ex: d.ex.filter((_, j) => j !== xi)
  } : d));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      height: "100%",
      minHeight: "100vh"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: "28px 32px",
      overflow: "auto"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      all: "unset",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 6,
      font: "var(--type-caption)",
      color: "var(--text-muted)",
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 16
  }), " ", client.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 14,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Plan name",
    defaultValue: window.WAData.plan.name,
    style: {
      width: 240
    }
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Weeks",
    options: ["4", "6", "8", "12"],
    defaultValue: "6",
    style: {
      width: 90
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "flask-conical",
      size: 18
    })
  }, "Save as formula"), /*#__PURE__*/React.createElement(Button, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "send",
      size: 18
    }),
    onClick: () => setDlg(true)
  }, "Assign to ", client.name.split(" ")[0])), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 14,
      alignItems: "start"
    }
  }, days.map((d, di) => /*#__PURE__*/React.createElement("div", {
    key: d.label,
    onClick: () => setSel(di),
    style: {
      background: "var(--surface-card)",
      border: "1px solid " + (sel === di ? "var(--accent)" : "var(--border-subtle)"),
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-card)",
      padding: 14,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      marginBottom: 12,
      padding: "0 4px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-faint)",
      letterSpacing: "var(--tracking-caps)"
    }
  }, "DAY ", di + 1), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-h3)"
    }
  }, d.label), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-mono-sm)",
      color: "var(--text-faint)",
      marginLeft: "auto"
    }
  }, d.ex.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, d.ex.map((x, xi) => /*#__PURE__*/React.createElement("div", {
    key: xi,
    style: {
      background: "var(--bg-raised)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      padding: "10px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "grip-vertical",
    size: 14,
    style: {
      color: "var(--text-faint)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-body-strong)",
      fontSize: "var(--text-sm)",
      flex: 1
    }
  }, x.name), /*#__PURE__*/React.createElement(IconButton, {
    label: "Remove",
    size: "sm",
    onClick: ev => {
      ev.stopPropagation();
      remove(di, xi);
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 14
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      font: "var(--type-mono-sm)",
      fontSize: "var(--text-xs)",
      color: "var(--text-muted)",
      marginTop: 4,
      paddingLeft: 22
    }
  }, /*#__PURE__*/React.createElement("span", null, x.sets), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--accent)"
    }
  }, x.load), /*#__PURE__*/React.createElement("span", null, "rest ", x.rest)))), /*#__PURE__*/React.createElement("button", {
    style: {
      all: "unset",
      cursor: "pointer",
      textAlign: "center",
      padding: "9px 0",
      borderRadius: "var(--radius-md)",
      border: "1px dashed var(--border-strong)",
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, "+ Add from library")))))), /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 280,
      flex: "none",
      borderLeft: "1px solid var(--border-subtle)",
      background: "var(--bg-raised)",
      padding: 20,
      overflow: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-h3)",
      marginBottom: 4
    }
  }, "Exercise library"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)",
      marginBottom: 12
    }
  }, "Adds to ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--accent)"
    }
  }, days[sel].label)), /*#__PURE__*/React.createElement(Input, {
    placeholder: "Search exercises",
    value: q,
    onChange: e => setQ(e.target.value),
    style: {
      marginBottom: 12
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, lib.map(e => /*#__PURE__*/React.createElement("div", {
    key: e.name,
    onClick: () => add(e),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 12px",
      background: "var(--surface-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-body-strong)",
      fontSize: "var(--text-sm)"
    }
  }, e.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 5
    }
  }, e.tags.map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t,
    style: {
      height: 20,
      fontSize: "var(--text-xs)",
      padding: "0 8px"
    }
  }, t)))), /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 16,
    style: {
      color: "var(--text-muted)"
    }
  }))))), dlg && /*#__PURE__*/React.createElement(Dialog, {
    title: "Assign to " + client.name + "?",
    description: "She gets the plan in her app immediately. The current plan is archived.",
    confirmLabel: "Assign plan",
    onConfirm: () => {
      setDlg(false);
      setToast(true);
      setTimeout(() => setToast(false), 3200);
    },
    onCancel: () => setDlg(false)
  }), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 120
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "positive",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 18
    })
  }, "Plan assigned to ", client.name.split(" ")[0])));
}
window.WAPlanBuilderScreen = PlanBuilderScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/trainer_studio/PlanBuilderScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/trainer_studio/Shell.jsx
try { (() => {
function Shell({
  nav,
  onNav,
  children
}) {
  const {
    Icon
  } = window.WorkoutAlchemistDesignSystem_5f0610;
  const items = [["clients", "users", "Clients"], ["plans", "flask-conical", "Formulas"], ["library", "dumbbell", "Library"], ["settings", "settings", "Settings"]];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      height: "100vh",
      background: "var(--bg-app)"
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 224,
      flex: "none",
      borderRight: "1px solid var(--border-subtle)",
      background: "var(--bg-raised)",
      display: "flex",
      flexDirection: "column",
      padding: "20px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "700 19px/1.1 var(--font-display)",
      padding: "0 12px",
      marginBottom: 28
    }
  }, "Workout", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--accent)"
    }
  }, "Alchemist")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, items.map(([id, ic, label]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => onNav(id),
    style: {
      all: "unset",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "9px 12px",
      borderRadius: "var(--radius-md)",
      font: "var(--type-body-strong)",
      fontSize: "var(--text-sm)",
      color: nav === id ? "var(--accent-hover)" : "var(--text-secondary)",
      background: nav === id ? "var(--accent-dim)" : "transparent"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic
  }), " ", label))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 12px",
      borderTop: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: "50%",
      background: "var(--ink-700)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      font: "var(--type-label)",
      color: "var(--bone-300)"
    }
  }, "KD"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-body-strong)",
      fontSize: "var(--text-sm)"
    }
  }, "Coach Kasia"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-caption)",
      fontSize: "var(--text-xs)",
      color: "var(--text-faint)"
    }
  }, "12 active clients")))), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      overflow: "auto"
    }
  }, children));
}
window.WAShell = Shell;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/trainer_studio/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/trainer_studio/data.js
try { (() => {
window.WAData = {
  clients: [{
    id: "maya",
    name: "Maya Kowalska",
    initials: "MK",
    plan: "Push / pull / legs",
    adherence: 0.92,
    last: "Yesterday · Pull day",
    next: "Thu · Push day",
    tone: "positive",
    status: "On track"
  }, {
    id: "jon",
    name: "Jon Barrett",
    initials: "JB",
    plan: "Upper / lower",
    adherence: 0.78,
    last: "3 days ago · Upper",
    next: "Today · Lower",
    tone: "neutral",
    status: "Week 5"
  }, {
    id: "sofia",
    name: "Sofia Reyes",
    initials: "SR",
    plan: "Full body ×3",
    adherence: 0.55,
    last: "6 days ago · Full body A",
    next: "Overdue",
    tone: "danger",
    status: "Slipping"
  }, {
    id: "andre",
    name: "André Fontaine",
    initials: "AF",
    plan: "Push / pull / legs",
    adherence: 0.88,
    last: "Today · Legs",
    next: "Sat · Push day",
    tone: "pr",
    status: "PR week"
  }, {
    id: "lin",
    name: "Lin Zhou",
    initials: "LZ",
    plan: "No plan assigned",
    adherence: 0,
    last: "—",
    next: "—",
    tone: "neutral",
    status: "New"
  }],
  library: [{
    name: "Bench press",
    tags: ["Chest", "Barbell"]
  }, {
    name: "Overhead press",
    tags: ["Shoulders", "Barbell"]
  }, {
    name: "Incline DB press",
    tags: ["Chest", "Dumbbell"]
  }, {
    name: "Cable fly",
    tags: ["Chest", "Cable"]
  }, {
    name: "Lateral raise",
    tags: ["Shoulders", "Dumbbell"]
  }, {
    name: "Triceps pushdown",
    tags: ["Triceps", "Cable"]
  }, {
    name: "Weighted dip",
    tags: ["Chest", "Bodyweight"]
  }],
  plan: {
    name: "Push / pull / legs",
    weeks: 6,
    days: [{
      label: "Push day",
      ex: [{
        name: "Bench press",
        sets: "4 × 6",
        load: "62.5 kg",
        rest: "150s"
      }, {
        name: "Overhead press",
        sets: "3 × 8",
        load: "40 kg",
        rest: "120s"
      }, {
        name: "Incline DB press",
        sets: "3 × 10",
        load: "24 kg",
        rest: "90s"
      }, {
        name: "Lateral raise",
        sets: "3 × 15",
        load: "8 kg",
        rest: "60s"
      }]
    }, {
      label: "Pull day",
      ex: [{
        name: "Deadlift",
        sets: "3 × 5",
        load: "120 kg",
        rest: "180s"
      }, {
        name: "Weighted pull-up",
        sets: "4 × 6",
        load: "+10 kg",
        rest: "150s"
      }, {
        name: "Seated row",
        sets: "3 × 10",
        load: "55 kg",
        rest: "90s"
      }]
    }, {
      label: "Leg day",
      ex: [{
        name: "Back squat",
        sets: "4 × 6",
        load: "95 kg",
        rest: "180s"
      }, {
        name: "Romanian deadlift",
        sets: "3 × 8",
        load: "80 kg",
        rest: "120s"
      }, {
        name: "Leg press",
        sets: "3 × 12",
        load: "160 kg",
        rest: "90s"
      }]
    }]
  }
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/trainer_studio/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.StatBlock = __ds_scope.StatBlock;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.ProgressRing = __ds_scope.ProgressRing;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
