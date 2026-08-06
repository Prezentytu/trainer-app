/* @ds-bundle: {"format":4,"namespace":"WorkoutAlchemistDesignSystem_381a04","components":[{"name":"LineChart","sourcePath":"components/charts/LineChart.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Field","sourcePath":"components/core/Field.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"Pill","sourcePath":"components/core/Pill.jsx"},{"name":"PillRow","sourcePath":"components/core/Pill.jsx"},{"name":"Switch","sourcePath":"components/core/Switch.jsx"},{"name":"Card","sourcePath":"components/display/Card.jsx"},{"name":"ListRow","sourcePath":"components/display/ListRow.jsx"},{"name":"SectionLabel","sourcePath":"components/display/SectionLabel.jsx"},{"name":"Divider","sourcePath":"components/display/SectionLabel.jsx"},{"name":"StatTile","sourcePath":"components/display/StatTile.jsx"},{"name":"Marker","sourcePath":"components/display/StatTile.jsx"},{"name":"Wordmark","sourcePath":"components/display/Wordmark.jsx"},{"name":"Sheet","sourcePath":"components/feedback/Sheet.jsx"},{"name":"BottomNav","sourcePath":"components/navigation/BottomNav.jsx"},{"name":"SegmentedControl","sourcePath":"components/navigation/SegmentedControl.jsx"},{"name":"TopBar","sourcePath":"components/navigation/TopBar.jsx"},{"name":"ExerciseBlock","sourcePath":"components/session/ExerciseBlock.jsx"},{"name":"SetRowHeader","sourcePath":"components/session/SetRow.jsx"},{"name":"SetRow","sourcePath":"components/session/SetRow.jsx"}],"sourceHashes":{"components/charts/LineChart.jsx":"04d20ed00d02","components/core/Button.jsx":"ede808950667","components/core/Field.jsx":"310468d787c9","components/core/Icon.jsx":"eb70156f1710","components/core/IconButton.jsx":"d726cc5c2524","components/core/Input.jsx":"e0f64f6a5837","components/core/Pill.jsx":"8f476ed0e39d","components/core/Switch.jsx":"62597be6908c","components/display/Card.jsx":"f87a4a1c2361","components/display/ListRow.jsx":"0bfe05fcf9aa","components/display/SectionLabel.jsx":"01a26e141cf4","components/display/StatTile.jsx":"5d5ac5a0fedf","components/display/Wordmark.jsx":"d6bee2ca049d","components/feedback/Sheet.jsx":"745920548a59","components/navigation/BottomNav.jsx":"01d294be9200","components/navigation/SegmentedControl.jsx":"118e8bed550d","components/navigation/TopBar.jsx":"f03661585695","components/session/ExerciseBlock.jsx":"5701c7353dda","components/session/SetRow.jsx":"31c24b0274b8","ui_kits/client_app/ProgressScreen.jsx":"d2645ed93d5d","ui_kits/client_app/SettingsScreen.jsx":"68729b7e7667","ui_kits/client_app/WorkoutScreen.jsx":"45c089586c6a","ui_kits/client_app/WorkoutsScreen.jsx":"2c8910617197","ui_kits/client_app/data.js":"dbd0bc8c4eaf","ui_kits/trainer_panel/ClientScreen.jsx":"5c3d29c71a88","ui_kits/trainer_panel/ClientsScreen.jsx":"ad663d6088dd","ui_kits/trainer_panel/data.js":"a0188b7ecaab"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.WorkoutAlchemistDesignSystem_381a04 = window.WorkoutAlchemistDesignSystem_381a04 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/charts/LineChart.jsx
try { (() => {
/**
 * Single white polyline on a bare plot. Right-hand value axis and a sparse
 * date axis in mono; no grid, no fill, no second series.
 */
function LineChart({
  points,
  labels,
  height = 180,
  showAxis = true,
  dots = true
}) {
  const w = 300;
  const h = height;
  const padR = showAxis ? 38 : 0;
  const padB = showAxis ? 24 : 0;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const lo = min - span * 0.25;
  const hi = max + span * 0.25;
  const x = i => (points.length === 1 ? 0 : i / (points.length - 1) * (w - padR - 6)) + 3;
  const y = v => h - padB - (v - lo) / (hi - lo) * (h - padB - 8);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p).toFixed(1)}`).join(" ");
  const ticks = 4;
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${w} ${h}`,
    width: "100%",
    height: h,
    style: {
      display: "block",
      overflow: "visible"
    },
    role: "img"
  }, showAxis ? Array.from({
    length: ticks + 1
  }, (_, i) => {
    const v = lo + (hi - lo) / ticks * i;
    return /*#__PURE__*/React.createElement("text", {
      key: i,
      x: w - padR + 8,
      y: y(v) + 3,
      fill: "var(--fg-faint)",
      fontSize: "10",
      fontFamily: "var(--font-mono)"
    }, Math.round(v));
  }) : null, /*#__PURE__*/React.createElement("path", {
    d: d,
    fill: "none",
    stroke: "var(--fg)",
    strokeWidth: "2",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }), dots ? points.map((p, i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: x(i),
    cy: y(p),
    r: "3",
    fill: "var(--fg)",
    stroke: "var(--bg)",
    strokeWidth: "1.5"
  })) : null, showAxis && labels ? labels.map((l, i) => /*#__PURE__*/React.createElement("text", {
    key: i,
    x: i / (labels.length - 1) * (w - padR - 6) + 3,
    y: h - 6,
    fill: "var(--fg-faint)",
    fontSize: "10",
    fontFamily: "var(--font-mono)",
    textAnchor: i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"
  }, l)) : null);
}
Object.assign(__ds_scope, { LineChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/LineChart.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
/**
 * The only prominent affordance in the system: a white fill on black (inverted
 * in light theme). Outline and plain carry everything else.
 */
function Button({
  children,
  onClick,
  variant = "solid",
  size = "md",
  caps,
  full,
  disabled,
  type = "button",
  className = ""
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    onClick: onClick,
    disabled: disabled,
    className: ["s-btn", `s-btn--${variant}`, size !== "md" ? `s-btn--${size}` : "", caps ? "s-btn--caps" : "", full ? "s-btn--full" : "", className].filter(Boolean).join(" ")
  }, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Field.jsx
try { (() => {
/** Mono caps label above a control. The only label treatment in the system. */
function Field({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: "s-field"
  }, label ? /*#__PURE__*/React.createElement("span", {
    className: "t-label"
  }, label) : null, children);
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Field.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
const ALIASES = {
  dumbbell: "barbell",
  workout: "person-simple-run",
  progress: "trend-up",
  settings: "gear",
  back: "caret-left",
  forward: "caret-right",
  delete: "trash",
  search: "magnifying-glass",
  edit: "pencil-simple"
};

/**
 * Phosphor glyph. Loaded as a web font, so an icon is just text: it inherits
 * currentColor, scales with font-size and needs no per-icon JS.
 * Requires one stylesheet on the page:
 *   <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css">
 * (add the /light/ and /bold/ sheets only if you use those weights).
 */
function Icon({
  name,
  size = 18,
  weight = "regular",
  color = "currentColor",
  className = ""
}) {
  const glyph = ALIASES[name] || name;
  const prefix = weight === "regular" ? "ph" : `ph-${weight}`;
  return /*#__PURE__*/React.createElement("i", {
    "aria-hidden": true,
    className: [prefix, `ph-${glyph}`, className].filter(Boolean).join(" "),
    style: {
      fontSize: size,
      lineHeight: 1,
      color,
      display: "inline-flex",
      flexShrink: 0
    }
  });
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
/** Circular tap target for a single glyph. Ghost by default. */
function IconButton({
  children,
  onClick,
  title,
  filled,
  size = "md",
  className = ""
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    title: title,
    "aria-label": title,
    className: ["s-iconbtn", filled ? "s-iconbtn--filled" : "", size === "sm" ? "s-iconbtn--sm" : "", className].filter(Boolean).join(" ")
  }, children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
/** Borderless field on a grey well. `num` for mono, centred, tabular figures. */
function Input({
  value,
  onChange,
  placeholder,
  num,
  suffix,
  ariaLabel,
  inputMode,
  disabled,
  className = ""
}) {
  const input = /*#__PURE__*/React.createElement("input", {
    value: value ?? "",
    onChange: onChange ? e => onChange(e.target.value) : undefined,
    placeholder: placeholder,
    "aria-label": ariaLabel,
    disabled: disabled,
    inputMode: inputMode ?? (num ? "decimal" : undefined),
    className: ["s-input", num ? "s-input--num" : "", className].filter(Boolean).join(" ")
  });
  if (!suffix) return input;
  return /*#__PURE__*/React.createElement("span", {
    className: "s-field__row"
  }, input, /*#__PURE__*/React.createElement("span", {
    className: "s-setrow__suffix"
  }, suffix));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/Pill.jsx
try { (() => {
/** Filter chip. Active = solid inverted fill. Mono caps by default. */
function Pill({
  children,
  active,
  onClick,
  text
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    "aria-pressed": active ?? false,
    className: ["s-pill", text ? "s-pill--text" : "", active ? "is-active" : ""].filter(Boolean).join(" ")
  }, children);
}

/** Horizontal scroller for a run of Pills. */
function PillRow({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "s-pillrow"
  }, children);
}
Object.assign(__ds_scope, { Pill, PillRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Pill.jsx", error: String((e && e.message) || e) }); }

// components/core/Switch.jsx
try { (() => {
/** Binary setting. Track inverts when on. */
function Switch({
  label,
  checked,
  onChange
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: "s-switch"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "switch",
    "aria-checked": !!checked,
    "aria-label": label,
    onClick: () => onChange && onChange(!checked),
    className: ["s-switch__track", checked ? "is-on" : ""].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("span", {
    className: "s-switch__knob"
  })), label ? /*#__PURE__*/React.createElement("span", {
    className: "t-body"
  }, label) : null);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Switch.jsx", error: String((e && e.message) || e) }); }

// components/display/Card.jsx
try { (() => {
/** Grey block, 14px radius, no border, no shadow. `flat` swaps fill for a hairline. */
function Card({
  children,
  flat,
  onClick,
  pad = 16,
  className = "",
  style
}) {
  const cls = ["s-card", flat ? "s-card--flat" : "", onClick ? "s-card--tap" : "", className].filter(Boolean).join(" ");
  const s = {
    padding: pad,
    ...style
  };
  if (onClick) {
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onClick,
      className: cls,
      style: s
    }, children);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: cls,
    style: s
  }, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Card.jsx", error: String((e && e.message) || e) }); }

// components/display/ListRow.jsx
try { (() => {
/** Hairline-separated list row: title, mono sub-line, optional right side. */
function ListRow({
  title,
  sub,
  right,
  onClick,
  leading
}) {
  const Tag = onClick ? "button" : "div";
  return /*#__PURE__*/React.createElement(Tag, {
    type: onClick ? "button" : undefined,
    onClick: onClick,
    className: ["s-row", onClick ? "" : "s-row--static"].filter(Boolean).join(" ")
  }, leading ? /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      display: "inline-flex"
    }
  }, leading) : null, /*#__PURE__*/React.createElement("span", {
    className: "s-row__main"
  }, /*#__PURE__*/React.createElement("span", {
    className: "s-row__title",
    style: {
      display: "block"
    }
  }, title), sub ? /*#__PURE__*/React.createElement("span", {
    className: "s-row__sub",
    style: {
      display: "block"
    }
  }, sub) : null), right ? /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0
    }
  }, right) : null);
}
Object.assign(__ds_scope, { ListRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/ListRow.jsx", error: String((e && e.message) || e) }); }

// components/display/SectionLabel.jsx
try { (() => {
/** Mono caps section heading with an optional right-hand action. */
function SectionLabel({
  children,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "s-sectionlabel"
  }, /*#__PURE__*/React.createElement("span", {
    className: "t-label"
  }, children), action ? /*#__PURE__*/React.createElement("span", null, action) : null);
}

/** 1px hairline. The system's only separator. */
function Divider({
  margin = 0
}) {
  return /*#__PURE__*/React.createElement("hr", {
    className: "s-divider",
    style: {
      marginTop: margin,
      marginBottom: margin
    }
  });
}
Object.assign(__ds_scope, { SectionLabel, Divider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/SectionLabel.jsx", error: String((e && e.message) || e) }); }

// components/display/StatTile.jsx
try { (() => {
const UP = "▲";
const DOWN = "▼";
const FLAT = "–";
const STAR = "★";

/** Direction comes from the number's own sign — never from its valence. */
function signGlyph(text) {
  const s = String(text ?? "").trim();
  if (s.startsWith("+")) return UP;
  if (s.startsWith("-") || s.startsWith("−")) return DOWN;
  return null;
}

/** Valence (is this good or bad?) comes from the tone, and only colours. */
function toneGlyph(tone) {
  if (tone === "pr") return STAR;
  if (tone === "gain") return UP;
  if (tone === "loss") return DOWN;
  return FLAT;
}

/**
 * Number first, label under it. The optional `delta` line carries the only
 * colour the system allows on data.
 *
 * Two independent channels, deliberately not merged: the glyph states the
 * DIRECTION of the change and is read off the number's sign, while the colour
 * states its VALENCE and comes from `deltaTone`. That is what lets "-1,2 kg"
 * render as a green ▼ during a cut — falling weight is progress — instead of
 * an up arrow that contradicts the minus beside it.
 */
function StatTile({
  value,
  unit,
  label,
  size = "md",
  center,
  sub,
  tone,
  delta,
  deltaTone
}) {
  const sign = signGlyph(delta);
  const valence = deltaTone || (sign === UP ? "gain" : sign === DOWN ? "loss" : "flat");
  const glyph = sign || toneGlyph(valence);
  return /*#__PURE__*/React.createElement("div", {
    className: ["s-stat", center ? "s-stat--center" : ""].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("span", {
    className: ["s-stat__value", size === "lg" ? "s-stat__value--lg" : "", tone === "pr" ? "s-stat__value--pr" : ""].filter(Boolean).join(" ")
  }, value, unit ? /*#__PURE__*/React.createElement("span", {
    className: "s-stat__unit"
  }, unit) : null), label ? /*#__PURE__*/React.createElement("span", {
    className: "t-label"
  }, label) : null, delta ? /*#__PURE__*/React.createElement("span", {
    className: ["s-stat__delta", valence !== "flat" ? `s-stat__delta--${valence}` : ""].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("span", {
    className: "s-marker__glyph",
    "aria-hidden": true
  }, glyph), delta) : null, sub ? /*#__PURE__*/React.createElement("span", {
    className: "t-small"
  }, sub) : null);
}

/**
 * Standalone data marker for list rows and headers: a PR badge, or a signed
 * change. Same split as StatTile — a signed value gets a direction arrow, an
 * unsigned label ("PR", "uwaga") falls back to the tone's own glyph.
 */
function Marker({
  tone = "flat",
  children,
  glyph = true
}) {
  const mark = signGlyph(children) || toneGlyph(tone);
  return /*#__PURE__*/React.createElement("span", {
    className: `s-marker s-marker--${tone}`
  }, glyph && mark ? /*#__PURE__*/React.createElement("span", {
    className: "s-marker__glyph",
    "aria-hidden": true
  }, mark) : null, children);
}
Object.assign(__ds_scope, { StatTile, Marker });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/StatTile.jsx", error: String((e && e.message) || e) }); }

// components/display/Wordmark.jsx
try { (() => {
/**
 * The brand is type only: the product name in Jost 500, uppercase, 0.24em
 * tracked. No mark exists — never draw one.
 */
function Wordmark({
  children = "Workout Alchemist",
  size = 13,
  className = ""
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: ["s-wordmark", className].filter(Boolean).join(" "),
    style: {
      fontSize: size
    }
  }, children);
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Sheet.jsx
try { (() => {
/** Bottom sheet (default) or centred dialog. Scrim, no shadow, 20px radius. */
function Sheet({
  open,
  onClose,
  title,
  center,
  children,
  footer
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = e => e.key === "Escape" && onClose && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: ["s-sheet", center ? "s-sheet--center" : ""].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Zamknij",
    className: "s-sheet__scrim",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    className: "s-sheet__panel"
  }, title ? /*#__PURE__*/React.createElement("p", {
    className: "t-heading",
    style: {
      margin: "0 0 12px"
    }
  }, title) : null, children, footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      display: "flex",
      gap: 8
    }
  }, footer) : null));
}
Object.assign(__ds_scope, { Sheet });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Sheet.jsx", error: String((e && e.message) || e) }); }

// components/navigation/BottomNav.jsx
try { (() => {
/**
 * Floating pill nav — three or four destinations, centred over the screen.
 * Active tab is a lighter fill, never a colour.
 */
function BottomNav({
  items,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("nav", {
    className: "s-bottomnav"
  }, items.map(item => {
    const active = item.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: item.value,
      type: "button",
      onClick: () => onChange && onChange(item.value),
      "aria-current": active ? "page" : undefined,
      className: ["s-bottomnav__btn", active ? "is-active" : ""].filter(Boolean).join(" ")
    }, item.icon, /*#__PURE__*/React.createElement("span", {
      className: "s-bottomnav__label"
    }, item.label));
  })));
}
Object.assign(__ds_scope, { BottomNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/BottomNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SegmentedControl.jsx
try { (() => {
/** Two or three equal views. Active segment is a solid inverted fill. */
function SegmentedControl({
  items,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "s-seg",
    role: "group"
  }, items.map(item => {
    const v = typeof item === "string" ? item : item.value;
    const label = typeof item === "string" ? item : item.label;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      type: "button",
      onClick: () => onChange && onChange(v),
      className: ["s-seg__btn", v === value ? "is-active" : ""].filter(Boolean).join(" ")
    }, label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TopBar.jsx
try { (() => {
/** 56px screen bar: left action, centre title, right action. No borders. */
function TopBar({
  left,
  title,
  right
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "s-topbar"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      display: "flex",
      justifyContent: "flex-start",
      minWidth: 0
    }
  }, left), title ? /*#__PURE__*/React.createElement("span", {
    className: "s-topbar__title"
  }, title) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      minWidth: 0
    }
  }, right));
}
Object.assign(__ds_scope, { TopBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TopBar.jsx", error: String((e && e.message) || e) }); }

// components/session/ExerciseBlock.jsx
try { (() => {
/**
 * One exercise inside a workout: mono caps name, delete affordance, a stack of
 * SetRows, then "+ Add set". Separated from the next block by a hairline.
 */
function ExerciseBlock({
  name,
  action,
  children,
  onAddSet,
  addLabel = "+ Dodaj serię"
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "s-exercise"
  }, /*#__PURE__*/React.createElement("div", {
    className: "s-exercise__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "s-exercise__name"
  }, name), action), children, onAddSet ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "s-addset",
    onClick: onAddSet
  }, addLabel) : null);
}
Object.assign(__ds_scope, { ExerciseBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/session/ExerciseBlock.jsx", error: String((e && e.message) || e) }); }

// components/session/SetRow.jsx
try { (() => {
/** Column headings for a stack of SetRows. */
function SetRowHeader({
  left = "Ciężar (kg)",
  right = "Powt."
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "s-setgrid s-setgrid--head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "t-label"
  }, "Set"), /*#__PURE__*/React.createElement("span", {
    className: "t-label"
  }, left), /*#__PURE__*/React.createElement("span", {
    className: "t-label"
  }, right), /*#__PURE__*/React.createElement("span", null));
}

/**
 * One logged set: number, weight, reps, delete. Four columns, no card, no
 * borders — the grid is the structure.
 */
function SetRow({
  index,
  weight,
  reps,
  weightSuffix = "kg",
  repsSuffix = "reps",
  onWeight,
  onReps,
  onDelete
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "s-setgrid",
    style: {
      paddingTop: 4,
      paddingBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "s-setrow__n"
  }, index), /*#__PURE__*/React.createElement("span", {
    className: "s-setrow__cell"
  }, /*#__PURE__*/React.createElement(__ds_scope.Input, {
    num: true,
    value: weight,
    onChange: onWeight,
    ariaLabel: "ci\u0119\u017Car"
  }), /*#__PURE__*/React.createElement("span", {
    className: "s-setrow__suffix"
  }, weightSuffix)), /*#__PURE__*/React.createElement("span", {
    className: "s-setrow__cell"
  }, /*#__PURE__*/React.createElement(__ds_scope.Input, {
    num: true,
    value: reps,
    onChange: onReps,
    ariaLabel: "powt\xF3rzenia"
  }), /*#__PURE__*/React.createElement("span", {
    className: "s-setrow__suffix"
  }, repsSuffix)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "s-setrow__del",
    onClick: onDelete,
    "aria-label": "Usu\u0144 seri\u0119"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.5",
    "aria-hidden": true
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M15 9l-6 6M9 9l6 6"
  }))));
}
Object.assign(__ds_scope, { SetRowHeader, SetRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/session/SetRow.jsx", error: String((e && e.message) || e) }); }

// ui_kits/client_app/ProgressScreen.jsx
try { (() => {
const {
  Card,
  SectionLabel,
  StatTile,
  Marker,
  Pill,
  PillRow,
  Button,
  LineChart
} = window.WorkoutAlchemistDesignSystem_381a04;
function ProgressScreen() {
  const a = window.APP;
  const [group, setGroup] = React.useState("Klatka");
  const list = a.exercisesByGroup[group];
  const [exercise, setExercise] = React.useState(list[0]);
  const s = a.series[exercise] || a.series["Bench Press"];
  const pickGroup = g => {
    setGroup(g);
    setExercise(a.exercisesByGroup[g][0]);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "28px var(--gutter) 140px"
    }
  }, /*#__PURE__*/React.createElement("h1", {
    className: "t-title",
    style: {
      margin: 0
    }
  }, "Progres"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionLabel, {
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "plain",
      size: "sm"
    }, "Edytuj")
  }, "Cia\u0142o"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    value: a.body.weight,
    unit: "kg",
    label: "Waga",
    delta: "-1,2 kg",
    deltaTone: "gain"
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: a.body.height,
    unit: "cm",
    label: "Wzrost"
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: a.body.bmi,
    label: "BMI",
    delta: "-0,3",
    deltaTone: "gain"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 16,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "s-pill",
    style: {
      pointerEvents: "none"
    }
  }, a.body.sex), /*#__PURE__*/React.createElement("span", {
    className: "s-pill",
    style: {
      pointerEvents: "none"
    }
  }, a.body.units), /*#__PURE__*/React.createElement("span", {
    className: "s-pill",
    style: {
      pointerEvents: "none"
    }
  }, "Cel: ", a.body.goal)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(PillRow, null, a.groups.map(g => /*#__PURE__*/React.createElement(Pill, {
    key: g,
    active: g === group,
    onClick: () => pickGroup(g)
  }, g))), /*#__PURE__*/React.createElement(PillRow, null, list.map(e => /*#__PURE__*/React.createElement(Pill, {
    key: e,
    text: true,
    active: e === exercise,
    onClick: () => setExercise(e)
  }, e)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "t-label"
  }, "1RM \xB7 6 tygodni"), /*#__PURE__*/React.createElement(Marker, {
    tone: s.points[s.points.length - 1] >= s.points[0] ? "gain" : "loss"
  }, s.points[s.points.length - 1] >= s.points[0] ? "+" : "", Math.round((s.points[s.points.length - 1] - s.points[0]) / s.points[0] * 100), "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(LineChart, {
    points: s.points,
    labels: s.labels,
    height: 190
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    value: s.best,
    unit: "kg",
    label: "Rekord",
    tone: "pr",
    center: true
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: s.sessions,
    label: "Sesje",
    center: true
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: s.volume,
    unit: "kg",
    label: "Najlepsza obj\u0119to\u015B\u0107",
    center: true,
    delta: "+8%"
  })));
}
Object.assign(window, {
  ProgressScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/client_app/ProgressScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/client_app/SettingsScreen.jsx
try { (() => {
const {
  Card,
  SectionLabel,
  Field,
  Input,
  SegmentedControl,
  Switch,
  ListRow,
  Icon,
  Wordmark,
  Divider
} = window.WorkoutAlchemistDesignSystem_381a04;
function SettingsScreen({
  theme,
  onTheme
}) {
  const a = window.APP;
  const [sex, setSex] = React.useState("Mężczyzna");
  const [units, setUnits] = React.useState("Metryczny");
  const [rest, setRest] = React.useState(true);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "28px var(--gutter) 140px"
    }
  }, /*#__PURE__*/React.createElement("h1", {
    className: "t-title",
    style: {
      margin: 0
    }
  }, "Ustawienia"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionLabel, null, "Profil"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    value: sex,
    onChange: setSex,
    items: ["Mężczyzna", "Kobieta", "Inne"]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Waga"
  }, /*#__PURE__*/React.createElement(Input, {
    num: true,
    value: a.body.weight,
    suffix: "kg"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Wzrost"
  }, /*#__PURE__*/React.createElement(Input, {
    num: true,
    value: a.body.height,
    suffix: "cm"
  })))), /*#__PURE__*/React.createElement("p", {
    className: "t-small",
    style: {
      margin: "12px 0 0"
    }
  }, "Waga i wzrost trafiaj\u0105 te\u017C do zak\u0142adki Progres."))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Trening"), /*#__PURE__*/React.createElement(ListRow, {
    title: "Waga docelowa",
    sub: a.body.goal,
    right: /*#__PURE__*/React.createElement(Icon, {
      name: "caret-right",
      size: 15,
      color: "var(--fg-faint)"
    }),
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(ListRow, {
    title: "Domy\u015Blna przerwa",
    sub: "90 s",
    right: /*#__PURE__*/React.createElement(Icon, {
      name: "caret-right",
      size: 15,
      color: "var(--fg-faint)"
    }),
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(ListRow, {
    title: "Jednostki",
    right: /*#__PURE__*/React.createElement("span", {
      style: {
        width: 200
      }
    }, /*#__PURE__*/React.createElement(SegmentedControl, {
      value: units,
      onChange: setUnits,
      items: ["Metryczny", "Imperialny"]
    }))
  }), /*#__PURE__*/React.createElement(ListRow, {
    title: "Auto-start przerwy",
    right: /*#__PURE__*/React.createElement(Switch, {
      checked: rest,
      onChange: setRest
    })
  }), /*#__PURE__*/React.createElement(ListRow, {
    title: "Ciemny motyw",
    right: /*#__PURE__*/React.createElement(Switch, {
      checked: theme === "dark",
      onChange: v => onTheme(v ? "dark" : "light")
    })
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Dane"), /*#__PURE__*/React.createElement(ListRow, {
    title: "Eksportuj CSV",
    right: /*#__PURE__*/React.createElement(Icon, {
      name: "caret-right",
      size: 15,
      color: "var(--fg-faint)"
    }),
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(ListRow, {
    title: "Usu\u0144 wszystkie dane",
    right: /*#__PURE__*/React.createElement(Icon, {
      name: "caret-right",
      size: 15,
      color: "var(--fg-faint)"
    }),
    onClick: () => {}
  })), /*#__PURE__*/React.createElement(Divider, {
    margin: 28
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    size: 11
  }), /*#__PURE__*/React.createElement("span", {
    className: "t-label"
  }, "v1.0.0")));
}
Object.assign(window, {
  SettingsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/client_app/SettingsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/client_app/WorkoutScreen.jsx
try { (() => {
const {
  TopBar,
  Button,
  IconButton,
  Icon,
  ExerciseBlock,
  SetRow,
  SetRowHeader,
  Sheet,
  Input,
  ListRow
} = window.WorkoutAlchemistDesignSystem_381a04;
function WorkoutScreen({
  onCancel,
  onFinish
}) {
  const src = window.APP.session;
  const [exercises, setExercises] = React.useState(() => JSON.parse(JSON.stringify(src.exercises)));
  const [picker, setPicker] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [confirm, setConfirm] = React.useState(false);
  const patch = (ei, si, key, v) => setExercises(xs => xs.map((e, i) => i === ei ? {
    ...e,
    sets: e.sets.map((s, j) => j === si ? {
      ...s,
      [key]: v
    } : s)
  } : e));
  const addSet = ei => setExercises(xs => xs.map((e, i) => i === ei ? {
    ...e,
    sets: [...e.sets, {
      w: e.bodyweight ? "BW" : "",
      r: ""
    }]
  } : e));
  const delSet = (ei, si) => setExercises(xs => xs.map((e, i) => i === ei ? {
    ...e,
    sets: e.sets.filter((_, j) => j !== si)
  } : e));
  const library = src.library.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
  const totalSets = exercises.reduce((n, e) => n + e.sets.length, 0);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    left: /*#__PURE__*/React.createElement(Button, {
      variant: "plain",
      size: "sm",
      onClick: () => setConfirm(true)
    }, "Anuluj"),
    title: "Trening",
    right: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "plain",
      size: "sm"
    }, "Zapisz"), /*#__PURE__*/React.createElement(Button, {
      caps: true,
      size: "sm",
      onClick: onFinish
    }, "Finish"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: "4px var(--gutter) 40px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "t-label"
  }, src.date), /*#__PURE__*/React.createElement("span", {
    className: "t-label"
  }, totalSets, " serii")), exercises.map((ex, ei) => /*#__PURE__*/React.createElement(ExerciseBlock, {
    key: ei,
    name: ex.name,
    action: /*#__PURE__*/React.createElement(IconButton, {
      title: "Usu\u0144 \u0107wiczenie",
      size: "sm",
      onClick: () => setExercises(xs => xs.filter((_, i) => i !== ei))
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "trash",
      size: 14
    })),
    onAddSet: () => addSet(ei)
  }, /*#__PURE__*/React.createElement(SetRowHeader, {
    left: ex.bodyweight ? "Ciężar" : "Ciężar (kg)",
    right: "Powt."
  }), ex.sets.map((s, si) => /*#__PURE__*/React.createElement(SetRow, {
    key: si,
    index: si + 1,
    weight: s.w,
    reps: s.r,
    weightSuffix: ex.bodyweight ? "BW" : "kg",
    onWeight: v => patch(ei, si, "w", v),
    onReps: v => patch(ei, si, "r", v),
    onDelete: () => delSet(ei, si)
  })))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "s-addset",
    style: {
      paddingTop: 20
    },
    onClick: () => setPicker(true)
  }, "+ Dodaj \u0107wiczenie")), /*#__PURE__*/React.createElement(Sheet, {
    open: picker,
    onClose: () => setPicker(false),
    title: "Dodaj \u0107wiczenie"
  }, /*#__PURE__*/React.createElement(Input, {
    value: search,
    onChange: setSearch,
    placeholder: "Szukaj\u2026"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      maxHeight: 260,
      overflowY: "auto"
    }
  }, library.map(e => /*#__PURE__*/React.createElement(ListRow, {
    key: e.name,
    title: e.name,
    sub: e.group,
    right: /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 15,
      color: "var(--fg-faint)"
    }),
    onClick: () => {
      setExercises(xs => [...xs, {
        name: e.name,
        bodyweight: false,
        sets: [{
          w: "",
          r: ""
        }]
      }]);
      setPicker(false);
      setSearch("");
    }
  })))), /*#__PURE__*/React.createElement(Sheet, {
    center: true,
    open: confirm,
    onClose: () => setConfirm(false),
    title: "Odrzuci\u0107 trening?",
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      full: true,
      onClick: () => setConfirm(false)
    }, "Wr\xF3\u0107"), /*#__PURE__*/React.createElement(Button, {
      variant: "danger",
      full: true,
      onClick: onCancel
    }, "Odrzu\u0107"))
  }, /*#__PURE__*/React.createElement("p", {
    className: "t-small",
    style: {
      margin: 0
    }
  }, "Serie z tej sesji nie zostan\u0105 zapisane.")));
}
Object.assign(window, {
  WorkoutScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/client_app/WorkoutScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/client_app/WorkoutsScreen.jsx
try { (() => {
const {
  Card,
  SectionLabel,
  ListRow,
  StatTile,
  Marker,
  Button,
  IconButton,
  Icon,
  LineChart
} = window.WorkoutAlchemistDesignSystem_381a04;
const WD = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];
const nf = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");
function MonthGrid() {
  const a = window.APP;
  const cells = [];
  for (let i = 0; i < a.firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= a.monthDays; d++) cells.push(d);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 12
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    title: "Poprzedni miesi\u0105c",
    size: "sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "caret-left",
    size: 15
  })), /*#__PURE__*/React.createElement("span", {
    className: "t-label"
  }, a.month), /*#__PURE__*/React.createElement(IconButton, {
    title: "Nast\u0119pny miesi\u0105c",
    size: "sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "caret-right",
    size: 15
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7,1fr)",
      gap: 2
    }
  }, WD.map(w => /*#__PURE__*/React.createElement("span", {
    key: w,
    className: "t-label",
    style: {
      textAlign: "center",
      paddingBottom: 6
    }
  }, w)), cells.map((d, i) => {
    if (!d) return /*#__PURE__*/React.createElement("span", {
      key: `e${i}`
    });
    const trained = a.trainedDays.includes(d);
    const isToday = d === a.today;
    return /*#__PURE__*/React.createElement("span", {
      key: d,
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        padding: "6px 0"
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "t-num",
      style: {
        fontSize: 13,
        fontWeight: isToday || trained ? 700 : 400,
        color: isToday || trained ? "var(--fg)" : "var(--fg-faint)"
      }
    }, d), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 5,
        height: 5,
        borderRadius: 999,
        background: trained ? "var(--fg)" : "transparent",
        border: isToday && !trained ? "1px solid var(--fg-faint)" : "1px solid transparent"
      }
    }));
  })));
}
function WorkoutsScreen({
  onOpen,
  onNew
}) {
  const a = window.APP;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "28px var(--gutter) 140px"
    }
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("h1", {
    className: "t-title",
    style: {
      margin: 0
    }
  }, a.greeting), /*#__PURE__*/React.createElement("p", {
    className: "t-small",
    style: {
      margin: "4px 0 0"
    }
  }, a.sub)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(MonthGrid, null))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "plain",
      size: "sm",
      onClick: onNew
    }, "Nowy")
  }, "Ostatnie treningi"), a.workouts.map(w => /*#__PURE__*/React.createElement(ListRow, {
    key: w.id,
    title: w.name,
    sub: `${w.date} · ${w.sets} serii · ${nf(w.volume)} kg`,
    right: /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, w.best ? /*#__PURE__*/React.createElement(Marker, {
      tone: "pr"
    }, "PR") : null, /*#__PURE__*/React.createElement(Icon, {
      name: "caret-right",
      size: 15,
      color: "var(--fg-faint)"
    })),
    onClick: () => onOpen(w)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement(Card, {
    flat: true
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Ten tydzie\u0144"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    value: "3",
    label: "Treningi",
    delta: "+1"
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: "39",
    label: "Serie",
    delta: "+4"
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: "13 880",
    unit: "kg",
    label: "Obj\u0119to\u015B\u0107",
    delta: "+8%"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(LineChart, {
    points: [3200, 3600, 3480, 4200, 4380, 4510, 4820],
    height: 56,
    showAxis: false,
    dots: false
  })))));
}
Object.assign(window, {
  WorkoutsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/client_app/WorkoutsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/client_app/data.js
try { (() => {
window.APP = {
  greeting: "Dobry wieczór",
  sub: "Gotowy na trening?",
  month: "Marzec 2026",
  monthDays: 31,
  firstWeekday: 0,
  // Monday
  today: 25,
  trainedDays: [2, 3, 6, 11, 14, 17, 18, 22, 24],
  workouts: [{
    id: 1,
    name: "Push Day A",
    date: "25 mar",
    sets: 12,
    volume: 4820,
    best: true
  }, {
    id: 2,
    name: "Pull Day A",
    date: "23 mar",
    sets: 15,
    volume: 3960
  }, {
    id: 3,
    name: "Legs",
    date: "21 mar",
    sets: 12,
    volume: 5100
  }, {
    id: 4,
    name: "Push Day A",
    date: "18 mar",
    sets: 12,
    volume: 4510
  }, {
    id: 5,
    name: "Pull Day A",
    date: "16 mar",
    sets: 14,
    volume: 3840
  }],
  session: {
    date: "Środa, 25 mar 2026",
    exercises: [{
      name: "Lat pulldown",
      bodyweight: false,
      sets: [{
        w: "60",
        r: "7"
      }, {
        w: "60",
        r: "7"
      }, {
        w: "60",
        r: "5"
      }]
    }, {
      name: "Pull-up",
      bodyweight: true,
      sets: [{
        w: "BW",
        r: "8"
      }, {
        w: "BW",
        r: "8"
      }]
    }, {
      name: "Bicep curl",
      bodyweight: false,
      sets: [{
        w: "22,5",
        r: "6"
      }, {
        w: "22,5",
        r: "6"
      }]
    }],
    library: [{
      name: "Bench Press",
      group: "Klatka"
    }, {
      name: "Cable Fly",
      group: "Klatka"
    }, {
      name: "Incline Dumbbell Press",
      group: "Klatka"
    }, {
      name: "Barbell Row",
      group: "Plecy"
    }, {
      name: "Squat",
      group: "Nogi"
    }, {
      name: "Deadlift",
      group: "Nogi"
    }]
  },
  body: {
    weight: "85,5",
    height: "190",
    bmi: "23,7",
    sex: "Mężczyzna",
    units: "Metryczny",
    goal: "83 kg"
  },
  groups: ["Klatka", "Plecy", "Nogi", "Barki", "Ramiona"],
  exercisesByGroup: {
    Klatka: ["Bench Press", "Cable Fly", "Incline Dumbbell Press"],
    Plecy: ["Lat pulldown", "Barbell Row", "Pull-up"],
    Nogi: ["Squat", "Deadlift", "Leg Press"],
    Barki: ["Overhead Press", "Lateral Raise"],
    Ramiona: ["Bicep Curl", "Triceps Pushdown"]
  },
  series: {
    "Bench Press": {
      points: [48, 52, 66, 72, 68, 80],
      labels: ["9. mar", "16. mar", "23. mar"],
      best: "80",
      sessions: 5,
      volume: "1 280"
    },
    "Cable Fly": {
      points: [20, 22, 24, 24, 26, 28],
      labels: ["9. mar", "16. mar", "23. mar"],
      best: "28",
      sessions: 4,
      volume: "620"
    },
    "Incline Dumbbell Press": {
      points: [30, 32, 32, 35, 37, 40],
      labels: ["9. mar", "16. mar", "23. mar"],
      best: "40",
      sessions: 6,
      volume: "980"
    },
    "Lat pulldown": {
      points: [50, 52, 55, 58, 60, 60],
      labels: ["9. mar", "16. mar", "23. mar"],
      best: "60",
      sessions: 7,
      volume: "1 140"
    },
    "Barbell Row": {
      points: [40, 42, 45, 45, 48, 50],
      labels: ["9. mar", "16. mar", "23. mar"],
      best: "50",
      sessions: 5,
      volume: "900"
    },
    "Pull-up": {
      points: [6, 7, 7, 8, 8, 9],
      labels: ["9. mar", "16. mar", "23. mar"],
      best: "9",
      sessions: 6,
      volume: "—"
    },
    Squat: {
      points: [80, 85, 90, 95, 100, 105],
      labels: ["9. mar", "16. mar", "23. mar"],
      best: "105",
      sessions: 6,
      volume: "2 040"
    },
    Deadlift: {
      points: [100, 105, 110, 112, 118, 120],
      labels: ["9. mar", "16. mar", "23. mar"],
      best: "120",
      sessions: 4,
      volume: "1 860"
    },
    "Leg Press": {
      points: [120, 130, 140, 145, 150, 160],
      labels: ["9. mar", "16. mar", "23. mar"],
      best: "160",
      sessions: 5,
      volume: "3 200"
    },
    "Overhead Press": {
      points: [30, 32, 35, 35, 37, 40],
      labels: ["9. mar", "16. mar", "23. mar"],
      best: "40",
      sessions: 5,
      volume: "740"
    },
    "Lateral Raise": {
      points: [8, 9, 10, 10, 12, 12],
      labels: ["9. mar", "16. mar", "23. mar"],
      best: "12",
      sessions: 4,
      volume: "310"
    },
    "Bicep Curl": {
      points: [16, 18, 20, 20, 22, 22.5],
      labels: ["9. mar", "16. mar", "23. mar"],
      best: "22,5",
      sessions: 6,
      volume: "480"
    },
    "Triceps Pushdown": {
      points: [25, 27, 30, 30, 32, 35],
      labels: ["9. mar", "16. mar", "23. mar"],
      best: "35",
      sessions: 5,
      volume: "560"
    }
  }
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/client_app/data.js", error: String((e && e.message) || e) }); }

// ui_kits/trainer_panel/ClientScreen.jsx
try { (() => {
const {
  Card,
  SectionLabel,
  ListRow,
  StatTile,
  Marker,
  Button,
  Icon,
  LineChart,
  SegmentedControl,
  Divider
} = window.WorkoutAlchemistDesignSystem_381a04;
const nf = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");
function ClientScreen({
  onBack
}) {
  const c = window.PANEL.client;
  const [tab, setTab] = React.useState("Historia");
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Button, {
    variant: "plain",
    size: "sm",
    onClick: onBack
  }, "\u2190 Klienci"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 24,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h1", {
    className: "t-title",
    style: {
      margin: 0
    }
  }, c.name), /*#__PURE__*/React.createElement("p", {
    className: "t-small",
    style: {
      margin: "4px 0 0"
    }
  }, c.email, " \xB7 ", c.goal)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "sm"
  }, "Skopiuj link"), /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, "Otw\xF3rz plan"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.5fr 1fr",
      gap: 16,
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionLabel, {
    action: /*#__PURE__*/React.createElement("span", {
      className: "t-label"
    }, c.week)
  }, "Aktywny plan"), /*#__PURE__*/React.createElement("p", {
    className: "t-heading",
    style: {
      margin: "6px 0 0"
    }
  }, c.plan), /*#__PURE__*/React.createElement("p", {
    className: "t-small",
    style: {
      margin: "4px 0 0"
    }
  }, "Nast\u0119pny: ", c.next), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(LineChart, {
    points: c.volume,
    height: 64,
    showAxis: false,
    dots: false
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "t-label"
  }, "Obj\u0119to\u015B\u0107 \xB7 7 tygodni"), /*#__PURE__*/React.createElement(Marker, {
    tone: "gain"
  }, "+12%"))), /*#__PURE__*/React.createElement(Card, {
    flat: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    value: c.stats.sessions30,
    label: "Treningi (30 dni)",
    delta: "+2"
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: c.stats.best,
    unit: "kg",
    label: "Rekord \u2014 przysiad",
    tone: "pr",
    delta: "+5 kg"
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: c.stats.prs,
    label: "Nowe rekordy (30 dni)",
    tone: "pr"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32,
      maxWidth: 320
    }
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    value: tab,
    onChange: setTab,
    items: ["Historia", "Plan"]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, tab === "Historia" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SectionLabel, null, "Ostatnie treningi"), c.history.map((h, i) => /*#__PURE__*/React.createElement(ListRow, {
    key: i,
    title: h.name,
    sub: `${h.date} · ${h.sets} serii · ${nf(h.volume)} kg`,
    right: /*#__PURE__*/React.createElement(Icon, {
      name: "caret-right",
      size: 15,
      color: "var(--fg-faint)"
    }),
    onClick: () => {}
  }))) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 16
    }
  }, c.plan_days.map(d => /*#__PURE__*/React.createElement(Card, {
    key: d.code
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    action: /*#__PURE__*/React.createElement("span", {
      className: "t-label"
    }, d.code)
  }, d.name), d.items.map((it, i) => /*#__PURE__*/React.createElement("p", {
    key: i,
    className: "t-small",
    style: {
      margin: i ? "8px 0 0" : "4px 0 0",
      color: "var(--fg-muted)"
    }
  }, it)), /*#__PURE__*/React.createElement(Divider, {
    margin: 14
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "plain",
    size: "sm"
  }, "+ \u0106wiczenie"))))));
}
Object.assign(window, {
  ClientScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/trainer_panel/ClientScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/trainer_panel/ClientsScreen.jsx
try { (() => {
const {
  SectionLabel,
  ListRow,
  StatTile,
  Marker,
  Button,
  Icon,
  Input,
  Card
} = window.WorkoutAlchemistDesignSystem_381a04;
function ClientsScreen({
  onOpen
}) {
  const p = window.PANEL;
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const rows = p.clients.filter(c => c.name.toLowerCase().includes(q.toLowerCase())).filter(c => filter === "all" ? true : c.state === "attention");
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("h1", {
    className: "t-title",
    style: {
      margin: 0
    }
  }, "Klienci"), /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, "Dodaj klienta")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 24,
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    value: p.stats.clients,
    label: "Klienci",
    size: "lg"
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: p.stats.sessions7,
    label: "Sesje (7 dni)",
    size: "lg",
    delta: "+3"
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: p.stats.prs7,
    label: "Rekordy (7 dni)",
    size: "lg",
    tone: "pr"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginTop: 36
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 260
    }
  }, /*#__PURE__*/React.createElement(Input, {
    value: q,
    onChange: setQ,
    placeholder: "Szukaj klienta\u2026"
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: ["s-pill", filter === "all" ? "is-active" : ""].join(" "),
    onClick: () => setFilter("all")
  }, "Wszyscy"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: ["s-pill", filter === "attention" ? "is-active" : ""].join(" "),
    onClick: () => setFilter("attention")
  }, "Wymagaj\u0105 uwagi")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, rows.length, " z ", p.clients.length), rows.map(c => /*#__PURE__*/React.createElement(ListRow, {
    key: c.id,
    title: c.name,
    sub: `${c.plan} · ostatni trening ${c.last}`,
    right: /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 20
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "t-num",
      style: {
        fontSize: 13,
        color: "var(--fg)"
      }
    }, c.sessions), c.state === "attention" ? /*#__PURE__*/React.createElement(Marker, {
      tone: "loss"
    }, "uwaga") : null, /*#__PURE__*/React.createElement(Icon, {
      name: "caret-right",
      size: 15,
      color: "var(--fg-faint)"
    })),
    onClick: () => onOpen(c)
  }))));
}
Object.assign(window, {
  ClientsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/trainer_panel/ClientsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/trainer_panel/data.js
try { (() => {
window.PANEL = {
  trainer: "Trener lokalny",
  stats: {
    clients: 8,
    sessions7: 21,
    prs7: 4
  },
  clients: [{
    id: 1,
    name: "Jan Kowalski",
    plan: "Push / Pull / Legs",
    last: "dziś",
    sessions: "3/3",
    state: "ok"
  }, {
    id: 2,
    name: "Anna Nowak",
    plan: "Brak planu",
    last: "5 dni temu",
    sessions: "0/3",
    state: "attention"
  }, {
    id: 3,
    name: "Marek Lis",
    plan: "Full body A",
    last: "9 dni temu",
    sessions: "0/2",
    state: "attention"
  }, {
    id: 4,
    name: "Ewa Zielińska",
    plan: "Upper / Lower",
    last: "wczoraj",
    sessions: "2/2",
    state: "ok"
  }, {
    id: 5,
    name: "Piotr Wójcik",
    plan: "Push / Pull / Legs",
    last: "2 dni temu",
    sessions: "2/3",
    state: "ok"
  }],
  client: {
    name: "Jan Kowalski",
    email: "jan.kowalski@example.com",
    goal: "siła · 3× w tygodniu",
    plan: "Push / Pull / Legs",
    week: "Tydzień 2 z 8",
    next: "Push Day A",
    volume: [3200, 3600, 3480, 4200, 4380, 4510, 4820],
    stats: {
      sessions30: 11,
      best: "132",
      prs: 3
    },
    history: [{
      name: "Push Day A",
      date: "25 mar",
      sets: 12,
      volume: 4820
    }, {
      name: "Pull Day A",
      date: "23 mar",
      sets: 15,
      volume: 3960
    }, {
      name: "Legs",
      date: "21 mar",
      sets: 12,
      volume: 5100
    }, {
      name: "Push Day A",
      date: "18 mar",
      sets: 12,
      volume: 4510
    }],
    plan_days: [{
      code: "D1",
      name: "Push Day A",
      items: ["Bench Press · 3 × 8", "Overhead Press · 3 × 10", "Triceps Pushdown · 3 × 12"]
    }, {
      code: "D2",
      name: "Pull Day A",
      items: ["Lat pulldown · 3 × 10", "Barbell Row · 3 × 10", "Bicep Curl · 3 × 12"]
    }, {
      code: "D3",
      name: "Legs",
      items: ["Squat · 4 × 6", "Leg Press · 3 × 12", "Calf Raise · 3 × 15"]
    }]
  }
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/trainer_panel/data.js", error: String((e && e.message) || e) }); }

__ds_ns.LineChart = __ds_scope.LineChart;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Pill = __ds_scope.Pill;

__ds_ns.PillRow = __ds_scope.PillRow;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.SectionLabel = __ds_scope.SectionLabel;

__ds_ns.Divider = __ds_scope.Divider;

__ds_ns.StatTile = __ds_scope.StatTile;

__ds_ns.Marker = __ds_scope.Marker;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.Sheet = __ds_scope.Sheet;

__ds_ns.BottomNav = __ds_scope.BottomNav;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.TopBar = __ds_scope.TopBar;

__ds_ns.ExerciseBlock = __ds_scope.ExerciseBlock;

__ds_ns.SetRowHeader = __ds_scope.SetRowHeader;

__ds_ns.SetRow = __ds_scope.SetRow;

})();
