/* @ds-bundle: {"format":4,"namespace":"LoqalStorefrontDesignSystem_ba3098","components":[{"name":"ChatBubble","sourcePath":"components/chat/ChatBubble.jsx"},{"name":"BrandTab","sourcePath":"components/commerce/BrandTab.jsx"},{"name":"CartLine","sourcePath":"components/commerce/CartLine.jsx"},{"name":"Money","sourcePath":"components/commerce/Money.jsx"},{"name":"PaymentOption","sourcePath":"components/commerce/PaymentOption.jsx"},{"name":"ProductCard","sourcePath":"components/commerce/ProductCard.jsx"},{"name":"QuantityStepper","sourcePath":"components/commerce/QuantityStepper.jsx"},{"name":"RollingNumber","sourcePath":"components/commerce/RollingNumber.jsx"},{"name":"StatusTones","sourcePath":"components/commerce/StatusPill.jsx"},{"name":"StatusPill","sourcePath":"components/commerce/StatusPill.jsx"},{"name":"VariantPicker","sourcePath":"components/commerce/VariantPicker.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Checkbox","sourcePath":"components/core/Checkbox.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"Select","sourcePath":"components/core/Select.jsx"},{"name":"Skeleton","sourcePath":"components/core/Skeleton.jsx"},{"name":"Textarea","sourcePath":"components/core/Textarea.jsx"},{"name":"BottomTabBar","sourcePath":"components/navigation/BottomTabBar.jsx"},{"name":"CategoryTabs","sourcePath":"components/navigation/CategoryTabs.jsx"},{"name":"SearchField","sourcePath":"components/navigation/SearchField.jsx"},{"name":"TopBar","sourcePath":"components/navigation/TopBar.jsx"},{"name":"ActionBar","sourcePath":"components/overlays/ActionBar.jsx"},{"name":"Sheet","sourcePath":"components/overlays/Sheet.jsx"}],"sourceHashes":{"components/chat/ChatBubble.jsx":"d9afff34e851","components/commerce/BrandTab.jsx":"c1ef110a95d9","components/commerce/CartLine.jsx":"9e839522a457","components/commerce/Money.jsx":"3c8186bd2736","components/commerce/PaymentOption.jsx":"fe57361eb31f","components/commerce/ProductCard.jsx":"2566674766b7","components/commerce/QuantityStepper.jsx":"cddeb11a56e9","components/commerce/RollingNumber.jsx":"53c8fa6e7aec","components/commerce/StatusPill.jsx":"3965f5f50721","components/commerce/VariantPicker.jsx":"d2bd060bd0cc","components/core/Badge.jsx":"649b7c883e58","components/core/Button.jsx":"f36052f9c812","components/core/Card.jsx":"57d251473704","components/core/Checkbox.jsx":"f44687745ade","components/core/Icon.jsx":"c6fbc0cd0996","components/core/IconButton.jsx":"34c6798b89ba","components/core/Input.jsx":"e04e5d6450e2","components/core/Select.jsx":"f5978c7074c6","components/core/Skeleton.jsx":"d41897a9b1f2","components/core/Textarea.jsx":"b6ae0bad8fd1","components/navigation/BottomTabBar.jsx":"9150a9bbf8bc","components/navigation/CategoryTabs.jsx":"165ac58d676f","components/navigation/SearchField.jsx":"2f2a3e6ebaaa","components/navigation/TopBar.jsx":"80856e9bd1c9","components/overlays/ActionBar.jsx":"41eb4ae70497","components/overlays/Sheet.jsx":"e978c1193311","ui_kits/ds-loader.js":"876c7e4e4f0c","ui_kits/storefront/account-screen.js":"1257a0e63fb6","ui_kits/storefront/bag-screen.js":"a93333af36c5","ui_kits/storefront/chat-screen.js":"6e6a2858b520","ui_kits/storefront/checkout-screen.js":"dc553e458ee6","ui_kits/storefront/data.js":"10732acee8af","ui_kits/storefront/home-screen.js":"05f3a322ab12","ui_kits/storefront/order-screen.js":"dcea4b489871","ui_kits/storefront/orders-screen.js":"f363ebd99874","ui_kits/storefront/product-screen.js":"c7267c879f09","ui_kits/storefront/search-screen.js":"ee536e02437a","ui_kits/storefront/shop-app.js":"f17be003a80e","ui_kits/storefront/try-on-sheet.js":"ebd2bf5e10a7"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.LoqalStorefrontDesignSystem_ba3098 = window.LoqalStorefrontDesignSystem_ba3098 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/commerce/BrandTab.jsx
try { (() => {
/** The homepage brand row: featured first, then sortOrder, then newest. */
function BrandTab({
  name,
  selected = false,
  featured = false,
  onClick,
  className = ''
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "tab",
    "aria-selected": selected,
    onClick: onClick,
    className: ('lq-btab ' + className).trim()
  }, featured ? /*#__PURE__*/React.createElement("span", {
    className: "lq-btab__dot"
  }) : null, name);
}
Object.assign(__ds_scope, { BrandTab });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/BrandTab.jsx", error: String((e && e.message) || e) }); }

// components/commerce/RollingNumber.jsx
try { (() => {
/**
 * A figure that counts rather than swaps: when the value changes the new one rolls
 * in from the direction it moved (up when it grew, down when it shrank) while the
 * old one leaves the other side. Used by QuantityStepper and by Money on any total
 * that recalculates in front of the shopper.
 */
function RollingNumber({
  value,
  format,
  className = '',
  style
}) {
  const [prev, setPrev] = React.useState(null);
  const [dir, setDir] = React.useState(null);
  const last = React.useRef(value);
  React.useEffect(() => {
    if (value === last.current) return;
    const grew = Number(value) > Number(last.current);
    setPrev(last.current);
    setDir(grew ? 'up' : 'down');
    last.current = value;
    const t = setTimeout(() => {
      setPrev(null);
      setDir(null);
    }, 280);
    return () => clearTimeout(t);
  }, [value]);
  const show = v => format ? format(v) : v;
  return /*#__PURE__*/React.createElement("span", {
    className: ('lq-roll ' + className).trim(),
    "data-dir": dir || undefined,
    style: style
  }, prev !== null ? /*#__PURE__*/React.createElement("span", {
    className: "lq-roll__v lq-roll__v--out",
    "aria-hidden": "true"
  }, show(prev)) : null, /*#__PURE__*/React.createElement("span", {
    className: "lq-roll__v",
    key: String(value),
    "aria-live": "polite"
  }, show(value)));
}
Object.assign(__ds_scope, { RollingNumber });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/RollingNumber.jsx", error: String((e && e.message) || e) }); }

// components/commerce/Money.jsx
try { (() => {
const fmt = (n, decimals) => Number(n).toLocaleString('en-US', {
  minimumFractionDigits: decimals ? 2 : 0,
  maximumFractionDigits: decimals ? 2 : 0
});

/**
 * Every figure a shopper compares. Latin digits always — Egyptian shoppers read
 * money in Latin numerals even when the rest of the screen is Arabic.
 */
function Money({
  amount,
  lang = 'ar',
  size = 'md',
  tone,
  strike = false,
  decimals = false,
  roll = false,
  className = ''
}) {
  const px = {
    sm: 'var(--text-sm)',
    md: 'var(--text-base)',
    lg: 'var(--text-xl)',
    xl: 'var(--text-2xl)'
  }[size];
  const cur = lang === 'ar' ? 'ج.م' : 'EGP';
  const cls = ['lq-money', strike && 'lq-money--strike', tone && 'lq-money--' + tone, className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("span", {
    className: cls,
    style: {
      fontSize: px
    },
    dir: lang === 'en' ? 'ltr' : undefined,
    "data-num": true
  }, lang === 'ar' ? null : /*#__PURE__*/React.createElement("span", {
    className: "lq-money__cur",
    style: {
      marginInlineStart: 0,
      marginInlineEnd: '0.35em'
    }
  }, cur), roll ? /*#__PURE__*/React.createElement(__ds_scope.RollingNumber, {
    value: amount,
    format: n => fmt(n, decimals)
  }) : fmt(amount, decimals), lang === 'ar' ? /*#__PURE__*/React.createElement("span", {
    className: "lq-money__cur"
  }, cur) : null);
}
Object.assign(__ds_scope, { Money });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/Money.jsx", error: String((e && e.message) || e) }); }

// components/commerce/StatusPill.jsx
try { (() => {
/**
 * The shopper-facing half of the order state machine. Twenty-odd backend enum
 * values collapse into the six house tones; the label says what is happening in
 * the world, not what the enum is called.
 */
const StatusTones = {
  PENDING_PAYMENT: {
    tone: 'wait',
    ar: 'في انتظار الدفع',
    en: 'Waiting for payment'
  },
  PENDING_VERIFICATION: {
    tone: 'wait',
    ar: 'تأكيد الرقم',
    en: 'Verify your number'
  },
  PENDING_BRAND: {
    tone: 'wait',
    ar: 'المحل بيراجع الرف',
    en: 'Shop checking the shelf'
  },
  CONFIRMED: {
    tone: 'live',
    ar: 'تم التأكيد',
    en: 'Confirmed'
  },
  PACKED: {
    tone: 'live',
    ar: 'اتجهّز',
    en: 'Packed'
  },
  HANDED_OVER: {
    tone: 'live',
    ar: 'مع المندوب',
    en: 'With the rider'
  },
  DELIVERED: {
    tone: 'good',
    ar: 'تم التسليم',
    en: 'Delivered'
  },
  DELIVERY_FAILED: {
    tone: 'bad',
    ar: 'التسليم فشل',
    en: 'Delivery failed'
  },
  RETURN_REQUESTED: {
    tone: 'wait',
    ar: 'طلب استرجاع',
    en: 'Return requested'
  },
  RETURNED: {
    tone: 'neutral',
    ar: 'رجع',
    en: 'Returned'
  },
  CANCELLED: {
    tone: 'neutral',
    ar: 'اتلغى',
    en: 'Cancelled'
  },
  REFUNDED: {
    tone: 'neutral',
    ar: 'اترجع الفلوس',
    en: 'Refunded'
  },
  QUEUED: {
    tone: 'wait',
    ar: 'بيتجهّز',
    en: 'Generating'
  },
  READY: {
    tone: 'good',
    ar: 'جاهز',
    en: 'Ready'
  },
  FAILED: {
    tone: 'bad',
    ar: 'مانفعش',
    en: 'Failed'
  }
};
function StatusPill({
  status,
  lang = 'ar',
  label,
  tone,
  dot = true,
  className = ''
}) {
  const m = StatusTones[status] || {
    tone: 'neutral',
    ar: status,
    en: status
  };
  return /*#__PURE__*/React.createElement("span", {
    className: ('lq-pill ' + className).trim(),
    "data-tone": tone || m.tone
  }, dot ? /*#__PURE__*/React.createElement("span", {
    className: "lq-pill__dot"
  }) : null, label || (lang === 'ar' ? m.ar : m.en));
}
Object.assign(__ds_scope, { StatusTones, StatusPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/StatusPill.jsx", error: String((e && e.message) || e) }); }

// components/commerce/VariantPicker.jsx
try { (() => {
/**
 * Size chips or colour swatches. Sold-out options are visibly unavailable and
 * never removed — availability is stockOnHand minus live reservations.
 */
function VariantPicker({
  label,
  aside,
  kind = 'size',
  options = [],
  value,
  onChange,
  className = ''
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: ('lq-vp ' + className).trim()
  }, /*#__PURE__*/React.createElement("div", {
    className: "lq-vp__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lq-vp__label"
  }, label), aside ? /*#__PURE__*/React.createElement("span", {
    className: "lq-vp__aside"
  }, aside) : null), /*#__PURE__*/React.createElement("div", {
    className: "lq-vp__row",
    role: "group",
    "aria-label": label
  }, options.map(o => kind === 'colour' ? /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    className: "lq-swatch",
    "aria-label": o.label,
    "aria-pressed": value === o.value,
    "data-out": o.soldOut ? 'true' : undefined,
    disabled: o.soldOut,
    onClick: () => onChange && onChange(o.value)
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      background: o.swatch
    }
  })) : /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    className: "lq-chip",
    "aria-pressed": value === o.value,
    "data-out": o.soldOut ? 'true' : undefined,
    disabled: o.soldOut,
    onClick: () => onChange && onChange(o.value)
  }, o.label))));
}
Object.assign(__ds_scope, { VariantPicker });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/VariantPicker.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
/** Small uppercase marker. Count badges are mono digits on --destructive. */
function Badge({
  children,
  tone = 'neutral',
  className = ''
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: ['lq-badge', 'lq-badge--' + tone, className].filter(Boolean).join(' ')
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** 1px border + --shadow-xs. A shadow bigger than that means it floats and will go away. */
function Card({
  children,
  pad = true,
  flat = false,
  as = 'div',
  href,
  className = '',
  ...rest
}) {
  const Tag = href ? 'a' : as;
  const cls = ['lq-card', pad && 'lq-card--pad', flat && 'lq-card--flat', href && 'lq-card--link', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls,
    href: href
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Lucide glyph as a CSS mask, so it inherits currentColor. */
function Icon({
  name,
  size = 16,
  className = '',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    "aria-hidden": "true",
    "data-icon": name,
    className: ('lq-icon ' + className).trim(),
    style: {
      fontSize: typeof size === 'number' ? size + 'px' : size,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/chat/ChatBubble.jsx
try { (() => {
/**
 * One message between a shopper and a shop. The shopper's own messages are the
 * brand emerald; the shop's are a bordered card. A `note` bubble is the system
 * speaking — an order reference, a price change — and is never attributed to either.
 */
function ChatBubble({
  from = 'them',
  children,
  time,
  status,
  className = ''
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: ['lq-bub', 'lq-bub--' + from, className].filter(Boolean).join(' ')
  }, /*#__PURE__*/React.createElement("span", null, children), time || status ? /*#__PURE__*/React.createElement("span", {
    className: "lq-bub__meta"
  }, time, status === 'sent' ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 11,
    style: {
      marginInlineStart: 4
    }
  }) : null, status === 'read' ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "circle-check",
    size: 11,
    style: {
      marginInlineStart: 4
    }
  }) : null) : null);
}
Object.assign(__ds_scope, { ChatBubble });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/chat/ChatBubble.jsx", error: String((e && e.message) || e) }); }

// components/commerce/PaymentOption.jsx
try { (() => {
/** Card, wallet, Valu, cash on delivery. One radio row each, 52px. */
function PaymentOption({
  icon,
  title,
  note,
  checked = false,
  onSelect,
  className = ''
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "radio",
    "aria-checked": checked,
    onClick: onSelect,
    className: ('lq-pay ' + className).trim()
  }, /*#__PURE__*/React.createElement("span", {
    className: "lq-pay__radio"
  }), icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 20,
    style: {
      color: 'var(--text-muted)'
    }
  }) : null, /*#__PURE__*/React.createElement("span", {
    className: "lq-pay__body"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lq-pay__title"
  }, title), note ? /*#__PURE__*/React.createElement("span", {
    className: "lq-pay__note",
    style: {
      display: 'block'
    }
  }, note) : null));
}
Object.assign(__ds_scope, { PaymentOption });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/PaymentOption.jsx", error: String((e && e.message) || e) }); }

// components/commerce/QuantityStepper.jsx
try { (() => {
/** Minus / count / plus. The count rolls in the direction it moved. Bounded by what the shelf actually has. */
function QuantityStepper({
  value = 1,
  min = 1,
  max = 99,
  onChange,
  lang = 'ar',
  className = ''
}) {
  const set = n => onChange && onChange(Math.min(max, Math.max(min, n)));
  return /*#__PURE__*/React.createElement("div", {
    className: ('lq-qty ' + className).trim()
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": lang === 'ar' ? 'أقل' : 'Decrease',
    disabled: value <= min,
    onClick: () => set(value - 1)
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "minus",
    size: 16
  })), /*#__PURE__*/React.createElement(__ds_scope.RollingNumber, {
    value: value,
    className: "lq-qty__n"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": lang === 'ar' ? 'أكتر' : 'Increase',
    disabled: value >= max,
    onClick: () => set(value + 1)
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "plus",
    size: 16
  })));
}
Object.assign(__ds_scope, { QuantityStepper });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/QuantityStepper.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Ripple + 0.985 press is the house feedback: on a mid-range Android the tap
 * has to acknowledge itself before the network answers.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  icon,
  iconEnd,
  disabled = false,
  type = 'button',
  as = 'button',
  className = '',
  onClick,
  ...rest
}) {
  const [ripples, setRipples] = React.useState([]);
  const press = e => {
    const el = e.currentTarget.getBoundingClientRect();
    const d = Math.max(el.width, el.height) * 2;
    const r = {
      id: Date.now() + Math.random(),
      d,
      x: e.clientX - el.left - d / 2,
      y: e.clientY - el.top - d / 2
    };
    setRipples(rs => rs.concat(r));
    setTimeout(() => setRipples(rs => rs.filter(x => x.id !== r.id)), 520);
  };
  const Tag = as;
  const cls = ['lq-btn', 'lq-btn--' + variant, size !== 'md' && 'lq-btn--' + size, block && 'lq-btn--block', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls,
    type: as === 'button' ? type : undefined,
    disabled: as === 'button' ? disabled : undefined,
    "aria-disabled": disabled || undefined,
    onPointerDown: press,
    onClick: onClick
  }, rest), icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === 'lg' ? 18 : 16
  }) : null, children, iconEnd ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconEnd,
    size: size === 'lg' ? 18 : 16
  }) : null, ripples.map(r => /*#__PURE__*/React.createElement("span", {
    key: r.id,
    className: "lq-ripple",
    style: {
      width: r.d,
      height: r.d,
      left: r.x,
      top: r.y
    }
  })));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Checkbox.jsx
try { (() => {
/** Tick scales in; the box squashes to 0.9 while held. */
function Checkbox({
  checked = false,
  onChange,
  children,
  disabled = false,
  className = ''
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: ('lq-check ' + className).trim(),
    style: disabled ? {
      opacity: 0.5
    } : undefined
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: 'absolute',
      opacity: 0,
      inlineSize: 1,
      blockSize: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "lq-check__box",
    "data-checked": checked ? 'true' : 'false'
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 14
  })), /*#__PURE__*/React.createElement("span", {
    className: "lq-check__text"
  }, children));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** A 44px tap target with nothing but a glyph. Always needs an aria-label. */
function IconButton({
  icon,
  label,
  size = 18,
  variant = 'plain',
  className = '',
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    className: ['lq-iconbtn', variant !== 'plain' && 'lq-iconbtn--' + variant, className].filter(Boolean).join(' ')
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/commerce/CartLine.jsx
try { (() => {
/** One item in the bag. The cart groups these by brand: shipping is per shop. */
function CartLine({
  name,
  brand,
  variant,
  price,
  qty = 1,
  max = 99,
  img,
  lang = 'ar',
  onQty,
  onRemove,
  note,
  className = ''
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: ('lq-line ' + className).trim()
  }, /*#__PURE__*/React.createElement("div", {
    className: "lq-line__well"
  }, img ? /*#__PURE__*/React.createElement("img", {
    src: img,
    alt: ""
  }) : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "image",
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minInlineSize: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lq-line__name"
  }, name), /*#__PURE__*/React.createElement("div", {
    className: "lq-line__meta"
  }, [brand, variant].filter(Boolean).join(' · ')), note ? /*#__PURE__*/React.createElement("div", {
    className: "lq-line__meta",
    style: {
      color: 'var(--state-wait-fg)'
    }
  }, note) : null, /*#__PURE__*/React.createElement("div", {
    className: "lq-line__foot"
  }, onQty ? /*#__PURE__*/React.createElement(__ds_scope.QuantityStepper, {
    value: qty,
    max: max,
    onChange: onQty,
    lang: lang
  }) : null, onRemove ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "trash-2",
    size: 16,
    label: lang === 'ar' ? 'شيل' : 'Remove',
    onClick: onRemove
  }) : null)), /*#__PURE__*/React.createElement("div", {
    className: "lq-line__end"
  }, /*#__PURE__*/React.createElement(__ds_scope.Money, {
    amount: price * qty,
    lang: lang,
    roll: true
  })));
}
Object.assign(__ds_scope, { CartLine });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/CartLine.jsx", error: String((e && e.message) || e) }); }

// components/commerce/ProductCard.jsx
try { (() => {
/**
 * The grid unit of the storefront. A 3:4 photo well, brand line, name, price.
 * With no image it renders the --surface-sunken tile and a Lucide image glyph —
 * no invented photography anywhere in this system.
 */
function ProductCard({
  name,
  brand,
  price,
  was,
  img,
  href = '#',
  lang = 'ar',
  badge,
  tryOn = false,
  soldOut = false,
  soldOutLabel,
  favorite = false,
  onFavorite,
  onClick,
  className = ''
}) {
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    onClick: onClick,
    className: ('lq-pcard ' + className).trim()
  }, /*#__PURE__*/React.createElement("div", {
    className: "lq-pcard__well"
  }, img ? /*#__PURE__*/React.createElement("img", {
    src: img,
    alt: ""
  }) : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "image",
    size: 28,
    className: "lq-pcard__ph"
  }), badge ? /*#__PURE__*/React.createElement("span", {
    className: "lq-pcard__tag"
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "ink"
  }, badge)) : null, tryOn && !badge ? /*#__PURE__*/React.createElement("span", {
    className: "lq-pcard__tag"
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "tint"
  }, lang === 'ar' ? 'جرّبه' : 'Try on')) : null, onFavorite ? /*#__PURE__*/React.createElement("span", {
    className: "lq-pcard__fav"
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "heart",
    size: 16,
    variant: "ink",
    label: lang === 'ar' ? 'حفظ' : 'Save',
    style: favorite ? {
      color: 'var(--destructive)'
    } : undefined,
    onClick: e => {
      e.preventDefault();
      onFavorite();
    }
  })) : null, soldOut ? /*#__PURE__*/React.createElement("span", {
    className: "lq-pcard__out"
  }, soldOutLabel || (lang === 'ar' ? 'خلص' : 'Sold out')) : null), /*#__PURE__*/React.createElement("span", {
    className: "lq-pcard__brand"
  }, brand), /*#__PURE__*/React.createElement("span", {
    className: "lq-pcard__name"
  }, name), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Money, {
    amount: price,
    lang: lang
  }), was ? /*#__PURE__*/React.createElement(__ds_scope.Money, {
    amount: was,
    lang: lang,
    size: "sm",
    strike: true
  }) : null));
}
Object.assign(__ds_scope, { ProductCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/ProductCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Labelled text field. The hint slot doubles as the error line. */
function Input({
  label,
  hint,
  error,
  icon,
  required = false,
  id,
  className = '',
  ...rest
}) {
  const uid = React.useId();
  const fid = id || uid;
  return /*#__PURE__*/React.createElement("div", {
    className: ('lq-field ' + className).trim()
  }, label ? /*#__PURE__*/React.createElement("label", {
    className: "lq-label",
    htmlFor: fid
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    className: "lq-label__req"
  }, " *") : null) : null, /*#__PURE__*/React.createElement("div", {
    className: 'lq-inputwrap' + (icon ? ' lq-inputwrap--icon' : '')
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18
  }) : null, /*#__PURE__*/React.createElement("input", _extends({
    id: fid,
    className: "lq-input",
    "aria-invalid": error ? 'true' : undefined,
    "aria-describedby": error || hint ? fid + '-h' : undefined
  }, rest))), error || hint ? /*#__PURE__*/React.createElement("span", {
    id: fid + '-h',
    className: 'lq-hint' + (error ? ' lq-hint--error' : '')
  }, error || hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/Select.jsx
try { (() => {
/**
 * Trigger + popover listbox, shaped like shadcn/ui's Select. There is deliberately
 * no native <select> in this system: the OS wheel cannot be styled, cannot carry a
 * second line of Arabic, and looks like a different product on every Android skin.
 * Keyboard: ArrowUp/Down to move, Enter or Space to choose, Escape to close.
 */
function Select({
  label,
  hint,
  error,
  options = [],
  value,
  placeholder,
  onChange,
  required = false,
  disabled = false,
  id,
  className = ''
}) {
  const uid = React.useId();
  const fid = id || uid;
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const wrap = React.useRef(null);
  const selected = options.find(o => o.value === value);
  React.useEffect(() => {
    if (!open) return;
    const away = e => {
      if (wrap.current && !wrap.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);
  const pick = o => {
    if (o.disabled) return;
    onChange && onChange(o.value);
    setOpen(false);
  };
  const key = e => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(options.findIndex(o => o.value === value));
        return;
      }
      const step = e.key === 'ArrowDown' ? 1 : -1;
      let i = active;
      for (let n = 0; n < options.length; n++) {
        i = (i + step + options.length) % options.length;
        if (!options[i].disabled) break;
      }
      setActive(i);
    }
    if (open && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      if (options[active]) pick(options[active]);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: ('lq-field ' + className).trim()
  }, label ? /*#__PURE__*/React.createElement("label", {
    className: "lq-label",
    htmlFor: fid
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    className: "lq-label__req"
  }, " *") : null) : null, /*#__PURE__*/React.createElement("div", {
    className: "lq-selwrap",
    ref: wrap
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    id: fid,
    className: "lq-seltrigger",
    disabled: disabled,
    "aria-haspopup": "listbox",
    "aria-expanded": open,
    "aria-invalid": error ? 'true' : undefined,
    "data-placeholder": selected ? undefined : 'true',
    onClick: () => {
      setOpen(!open);
      setActive(options.findIndex(o => o.value === value));
    },
    onKeyDown: key
  }, /*#__PURE__*/React.createElement("span", {
    className: "lq-seltrigger__val"
  }, selected ? selected.label : placeholder || ''), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 18
  })), open ? /*#__PURE__*/React.createElement("div", {
    className: "lq-selpanel",
    role: "listbox",
    "aria-labelledby": fid
  }, options.map((o, i) => o.group ? /*#__PURE__*/React.createElement("div", {
    key: 'g' + i,
    className: "lq-selgroup"
  }, o.group) : /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "option",
    className: "lq-selitem",
    "aria-selected": o.value === value,
    "data-active": i === active ? 'true' : undefined,
    disabled: o.disabled,
    onMouseEnter: () => setActive(i),
    onClick: () => pick(o)
  }, /*#__PURE__*/React.createElement("span", null, o.label), o.note ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, o.note) : null, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 16,
    className: "lq-selitem__tick"
  })))) : null), error || hint ? /*#__PURE__*/React.createElement("span", {
    className: 'lq-hint' + (error ? ' lq-hint--error' : '')
  }, error || hint) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Select.jsx", error: String((e && e.message) || e) }); }

// components/core/Skeleton.jsx
try { (() => {
/** One of only two looping animations in the system. */
function Skeleton({
  w = '100%',
  h = 16,
  radius,
  className = '',
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: ('lq-skel ' + className).trim(),
    "aria-hidden": "true",
    style: {
      display: 'block',
      inlineSize: w,
      blockSize: typeof h === 'number' ? h + 'px' : h,
      borderRadius: radius,
      ...style
    }
  });
}
Object.assign(__ds_scope, { Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/core/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Multi-line field. Same label/hint contract as Input. */
function Textarea({
  label,
  hint,
  error,
  required = false,
  id,
  className = '',
  ...rest
}) {
  const uid = React.useId();
  const fid = id || uid;
  return /*#__PURE__*/React.createElement("div", {
    className: ('lq-field ' + className).trim()
  }, label ? /*#__PURE__*/React.createElement("label", {
    className: "lq-label",
    htmlFor: fid
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    className: "lq-label__req"
  }, " *") : null) : null, /*#__PURE__*/React.createElement("textarea", _extends({
    id: fid,
    className: "lq-textarea",
    "aria-invalid": error ? 'true' : undefined
  }, rest)), error || hint ? /*#__PURE__*/React.createElement("span", {
    className: 'lq-hint' + (error ? ' lq-hint--error' : '')
  }, error || hint) : null);
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/BottomTabBar.jsx
try { (() => {
/** Five destinations, labels always visible. Icon-only navigation fails in a second language. */
function BottomTabBar({
  items = [],
  value,
  onChange,
  className = ''
}) {
  return /*#__PURE__*/React.createElement("nav", {
    className: ('lq-tabbar ' + className).trim()
  }, items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.id,
    type: "button",
    className: "lq-tab",
    "aria-current": value === it.id ? 'page' : undefined,
    onClick: () => onChange && onChange(it.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "lq-tab__wrap"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: it.icon,
    size: 20
  }), it.count ? /*#__PURE__*/React.createElement("span", {
    className: "lq-tab__badge"
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "count"
  }, it.count)) : null), it.label)));
}
Object.assign(__ds_scope, { BottomTabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/BottomTabBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/CategoryTabs.jsx
try { (() => {
/** Horizontally scrolling filter row. Categories belong to one shop, not the platform. */
function CategoryTabs({
  items = [],
  value,
  onChange,
  className = ''
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: ('lq-cats ' + className).trim(),
    role: "tablist"
  }, items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.id,
    type: "button",
    role: "tab",
    className: "lq-cat",
    "aria-selected": value === it.id,
    onClick: () => onChange && onChange(it.id)
  }, it.label)));
}
Object.assign(__ds_scope, { CategoryTabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/CategoryTabs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SearchField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Search runs across every shop — a marketplace, not a set of separate shops. */
function SearchField({
  value = '',
  onChange,
  onClear,
  placeholder,
  lang = 'ar',
  className = '',
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: ('lq-search ' + className).trim()
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 18
  }), /*#__PURE__*/React.createElement("input", _extends({
    type: "search",
    value: value,
    placeholder: placeholder || (lang === 'ar' ? 'ابحث في كل المحلات' : 'Search every shop'),
    onChange: e => onChange && onChange(e.target.value)
  }, rest)), value && onClear ? /*#__PURE__*/React.createElement("span", {
    className: "lq-search__clear"
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "x",
    size: 16,
    label: lang === 'ar' ? 'امسح' : 'Clear',
    onClick: onClear
  })) : null);
}
Object.assign(__ds_scope, { SearchField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SearchField.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TopBar.jsx
try { (() => {
/**
 * 56px sticky bar over an 92%-white blur. Either the wordmark (home) or a back
 * arrow and a centred title (everywhere else) — never both.
 */
function TopBar({
  title,
  mark,
  onBack,
  actions,
  lang = 'ar',
  className = ''
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: ('lq-topbar ' + className).trim()
  }, onBack ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "arrow-left",
    label: lang === 'ar' ? 'رجوع' : 'Back',
    onClick: onBack
  }) : null, mark ? /*#__PURE__*/React.createElement("span", {
    className: "lq-topbar__mark",
    style: {
      paddingInlineStart: 'var(--space-3)',
      flex: 1
    }
  }, mark) : null, !mark ? /*#__PURE__*/React.createElement("span", {
    className: 'lq-topbar__title' + (onBack ? '' : ' lq-topbar__title--start')
  }, title) : null, /*#__PURE__*/React.createElement("span", {
    className: "lq-topbar__end"
  }, actions));
}
Object.assign(__ds_scope, { TopBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TopBar.jsx", error: String((e && e.message) || e) }); }

// components/overlays/ActionBar.jsx
try { (() => {
/** The sticky buy bar. 88% white, 10px blur, 52px action — the primary action lives in thumb reach. */
function ActionBar({
  label,
  value,
  children,
  className = ''
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: ('lq-actionbar ' + className).trim()
  }, label || value ? /*#__PURE__*/React.createElement("div", {
    className: "lq-actionbar__info"
  }, label ? /*#__PURE__*/React.createElement("span", {
    className: "lq-actionbar__label"
  }, label) : null, value) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      gap: 'var(--space-2)'
    }
  }, children));
}
Object.assign(__ds_scope, { ActionBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/ActionBar.jsx", error: String((e && e.message) || e) }); }

// components/overlays/Sheet.jsx
try { (() => {
/**
 * The only overlay in the system: a bottom sheet. There is no centred modal on
 * the storefront. It animates out as well as in, so it never vanishes on a frame.
 */
function Sheet({
  open,
  title,
  children,
  onClose,
  lang = 'ar',
  footer,
  className = ''
}) {
  const [alive, setAlive] = React.useState(open);
  React.useEffect(() => {
    if (open) setAlive(true);else if (alive) {
      const t = setTimeout(() => setAlive(false), 180);
      return () => clearTimeout(t);
    }
  }, [open, alive]);
  if (!alive) return null;
  const state = open ? 'open' : 'closed';
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "lq-sheet__ov",
    "data-state": state,
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: ('lq-sheet ' + className).trim(),
    "data-state": state,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": title
  }, /*#__PURE__*/React.createElement("span", {
    className: "lq-sheet__grab"
  }), /*#__PURE__*/React.createElement("div", {
    className: "lq-sheet__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lq-sheet__title"
  }, title), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "x",
    size: 18,
    label: lang === 'ar' ? 'إغلاق' : 'Close',
    onClick: onClose
  })), /*#__PURE__*/React.createElement("div", {
    className: "lq-sheet__body"
  }, children), footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-4)',
      borderBlockStart: '1px solid var(--line)'
    }
  }, footer) : null));
}
Object.assign(__ds_scope, { Sheet });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/Sheet.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ds-loader.js
try { (() => {
/* Boots a UI kit. Loads the compiled _ds_bundle.js when it exists; falls back to
   transpiling the component sources directly, so a kit still runs in a freshly
   authored system before the first compile.

   Screens are plain .js files holding JSX with no import/export — this loader
   transpiles them, so the extension is free, and .js keeps them out of the design
   system's own compile (every .jsx in the project is picked up as a component).
   Nothing in a screen file mounts itself; the page does that once bootKit resolves. */
(function () {
  var NS = 'LoqalStorefrontDesignSystem_ba3098';
  var PATHS = ["core/Icon", "core/Button", "core/IconButton", "core/Input", "core/Textarea", "core/Select", "core/Checkbox", "core/Badge", "core/Card", "core/Skeleton", "commerce/RollingNumber", "commerce/Money", "commerce/ProductCard", "commerce/BrandTab", "commerce/VariantPicker", "commerce/QuantityStepper", "commerce/StatusPill", "commerce/CartLine", "commerce/PaymentOption", "navigation/TopBar", "navigation/BottomTabBar", "navigation/SearchField", "navigation/CategoryTabs", "chat/ChatBubble", "overlays/Sheet", "overlays/ActionBar"];
  var NAMES = ["Icon", "Button", "IconButton", "Input", "Textarea", "Select", "Checkbox", "Badge", "Card", "Skeleton", "RollingNumber", "Money", "ProductCard", "BrandTab", "VariantPicker", "QuantityStepper", "StatusPill", "CartLine", "PaymentOption", "TopBar", "BottomTabBar", "SearchField", "CategoryTabs", "ChatBubble", "Sheet", "ActionBar"];
  function strip(t) {
    return t.replace(/^import[^\n]*\n/gm, '').replace(/^export /gm, '');
  }
  function loadBundle(base) {
    return new Promise(function (res) {
      var s = document.createElement('script');
      s.src = base + '/_ds_bundle.js';
      s.onload = function () {
        res(complete());
      };
      s.onerror = function () {
        res(false);
      };
      document.head.appendChild(s);
    });
  }
  /* A bundle that predates the components this kit uses is worse than no bundle:
     it resolves, and then a screen renders <undefined />. So the bundle only counts
     if every name the kit needs is actually on it. */
  function complete() {
    var ns = window[NS];
    if (!ns) return false;
    for (var i = 0; i < NAMES.length; i++) if (!ns[NAMES[i]]) return false;
    return true;
  }
  async function fromSource(base) {
    var src = '';
    for (var i = 0; i < PATHS.length; i++) {
      src += strip(await (await fetch(base + '/components/' + PATHS[i] + '.jsx')).text()) + '\n';
    }
    src += 'window.' + NS + '={' + NAMES.concat(['StatusTones']).join(',') + '};';
    new Function(Babel.transform(src, {
      presets: ['react']
    }).code)();
    return window[NS];
  }
  window.bootKit = async function (base, files) {
    var ds = (await loadBundle(base)) ? window[NS] : await fromSource(base);
    /* Hand the kit a mount node nothing else has touched. A previously compiled
       bundle may itself have mounted something into #root (and may have thrown
       doing it); swapping in a fresh node with the same id detaches that React
       root instead of fighting it. */
    var old = document.getElementById('root');
    if (old) old.parentNode.replaceChild(old.cloneNode(false), old);
    var src = 'const {' + NAMES.concat(['StatusTones']).join(',') + '} = window.' + NS + ';\n';
    var names = [];
    for (var i = 0; i < files.length; i++) {
      var text = strip(await (await fetch(files[i])).text());
      /* Hoist every screen's top-level function onto window so sibling screens and
         the page's own mount can see each other without a module system. */
      var m = text.match(/^(?:function|const|let|var)\s+([A-Za-z_$][\w$]*)/gm) || [];
      for (var j = 0; j < m.length; j++) names.push(m[j].split(/\s+/)[1]);
      src += text + '\n';
    }
    if (names.length) src += 'Object.assign(window,{' + names.join(',') + '});';
    new Function(Babel.transform(src, {
      presets: ['react']
    }).code)();
    return ds;
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ds-loader.js", error: String((e && e.message) || e) }); }

// ui_kits/storefront/account-screen.js
try { (() => {
/* US-SHOP-018 plus the try-on allowance. A guest is a first-class state here: no
   account is required to buy, so the screen offers one instead of demanding it. */
function AccountScreen({
  onChat
}) {
  const [lang, setLang] = React.useState('ar');
  const rows = [{
    icon: 'package',
    label: 'أوردراتي',
    note: '4 أوردرات'
  }, {
    icon: 'map-pin',
    label: 'عناويني',
    note: 'مصر الجديدة · المعادي'
  }, {
    icon: 'heart',
    label: 'المحفوظات',
    note: '7 قطع'
  }, {
    icon: 'scan-face',
    label: 'صور القياس الافتراضي',
    note: 'فاضلك 9 من 10'
  }, {
    icon: 'message-circle',
    label: 'محادثاتي مع المحلات',
    note: 'رسالة واحدة جديدة',
    go: true
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "lq-pad",
    style: {
      display: 'grid',
      gap: 'var(--space-4)',
      paddingBlock: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      inlineSize: 44,
      blockSize: 44,
      borderRadius: 'var(--radius-full)',
      background: 'var(--brand-tint)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "user",
    size: 20,
    style: {
      color: 'var(--state-good-fg)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-title)'
    }
  }, "\u0628\u062A\u0634\u062A\u0631\u064A \u0643\u0636\u064A\u0641"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\u0623\u0648\u0631\u062F\u0631\u0627\u062A\u0643 \u0645\u062D\u0641\u0648\u0638\u0629 \u0639\u0644\u0649 \u0625\u064A\u0645\u064A\u0644\u0643 \u0648\u0631\u0642\u0645\u0643."))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBlockStart: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    block: true
  }, "\u0627\u0639\u0645\u0644 \u062D\u0633\u0627\u0628 \u2014 \u0623\u0648\u0631\u062F\u0631\u0627\u062A\u0643 \u0627\u0644\u0642\u062F\u064A\u0645\u0629 \u062A\u062A\u0646\u0642\u0644 \u0645\u0639\u0627\u0643"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-2)'
    }
  }, rows.map(r => /*#__PURE__*/React.createElement(Card, {
    key: r.label,
    href: "#",
    onClick: e => {
      e.preventDefault();
      if (r.go && onChat) onChat();
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: r.icon,
    size: 18,
    style: {
      color: 'var(--text-muted)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      color: 'var(--text-title)'
    }
  }, r.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, r.note), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 16,
    style: {
      color: 'var(--text-muted)'
    }
  }))))), /*#__PURE__*/React.createElement(Select, {
    label: "\u0627\u0644\u0644\u063A\u0629 \xB7 Language",
    value: lang,
    onChange: setLang,
    options: [{
      value: 'ar',
      label: 'العربية'
    }, {
      value: 'en',
      label: 'English'
    }]
  }), /*#__PURE__*/React.createElement(Card, {
    flat: true,
    style: {
      background: 'var(--surface-sunken)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-3)',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "phone",
    size: 18,
    style: {
      color: 'var(--text-muted)',
      marginBlockStart: 2
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)'
    }
  }, "\u0623\u064A \u0645\u0634\u0643\u0644\u0629 \u0641\u064A \u0623\u0648\u0631\u062F\u0631\u060C \u0643\u0644\u0651\u0645\u0646\u0627 \u0639\u0644\u0649 ", /*#__PURE__*/React.createElement("span", {
    "data-num": true,
    dir: "ltr"
  }, "0155 995 9890"), "."))));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/account-screen.js", error: String((e && e.message) || e) }); }

// ui_kits/storefront/bag-screen.js
try { (() => {
/* US-SHOP-007: one basket, several shops. Grouped by brand because shipping and
   fulfilment are per shop, and each shop's half moves at its own pace. */
function BagScreen({
  lines,
  onQty,
  onRemove,
  onCheckout
}) {
  const groups = {};
  lines.forEach(l => {
    (groups[l.brand] = groups[l.brand] || []).push(l);
  });
  const goods = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const ship = Object.keys(groups).length * 45;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "lq-pad",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      paddingBlock: 'var(--space-4)'
    }
  }, Object.keys(groups).length === 0 ? /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8,
      placeItems: 'center',
      paddingBlock: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shopping-bag",
    size: 20,
    style: {
      color: 'var(--text-muted)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\u0627\u0644\u062D\u0627\u062C\u0627\u062A \u0627\u0644\u0644\u064A \u062A\u062E\u062A\u0627\u0631\u0647\u0627 \u0645\u0646 \u0623\u064A \u0645\u062D\u0644 \u062A\u0638\u0647\u0631 \u0647\u0646\u0627."))) : null, Object.entries(groups).map(([brand, items]) => /*#__PURE__*/React.createElement(Card, {
    key: brand
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      marginBlockEnd: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "store",
    size: 16,
    style: {
      color: 'var(--text-muted)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-title)'
    }
  }, brand), /*#__PURE__*/React.createElement("span", {
    style: {
      marginInlineStart: 'auto',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, "\u062A\u0648\u0635\u064A\u0644 45 \u062C.\u0645")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, items.map(l => /*#__PURE__*/React.createElement(CartLine, {
    key: l.key,
    name: l.name,
    brand: l.brand,
    variant: l.variant,
    price: l.price,
    qty: l.qty,
    max: l.max,
    note: l.note,
    onQty: q => onQty(l.key, q),
    onRemove: () => onRemove(l.key)
  }))))), lines.length ? /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-2)',
      fontSize: 'var(--text-sm)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A"), /*#__PURE__*/React.createElement(Money, {
    amount: goods,
    decimals: true,
    roll: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u0627\u0644\u062A\u0648\u0635\u064A\u0644 (", Object.keys(groups).length, " \u0645\u062D\u0644)"), /*#__PURE__*/React.createElement(Money, {
    amount: ship,
    decimals: true
  })), /*#__PURE__*/React.createElement("hr", {
    className: "lq-rule"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 'var(--text-base)',
      fontWeight: 'var(--weight-semibold)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A"), /*#__PURE__*/React.createElement(Money, {
    amount: goods + ship,
    size: "lg",
    decimals: true,
    roll: true
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, "\u0645\u0635\u0627\u0631\u064A\u0641 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0644\u0643\u0644 \u0645\u062D\u0644 \u0644\u0648\u062D\u062F\u0647 \u2014 \u0627\u0644\u0623\u0648\u0631\u062F\u0631 \u0645\u0646 \u0645\u062D\u0644\u064A\u0646 \u0628\u064A\u062A\u062D\u0633\u0628 \u0645\u0631\u062A\u064A\u0646."))) : null), lines.length ? /*#__PURE__*/React.createElement(ActionBar, {
    label: "\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A",
    value: /*#__PURE__*/React.createElement(Money, {
      amount: goods + ship,
      decimals: true,
      roll: true
    })
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    block: true,
    iconEnd: "arrow-right",
    onClick: onCheckout
  }, "\u0643\u0645\u0651\u0644 \u0627\u0644\u0623\u0648\u0631\u062F\u0631")) : null);
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/bag-screen.js", error: String((e && e.message) || e) }); }

// ui_kits/storefront/chat-screen.js
try { (() => {
/* Chat is a commerce surface: the shop confirms the shelf check here, which is the
   one wait a shopper cannot otherwise explain. The composer never offers a payment
   or an address — those stay on their own screens. */
function ChatScreen() {
  const [draft, setDraft] = React.useState('');
  const msgs = [{
    from: 'note',
    text: 'الأوردر LQ-4821-7730 · قميص كتان · M · بيج'
  }, {
    from: 'them',
    text: 'أهلاً بيك. بنراجع الرف دلوقتي ونرد عليك في دقايق.',
    time: '11:02'
  }, {
    from: 'me',
    text: 'تمام، مستعجل عليه شويّة',
    time: '11:03',
    status: 'read'
  }, {
    from: 'them',
    text: 'القميص موجود مقاس M. أجهزه لك؟',
    time: '11:04'
  }, {
    from: 'me',
    text: 'أيوه، ابعته',
    time: '11:05',
    status: 'read'
  }, {
    from: 'them',
    text: 'اتجهّز. المندوب هيبقى عندك خلال ساعتين.',
    time: '11:06'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      minBlockSize: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lq-pad",
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      paddingBlock: 'var(--space-4)'
    }
  }, msgs.map((m, i) => /*#__PURE__*/React.createElement(ChatBubble, {
    key: i,
    from: m.from,
    time: m.time,
    status: m.status
  }, m.text))), /*#__PURE__*/React.createElement("div", {
    className: "lq-actionbar"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "\u0627\u0643\u062A\u0628 \u0631\u0633\u0627\u0644\u0629",
    value: draft,
    onChange: e => setDraft(e.target.value)
  })), /*#__PURE__*/React.createElement(Button, {
    icon: "send",
    onClick: () => setDraft('')
  }, "\u0627\u0628\u0639\u062A")));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/chat-screen.js", error: String((e && e.message) || e) }); }

// ui_kits/storefront/checkout-screen.js
try { (() => {
/* US-SHOP-009/010/011/012: guest checkout — email, phone, address, no account.
   Card, wallet and Valu go through Paymob; cash on delivery needs an SMS code
   before the order confirms, and the shipping fee is shown per shop before paying. */
function CheckoutScreen({
  total,
  onPlace
}) {
  const [pay, setPay] = React.useState('cod');
  const [gov, setGov] = React.useState('cai');
  const [area, setArea] = React.useState();
  const [save, setSave] = React.useState(true);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "lq-pad",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-5)',
      paddingBlock: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "lq-eyebrow"
  }, "\u0628\u064A\u0627\u0646\u0627\u062A\u0643"), /*#__PURE__*/React.createElement(Input, {
    label: "\u0627\u0644\u0627\u0633\u0645",
    required: true,
    defaultValue: "",
    placeholder: "\u0627\u0633\u0645\u0643"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "\u0631\u0642\u0645 \u0627\u0644\u0645\u0648\u0628\u0627\u064A\u0644",
    required: true,
    inputMode: "tel",
    placeholder: "01xxxxxxxxx",
    hint: "\u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u0628\u064A\u0643\u0644\u0645\u0643 \u0639\u0644\u064A\u0647"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "\u0627\u0644\u0625\u064A\u0645\u064A\u0644",
    required: true,
    inputMode: "email",
    placeholder: "name@mail.com",
    hint: "\u0628\u0646\u0628\u0639\u062A \u0639\u0644\u064A\u0647 \u0631\u0642\u0645 \u0627\u0644\u0623\u0648\u0631\u062F\u0631"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "lq-eyebrow"
  }, "\u0627\u0644\u0639\u0646\u0648\u0627\u0646"), /*#__PURE__*/React.createElement(Select, {
    label: "\u0627\u0644\u0645\u062D\u0627\u0641\u0638\u0629",
    placeholder: "\u0627\u062E\u062A\u0627\u0631 \u0627\u0644\u0645\u062D\u0627\u0641\u0638\u0629",
    value: gov,
    onChange: setGov,
    options: [{
      value: 'cai',
      label: 'القاهرة'
    }, {
      value: 'giz',
      label: 'الجيزة'
    }, {
      value: 'alx',
      label: 'الإسكندرية',
      note: 'يومين'
    }, {
      value: 'dak',
      label: 'الدقهلية',
      note: 'يومين'
    }]
  }), /*#__PURE__*/React.createElement(Select, {
    label: "\u0627\u0644\u0645\u0646\u0637\u0642\u0629",
    placeholder: "\u0627\u062E\u062A\u0627\u0631 \u0627\u0644\u0645\u0646\u0637\u0642\u0629",
    value: area,
    onChange: setArea,
    options: [{
      value: 'nc',
      label: 'مصر الجديدة'
    }, {
      value: 'md',
      label: 'المعادي'
    }, {
      value: 'nz',
      label: 'التجمع الخامس'
    }, {
      value: 'zm',
      label: 'الزمالك'
    }]
  }), /*#__PURE__*/React.createElement(Input, {
    label: "\u0627\u0644\u0634\u0627\u0631\u0639 \u0648\u0627\u0644\u0639\u0645\u0627\u0631\u0629",
    placeholder: "\u0661\u0662 \u0634\u0627\u0631\u0639 \u0628\u063A\u062F\u0627\u062F\u060C \u0627\u0644\u062F\u0648\u0631 \u0663"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    checked: save,
    onChange: setSave
  }, "\u0627\u062D\u0641\u0638 \u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u062F\u0647 \u0644\u0623\u0648\u0631\u062F\u0631\u0627\u062A \u0628\u0639\u062F \u0643\u062F\u0647")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-2)'
    },
    role: "radiogroup",
    "aria-label": "\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u062F\u0641\u0639"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lq-eyebrow"
  }, "\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u062F\u0641\u0639"), /*#__PURE__*/React.createElement(PaymentOption, {
    icon: "banknote",
    title: "\u0643\u0627\u0634 \u0639\u0646\u062F \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645",
    note: "\u0647\u0646\u0628\u0639\u062A\u0644\u0643 \u0643\u0648\u062F \u0639\u0644\u0649 \u0627\u0644\u0645\u0648\u0628\u0627\u064A\u0644 \u0642\u0628\u0644 \u0645\u0627 \u0627\u0644\u0623\u0648\u0631\u062F\u0631 \u064A\u062A\u0623\u0643\u062F",
    checked: pay === 'cod',
    onSelect: () => setPay('cod')
  }), /*#__PURE__*/React.createElement(PaymentOption, {
    icon: "credit-card",
    title: "\u0641\u064A\u0632\u0627 \u0623\u0648 \u0645\u0627\u0633\u062A\u0631\u0643\u0627\u0631\u062F",
    note: "\u0627\u0644\u062D\u0627\u062C\u0629 \u0628\u062A\u062A\u062D\u062C\u0632 \u0644\u0643 \u0648\u0625\u0646\u062A \u0628\u062A\u062F\u0641\u0639",
    checked: pay === 'card',
    onSelect: () => setPay('card')
  }), /*#__PURE__*/React.createElement(PaymentOption, {
    icon: "wallet",
    title: "\u0645\u062D\u0641\u0638\u0629 \u0641\u0648\u062F\u0627\u0641\u0648\u0646 \u0623\u0648 \u0623\u0648\u0631\u0646\u062C",
    checked: pay === 'wallet',
    onSelect: () => setPay('wallet')
  }), /*#__PURE__*/React.createElement(PaymentOption, {
    icon: "ticket-percent",
    title: "Valu \u2014 \u062A\u0642\u0633\u064A\u0637",
    checked: pay === 'valu',
    onSelect: () => setPay('valu')
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-2)',
      fontSize: 'var(--text-sm)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Versattire \xB7 \u062A\u0648\u0635\u064A\u0644"), /*#__PURE__*/React.createElement(Money, {
    amount: 45,
    decimals: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Antikka \xB7 \u062A\u0648\u0635\u064A\u0644"), /*#__PURE__*/React.createElement(Money, {
    amount: 45,
    decimals: true
  })), /*#__PURE__*/React.createElement("hr", {
    className: "lq-rule"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-title)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A"), /*#__PURE__*/React.createElement(Money, {
    amount: total,
    decimals: true
  })))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, "\u0643\u0644 \u0645\u062D\u0644 \u0628\u064A\u062C\u0647\u0651\u0632 \u0646\u0635\u064A\u0628\u0647 \u0644\u0648\u062D\u062F\u0647. \u0644\u0648 \u0645\u062D\u0644 \u062E\u0644\u0651\u0635 \u0642\u0628\u0644 \u0627\u0644\u062A\u0627\u0646\u064A\u060C \u0634\u062D\u0646\u062A\u0647 \u0628\u062A\u062A\u062D\u0631\u0643 \u0645\u0646 \u063A\u064A\u0631 \u0645\u0627 \u062A\u0633\u062A\u0646\u0649 \u0627\u0644\u0628\u0627\u0642\u064A.")), /*#__PURE__*/React.createElement(ActionBar, {
    label: "\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A",
    value: /*#__PURE__*/React.createElement(Money, {
      amount: total,
      decimals: true
    })
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    block: true,
    onClick: onPlace
  }, pay === 'cod' ? 'ابعت الكود وأكّد' : 'ادفع وأكّد')));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/checkout-screen.js", error: String((e && e.message) || e) }); }

// ui_kits/storefront/data.js
try { (() => {
/* Shops and garments are the ones the live join page shows in its ticker; prices
   are that page's prices. Nothing here is invented product copy. */
const BRANDS = ['الكل', 'Versattire', 'Dryp', 'Slack', 'Denjoe', 'Antikka', 'JEN'];
const PRODUCTS = [{
  id: 'p1',
  name: 'قميص كتان',
  en: 'Linen shirt',
  brand: 'Versattire',
  price: 450,
  tryOn: true
}, {
  id: 'p2',
  name: 'تيشيرت أوفرسايز',
  en: 'Oversized tee',
  brand: 'Dryp',
  price: 390,
  was: 450,
  badge: 'جديد'
}, {
  id: 'p3',
  name: 'هودي',
  en: 'Hoodie',
  brand: 'Slack',
  price: 780,
  tryOn: true
}, {
  id: 'p4',
  name: 'جاكيت',
  en: 'Jacket',
  brand: 'Denjoe',
  price: 650,
  soldOut: true
}, {
  id: 'p5',
  name: 'بنطلون جينز',
  en: 'Denim jeans',
  brand: 'Antikka',
  price: 1150
}, {
  id: 'p6',
  name: 'فستان',
  en: 'Dress',
  brand: 'JEN',
  price: 890,
  tryOn: true
}];
const CATEGORIES = [{
  id: 'all',
  label: 'الكل'
}, {
  id: 'sh',
  label: 'قمصان'
}, {
  id: 'te',
  label: 'تيشيرتات'
}, {
  id: 'pa',
  label: 'بنطلونات'
}, {
  id: 'ho',
  label: 'هوديز'
}, {
  id: 'dr',
  label: 'فساتين'
}];
const SIZES = [{
  value: 's',
  label: 'S'
}, {
  value: 'm',
  label: 'M'
}, {
  value: 'l',
  label: 'L'
}, {
  value: 'xl',
  label: 'XL',
  soldOut: true
}];
const COLOURS = [{
  value: 'snd',
  label: 'بيج',
  swatch: '#d9c7a7'
}, {
  value: 'blk',
  label: 'أسود',
  swatch: '#1c1c1c'
}, {
  value: 'olv',
  label: 'زيتي',
  swatch: '#5b6b44',
  soldOut: true
}];
const TABS = [{
  id: 'home',
  label: 'الرئيسية',
  icon: 'house'
}, {
  id: 'search',
  label: 'بحث',
  icon: 'search'
}, {
  id: 'bag',
  label: 'السلة',
  icon: 'shopping-bag'
}, {
  id: 'orders',
  label: 'أوردراتي',
  icon: 'package'
}, {
  id: 'me',
  label: 'حسابي',
  icon: 'user'
}];
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/data.js", error: String((e && e.message) || e) }); }

// ui_kits/storefront/home-screen.js
try { (() => {
/* US-SHOP-001/002/004: every active shop as a tab, products across shops below.
   Featured first, then sortOrder, then newest — the order the API returns. */
function HomeScreen({
  onOpen,
  onSearch
}) {
  const [brand, setBrand] = React.useState('الكل');
  const [cat, setCat] = React.useState('all');
  const list = brand === 'الكل' ? PRODUCTS : PRODUCTS.filter(p => p.brand === brand);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "lq-pad",
    style: {
      paddingBlock: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(SearchField, {
    value: "",
    onChange: onSearch
  })), /*#__PURE__*/React.createElement("div", {
    className: "lq-pad lq-hscroll",
    style: {
      paddingBlockEnd: 'var(--space-3)'
    }
  }, BRANDS.map(b => /*#__PURE__*/React.createElement(BrandTab, {
    key: b,
    name: b,
    selected: brand === b,
    featured: b === 'Versattire' || b === 'JEN',
    onClick: () => setBrand(b)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "lq-pad"
  }, /*#__PURE__*/React.createElement(CategoryTabs, {
    items: CATEGORIES,
    value: cat,
    onChange: setCat
  })), /*#__PURE__*/React.createElement("div", {
    className: "lq-pad lq-sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lq-sec__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lq-sec__title"
  }, brand === 'الكل' ? 'كل المحلات' : brand), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, list.length, " \u0645\u0646\u062A\u062C")), /*#__PURE__*/React.createElement("div", {
    className: "lq-grid2"
  }, list.map(p => /*#__PURE__*/React.createElement(ProductCard, {
    key: p.id,
    brand: p.brand,
    name: p.name,
    price: p.price,
    was: p.was,
    badge: p.badge,
    tryOn: p.tryOn,
    soldOut: p.soldOut,
    onFavorite: () => {},
    href: "#",
    onClick: e => {
      e.preventDefault();
      onOpen(p);
    }
  })))), /*#__PURE__*/React.createElement("div", {
    className: "lq-pad",
    style: {
      paddingBlockEnd: 'var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-3)',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "truck",
    size: 20,
    style: {
      color: 'var(--brand)',
      marginBlockStart: 2
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-title)'
    }
  }, "\u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0641\u064A \u0646\u0641\u0633 \u0627\u0644\u064A\u0648\u0645"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\u0627\u0644\u0645\u062D\u0644 \u0628\u064A\u0637\u0644\u0628 \u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u0648\u0642\u062A \u0645\u0627 \u064A\u062C\u0647\u0651\u0632 \u0627\u0644\u0623\u0648\u0631\u062F\u0631. \u0627\u0644\u0628\u0636\u0627\u0639\u0629 \u0645\u0634 \u0628\u062A\u062A\u062D\u0631\u0643 \u0644\u0645\u062E\u0632\u0646."))))));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/home-screen.js", error: String((e && e.message) || e) }); }

// ui_kits/storefront/order-screen.js
try { (() => {
/* US-SHOP-014/015/016: an order number readable over the phone, and one
   fulfilment status per shop — a two-shop order has two shipments. */
function OrderScreen({
  total,
  onHome,
  onChat
}) {
  const rows = [{
    brand: 'Versattire',
    status: 'HANDED_OVER',
    line: 'قميص كتان · M · بيج',
    track: 'BST-77401920'
  }, {
    brand: 'Antikka',
    status: 'PENDING_BRAND',
    line: 'بنطلون جينز · 32 · أزرق',
    track: null
  }];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "lq-pad",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      paddingBlock: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "lq-eyebrow"
  }, "\u0631\u0642\u0645 \u0627\u0644\u0623\u0648\u0631\u062F\u0631"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "data-num": true,
    style: {
      fontSize: 'var(--text-xl)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-title)'
    },
    dir: "ltr"
  }, "LQ-4821-7730"), /*#__PURE__*/React.createElement(IconButton, {
    icon: "copy",
    label: "\u0627\u0646\u0633\u062E",
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\u062A\u0642\u062F\u0631 \u062A\u0633\u0623\u0644 \u0639\u0646 \u0627\u0644\u0623\u0648\u0631\u062F\u0631 \u0628\u0627\u0644\u0631\u0642\u0645 \u062F\u0647 \u0648\u0631\u0642\u0645 \u0645\u0648\u0628\u0627\u064A\u0644\u0643 \u0645\u0646 \u063A\u064A\u0631 \u062D\u0633\u0627\u0628."))), rows.map(r => /*#__PURE__*/React.createElement(Card, {
    key: r.brand
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      marginBlockEnd: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "store",
    size: 16,
    style: {
      color: 'var(--text-muted)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-title)'
    }
  }, r.brand), /*#__PURE__*/React.createElement("span", {
    style: {
      marginInlineStart: 'auto'
    }
  }, /*#__PURE__*/React.createElement(StatusPill, {
    status: r.status
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)'
    }
  }, r.line), r.track ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      marginBlockStart: 'var(--space-3)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "truck",
    size: 16
  }), " Bosta \xB7 ", /*#__PURE__*/React.createElement("span", {
    "data-num": true,
    dir: "ltr"
  }, r.track)) : /*#__PURE__*/React.createElement("div", {
    style: {
      marginBlockStart: 'var(--space-3)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\u0627\u0644\u0645\u062D\u0644 \u0628\u064A\u0631\u0627\u062C\u0639 \u0627\u0644\u0631\u0641. \u0644\u0648 \u062D\u0627\u062C\u0629 \u0645\u0634 \u0645\u0648\u062C\u0648\u062F\u0629\u060C \u0628\u062A\u062A\u0631\u062C\u0639\u0644\u0643 \u0641\u0644\u0648\u0633\u0647\u0627 \u0648\u0646\u0635\u064A\u0628 \u0627\u0644\u0645\u062D\u0644 \u0627\u0644\u062A\u0627\u0646\u064A \u0628\u064A\u0643\u0645\u0644."))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-title)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u0627\u0644\u0645\u062F\u0641\u0648\u0639"), /*#__PURE__*/React.createElement(Money, {
    amount: total,
    decimals: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)',
      marginBlockStart: 4
    }
  }, "\u0643\u0627\u0634 \u0639\u0646\u062F \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 \xB7 \u0628\u062A\u062F\u0641\u0639 \u0644\u0644\u0645\u0646\u062F\u0648\u0628")), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    block: true,
    icon: "message-circle",
    onClick: onChat
  }, "\u0643\u0644\u0651\u0645 \u0627\u0644\u0645\u062D\u0644"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    block: true,
    onClick: onHome
  }, "\u0643\u0645\u0651\u0644 \u062A\u0633\u0648\u0651\u0642")));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/order-screen.js", error: String((e && e.message) || e) }); }

// ui_kits/storefront/orders-screen.js
try { (() => {
/* US-SHOP-014/015: a guest looks an order up by number and phone; a registered
   shopper sees the list. A multi-shop order is one order with a status per shop,
   so the row shows the shop count and the status that is furthest behind. */
function OrdersScreen({
  onOpen
}) {
  const orders = [{
    id: 'LQ-4821-7730',
    when: 'النهاردة 11:04',
    shops: 2,
    items: 2,
    total: 1690,
    status: 'PENDING_BRAND'
  }, {
    id: 'LQ-4788-1120',
    when: 'الأحد',
    shops: 1,
    items: 1,
    total: 435,
    status: 'HANDED_OVER'
  }, {
    id: 'LQ-4602-8890',
    when: '12 أغسطس',
    shops: 1,
    items: 3,
    total: 2270,
    status: 'DELIVERED'
  }, {
    id: 'LQ-4590-3311',
    when: '9 أغسطس',
    shops: 1,
    items: 1,
    total: 780,
    status: 'RETURNED'
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "lq-pad",
    style: {
      display: 'grid',
      gap: 'var(--space-3)',
      paddingBlock: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-3)',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 18,
    style: {
      color: 'var(--text-muted)',
      marginBlockStart: 2
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-title)'
    }
  }, "\u0645\u0634 \u0639\u0627\u0645\u0644 \u062D\u0633\u0627\u0628\u061F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\u062F\u0648\u0651\u0631 \u0639\u0644\u0649 \u0627\u0644\u0623\u0648\u0631\u062F\u0631 \u0628\u0631\u0642\u0645\u0647 \u0648\u0631\u0642\u0645 \u0645\u0648\u0628\u0627\u064A\u0644\u0643.")))), orders.map(o => /*#__PURE__*/React.createElement(Card, {
    key: o.id,
    href: "#",
    onClick: e => {
      e.preventDefault();
      onOpen(o);
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "data-num": true,
    dir: "ltr",
    style: {
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-title)'
    }
  }, o.id), /*#__PURE__*/React.createElement("span", {
    style: {
      marginInlineStart: 'auto'
    }
  }, /*#__PURE__*/React.createElement(StatusPill, {
    status: o.status
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 'var(--space-3)',
      marginBlockStart: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, o.when, " \xB7 ", o.items, " \u0642\u0637\u0639\u0629 \xB7 ", o.shops, " \u0645\u062D\u0644"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginInlineStart: 'auto'
    }
  }, /*#__PURE__*/React.createElement(Money, {
    amount: o.total,
    decimals: true
  }))))));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/orders-screen.js", error: String((e && e.message) || e) }); }

// ui_kits/storefront/product-screen.js
try { (() => {
/* US-SHOP-003: photos, description, price, sizes and colours. Availability is
   stockOnHand minus live reservations, so sold-out variants are shown, not hidden. */
function ProductScreen({
  product,
  onAdd,
  onTryOn
}) {
  const [size, setSize] = React.useState('m');
  const [col, setCol] = React.useState('snd');
  const p = product;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '3/4',
      background: 'var(--surface-sunken)',
      display: 'grid',
      placeItems: 'center',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    size: 40,
    style: {
      color: 'var(--text-muted)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      insetBlockEnd: 'var(--space-3)',
      insetInlineStart: 'var(--space-3)',
      display: 'flex',
      gap: 6
    }
  }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      inlineSize: 44,
      blockSize: 56,
      borderRadius: 'var(--radius-sm)',
      background: 'var(--surface-card)',
      border: '1px solid var(--line)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    size: 14,
    style: {
      color: 'var(--text-muted)'
    }
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "lq-pad",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      paddingBlock: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "lq-eyebrow"
  }, p.brand), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--text-xl)',
      marginBlockStart: 4
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 'var(--space-3)',
      marginBlockStart: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement(Money, {
    amount: p.price,
    size: "lg"
  }), p.was ? /*#__PURE__*/React.createElement(Money, {
    amount: p.was,
    size: "sm",
    strike: true
  }) : null)), /*#__PURE__*/React.createElement(VariantPicker, {
    label: "\u0627\u0644\u0645\u0642\u0627\u0633",
    aside: "\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0642\u0627\u0633\u0627\u062A",
    options: SIZES,
    value: size,
    onChange: setSize
  }), /*#__PURE__*/React.createElement(VariantPicker, {
    label: "\u0627\u0644\u0644\u0648\u0646",
    kind: "colour",
    options: COLOURS,
    value: col,
    onChange: setCol
  }), p.tryOn ? /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "scan-face",
    onClick: onTryOn
  }, "\u062C\u0631\u0651\u0628\u0647 \u0639\u0644\u064A\u0643 \u0628\u0627\u0644\u0635\u0648\u0631\u0629") : null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-base)'
    }
  }, "\u0642\u0637\u0639\u0629 \u0645\u0646 ", p.brand, "\u060C \u0645\u062A\u0627\u062D\u0629 \u0641\u064A \u0627\u0644\u0645\u062D\u0644 \u062F\u0644\u0648\u0642\u062A\u064A. \u0627\u0644\u0645\u062D\u0644 \u0628\u064A\u0631\u0627\u062C\u0639 \u0627\u0644\u0631\u0641 \u0642\u0628\u0644 \u0645\u0627 \u064A\u0623\u0643\u062F \u0627\u0644\u0623\u0648\u0631\u062F\u0631\u060C \u0641\u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0644\u064A \u0625\u0646\u062A \u0634\u0627\u064A\u0641\u0647 \u0647\u0648 \u0622\u062E\u0631 \u062D\u0627\u062C\u0629 \u0627\u0644\u0645\u062D\u0644 \u0642\u0627\u0644\u0647\u0627 \u0644\u0646\u0627."), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "store",
    size: 18,
    style: {
      color: 'var(--text-muted)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-title)'
    }
  }, p.brand), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, "\u0634\u0648\u0641 \u0643\u0644 \u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0645\u062D\u0644")), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 16,
    style: {
      color: 'var(--text-muted)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-3)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "truck",
    size: 16
  }), " \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0641\u064A \u0646\u0641\u0633 \u0627\u0644\u064A\u0648\u0645 \xB7 \u0645\u0635\u0627\u0631\u064A\u0641 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0644\u0643\u0644 \u0645\u062D\u0644 \u0644\u0648\u062D\u062F\u0647")), /*#__PURE__*/React.createElement(ActionBar, {
    label: "\u0627\u0644\u0633\u0639\u0631",
    value: /*#__PURE__*/React.createElement(Money, {
      amount: p.price
    })
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    block: true,
    icon: "shopping-bag",
    onClick: () => onAdd(p, size, col)
  }, "\u0623\u0636\u0641 \u0644\u0644\u0633\u0644\u0629")));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/product-screen.js", error: String((e && e.message) || e) }); }

// ui_kits/storefront/search-screen.js
try { (() => {
/* US-SHOP-004: one search across every shop, both scripts, typo-tolerant. Facets
   are a Later story, so the filter sheet carries only what the MVP can answer:
   category, price band, and in-stock. */
function SearchScreen({
  onOpen
}) {
  const [q, setQ] = React.useState('قميص');
  const [filters, setFilters] = React.useState(false);
  const [cat, setCat] = React.useState('all');
  const [band, setBand] = React.useState();
  const [stock, setStock] = React.useState(true);
  const hits = PRODUCTS.filter(p => !p.soldOut || !stock);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "lq-pad",
    style: {
      display: 'flex',
      gap: 'var(--space-2)',
      alignItems: 'center',
      paddingBlock: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(SearchField, {
    value: q,
    onChange: setQ,
    onClear: () => setQ('')
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "sliders-horizontal",
    label: "\u0641\u0644\u062A\u0631",
    variant: "outline",
    onClick: () => setFilters(true)
  })), /*#__PURE__*/React.createElement("div", {
    className: "lq-pad"
  }, /*#__PURE__*/React.createElement(CategoryTabs, {
    items: CATEGORIES,
    value: cat,
    onChange: setCat
  })), /*#__PURE__*/React.createElement("div", {
    className: "lq-pad lq-sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lq-sec__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lq-sec__title"
  }, "\u0646\u062A\u0627\u064A\u062C \"", q, "\""), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, hits.length, " \u0645\u0646 ", new Set(hits.map(h => h.brand)).size, " \u0645\u062D\u0644\u0627\u062A")), /*#__PURE__*/React.createElement("div", {
    className: "lq-grid2"
  }, hits.map(p => /*#__PURE__*/React.createElement(ProductCard, {
    key: p.id,
    brand: p.brand,
    name: p.name,
    price: p.price,
    was: p.was,
    tryOn: p.tryOn,
    soldOut: p.soldOut,
    href: "#",
    onClick: e => {
      e.preventDefault();
      onOpen(p);
    }
  }))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, "\u0627\u0644\u0628\u062D\u062B \u0628\u064A\u062F\u0648\u0651\u0631 \u0641\u064A \u0643\u0644 \u0627\u0644\u0645\u062D\u0644\u0627\u062A \u0628\u0627\u0644\u0639\u0631\u0628\u064A \u0648\u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u060C \u0648\u0644\u0648 \u0643\u062A\u0628\u062A \u0627\u0644\u0643\u0644\u0645\u0629 \u063A\u0644\u0637 \u0628\u0631\u0636\u0647 \u0628\u064A\u0644\u0627\u0642\u064A\u0647\u0627.")), /*#__PURE__*/React.createElement(Sheet, {
    open: filters,
    title: "\u0641\u0644\u062A\u0631",
    onClose: () => setFilters(false),
    footer: /*#__PURE__*/React.createElement(Button, {
      size: "lg",
      block: true,
      onClick: () => setFilters(false)
    }, "\u0648\u0631\u064A\u0646\u064A \u0627\u0644\u0646\u062A\u0627\u064A\u062C")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-5)'
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "\u0627\u0644\u0633\u0639\u0631",
    placeholder: "\u0623\u064A \u0633\u0639\u0631",
    value: band,
    onChange: setBand,
    options: [{
      value: 'a',
      label: 'أقل من 500'
    }, {
      value: 'b',
      label: 'من 500 لـ 1,000'
    }, {
      value: 'c',
      label: 'أكتر من 1,000'
    }]
  }), /*#__PURE__*/React.createElement(VariantPicker, {
    label: "\u0627\u0644\u0645\u0642\u0627\u0633",
    options: SIZES,
    value: "m",
    onChange: () => {}
  }), /*#__PURE__*/React.createElement(Checkbox, {
    checked: stock,
    onChange: setStock
  }, "\u0627\u0644\u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0627\u0644\u0645\u062D\u0644 \u0628\u0633"))));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/search-screen.js", error: String((e && e.message) || e) }); }

// ui_kits/storefront/shop-app.js
try { (() => {
/* The consumer app to the Loqal dashboard. The mount lives in index.html, not here:
   a screen that mounts itself on import cannot be loaded by anything but its own page.

   The app to the Loqal dashboard: browse across shops, a product, the
   AI try-on, one bag holding several shops, guest checkout, tracking, chat with
   the shop, and an account that a guest never has to create. Fake state, real
   screens. */
function ShopApp() {
  const [view, setView] = React.useState({
    name: 'home'
  });
  const [tab, setTab] = React.useState('home');
  const [tryOn, setTryOn] = React.useState(false);
  const [lines, setLines] = React.useState([{
    key: 'k1',
    name: 'قميص كتان',
    brand: 'Versattire',
    variant: 'M · بيج',
    price: 450,
    qty: 1,
    max: 3
  }, {
    key: 'k2',
    name: 'بنطلون جينز',
    brand: 'Antikka',
    variant: '32 · أزرق',
    price: 1150,
    qty: 1,
    max: 2,
    note: 'آخر 2 في المحل'
  }]);
  const goods = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const shops = new Set(lines.map(l => l.brand));
  const total = goods + shops.size * 45;
  const bagCount = lines.reduce((s, l) => s + l.qty, 0);
  const open = p => setView({
    name: 'product',
    product: p
  });
  const add = (p, size, col) => {
    const variant = (SIZES.find(s => s.value === size) || {}).label + ' · ' + (COLOURS.find(c => c.value === col) || {}).label;
    setLines(ls => ls.concat([{
      key: 'k' + Date.now(),
      name: p.name,
      brand: p.brand,
      variant,
      price: p.price,
      qty: 1,
      max: 3
    }]));
    setTab('bag');
    setView({
      name: 'bag'
    });
  };
  const go = id => {
    setTab(id);
    setView({
      name: id === 'me' ? 'account' : id
    });
  };
  const TITLES = {
    bag: 'السلة',
    checkout: 'إتمام الأوردر',
    order: 'أوردرك',
    orders: 'أوردراتي',
    account: 'حسابي',
    chat: 'Versattire',
    search: 'بحث'
  };
  const ROOTS = ['home', 'search', 'bag', 'orders', 'account'];
  const back = () => {
    if (view.name === 'product') return setView({
      name: tab === 'search' ? 'search' : 'home'
    });
    if (view.name === 'checkout') return setView({
      name: 'bag'
    });
    if (view.name === 'chat') return setView({
      name: 'account'
    });
    if (view.name === 'order') return setView({
      name: 'orders'
    });
    setView({
      name: 'home'
    });
    setTab('home');
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "lq-shell"
  }, view.name === 'home' ? /*#__PURE__*/React.createElement(TopBar, {
    mark: "Loqal",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconButton, {
      icon: "search",
      label: "\u0628\u062D\u062B",
      size: 18,
      onClick: () => go('search')
    }), /*#__PURE__*/React.createElement("span", {
      className: "lq-topbar__slot"
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: "shopping-bag",
      label: "\u0627\u0644\u0633\u0644\u0629",
      size: 18,
      onClick: () => go('bag')
    }), bagCount ? /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        insetBlockStart: 2,
        insetInlineStart: 2
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: "count"
    }, bagCount)) : null))
  }) : /*#__PURE__*/React.createElement(TopBar, {
    title: view.name === 'product' ? view.product.brand : TITLES[view.name],
    onBack: ROOTS.indexOf(view.name) === -1 || view.name === 'account' ? back : undefined,
    actions: view.name === 'product' ? /*#__PURE__*/React.createElement(IconButton, {
      icon: "share-2",
      label: "\u0634\u0627\u0631\u0643",
      size: 18
    }) : null
  }), /*#__PURE__*/React.createElement("div", {
    className: "lq-scroll"
  }, view.name === 'home' ? /*#__PURE__*/React.createElement(HomeScreen, {
    onOpen: open,
    onSearch: () => go('search')
  }) : null, view.name === 'search' ? /*#__PURE__*/React.createElement(SearchScreen, {
    onOpen: open
  }) : null, view.name === 'product' ? /*#__PURE__*/React.createElement(ProductScreen, {
    product: view.product,
    onAdd: add,
    onTryOn: () => setTryOn(true)
  }) : null, view.name === 'bag' ? /*#__PURE__*/React.createElement(BagScreen, {
    lines: lines,
    onQty: (k, q) => setLines(ls => ls.map(l => l.key === k ? Object.assign({}, l, {
      qty: q
    }) : l)),
    onRemove: k => setLines(ls => ls.filter(l => l.key !== k)),
    onCheckout: () => setView({
      name: 'checkout'
    })
  }) : null, view.name === 'checkout' ? /*#__PURE__*/React.createElement(CheckoutScreen, {
    total: total,
    onPlace: () => setView({
      name: 'order'
    })
  }) : null, view.name === 'order' ? /*#__PURE__*/React.createElement(OrderScreen, {
    total: total,
    onHome: () => go('home'),
    onChat: () => setView({
      name: 'chat'
    })
  }) : null, view.name === 'orders' ? /*#__PURE__*/React.createElement(OrdersScreen, {
    onOpen: () => setView({
      name: 'order'
    })
  }) : null, view.name === 'chat' ? /*#__PURE__*/React.createElement(ChatScreen, null) : null, view.name === 'account' ? /*#__PURE__*/React.createElement(AccountScreen, {
    onChat: () => setView({
      name: 'chat'
    })
  }) : null), ROOTS.indexOf(view.name) !== -1 ? /*#__PURE__*/React.createElement(BottomTabBar, {
    items: TABS.map(t => t.id === 'bag' ? Object.assign({}, t, {
      count: bagCount
    }) : t),
    value: tab,
    onChange: go
  }) : null, /*#__PURE__*/React.createElement(TryOnSheet, {
    open: tryOn,
    onClose: () => setTryOn(false),
    product: view.product
  }));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/shop-app.js", error: String((e && e.message) || e) }); }

// ui_kits/storefront/try-on-sheet.js
try { (() => {
/* Virtual try-on, the three-step sequence from the backend plan: a person photo
   becomes a subject, the variant's own garment photo is the other input, and the
   render is queued — nothing waits on the model call. Ten renders per account,
   ever, so the sheet says so before the shopper spends one. */
function TryOnSheet({
  open,
  onClose,
  product
}) {
  const [step, setStep] = React.useState('upload');
  React.useEffect(() => {
    if (open) setStep('upload');
  }, [open]);
  const run = () => {
    setStep('queued');
    setTimeout(() => setStep('ready'), 1800);
  };
  return /*#__PURE__*/React.createElement(Sheet, {
    open: open,
    onClose: onClose,
    title: "\u062C\u0631\u0651\u0628\u0647 \u0639\u0644\u064A\u0643",
    footer: step === 'upload' ? /*#__PURE__*/React.createElement(Button, {
      size: "lg",
      block: true,
      icon: "sparkles",
      onClick: run
    }, "\u0627\u0639\u0645\u0644 \u0627\u0644\u0635\u0648\u0631\u0629") : /*#__PURE__*/React.createElement(Button, {
      size: "lg",
      block: true,
      variant: step === 'ready' ? 'primary' : 'secondary',
      onClick: onClose
    }, step === 'ready' ? 'أضف للسلة' : 'استنى شوية')
  }, step === 'upload' ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '3/4',
      border: '1px dashed var(--line-strong)',
      borderRadius: 'var(--radius-lg)',
      display: 'grid',
      placeItems: 'center',
      gap: 8,
      background: 'var(--surface-sunken)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "scan-face",
    size: 28,
    style: {
      color: 'var(--text-muted)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\u0635\u0648\u0631\u0629 \u0648\u0627\u062D\u062F\u0629 \u0644\u0643\u060C \u0648\u0627\u0642\u0641 \u0648\u0648\u0627\u0636\u062D"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: "camera"
  }, "\u0627\u062E\u062A\u0627\u0631 \u0635\u0648\u0631\u0629")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\u0627\u0644\u0635\u0648\u0631\u0629 \u0628\u062A\u062A\u062D\u0648\u0651\u0644 \u0644\u0635\u0648\u0631\u0629 \u0648\u0627\u062D\u062F\u0629 \u0628\u0633 \u0639\u0644\u064A\u0647\u0627 ", product ? product.name : 'القطعة', ". \u0639\u0646\u062F\u0643 \u0661\u0660 \u0635\u0648\u0631 \u0644\u0644\u062D\u0633\u0627\u0628\u060C \u0648\u0627\u0644\u0635\u0648\u0631\u0629 \u0627\u0644\u0644\u064A \u0639\u0645\u0644\u062A\u0647\u0627 \u0645\u0631\u0629 \u062A\u0641\u0636\u0644 \u0645\u062D\u0641\u0648\u0638\u0629.")) : null, step === 'queued' ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(Skeleton, {
    h: 260,
    radius: "var(--radius-lg)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(StatusPill, {
    status: "QUEUED"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\u062D\u0648\u0627\u0644\u064A \u0661\u0660 \u062B\u0648\u0627\u0646\u064A. \u062A\u0642\u062F\u0631 \u062A\u0633\u064A\u0628 \u0627\u0644\u0634\u0627\u0634\u0629."))) : null, step === 'ready' ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '3/4',
      background: 'var(--surface-sunken)',
      borderRadius: 'var(--radius-lg)',
      display: 'grid',
      placeItems: 'center',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    size: 34,
    style: {
      color: 'var(--text-muted)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      insetBlockStart: 'var(--space-2)',
      insetInlineStart: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "tint"
  }, "\u0642\u064A\u0627\u0633 \u0627\u0641\u062A\u0631\u0627\u0636\u064A"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(StatusPill, {
    status: "READY"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\u0641\u0627\u0636\u0644\u0643 \u0669 \u0635\u0648\u0631"), /*#__PURE__*/React.createElement(IconButton, {
    icon: "share-2",
    label: "\u0634\u0627\u0631\u0643",
    size: 16
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, "\u0627\u0644\u0635\u0648\u0631\u0629 \u062A\u0642\u0631\u064A\u0628\u064A\u0629. \u0627\u0644\u0645\u0642\u0627\u0633 \u0627\u0644\u0644\u064A \u0628\u062A\u0634\u062A\u0631\u064A\u0647 \u0647\u0648 \u0627\u0644\u0644\u064A \u0627\u062E\u062A\u0631\u062A\u0647 \u0641\u0648\u0642.")) : null);
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/try-on-sheet.js", error: String((e && e.message) || e) }); }

__ds_ns.ChatBubble = __ds_scope.ChatBubble;

__ds_ns.BrandTab = __ds_scope.BrandTab;

__ds_ns.CartLine = __ds_scope.CartLine;

__ds_ns.Money = __ds_scope.Money;

__ds_ns.PaymentOption = __ds_scope.PaymentOption;

__ds_ns.ProductCard = __ds_scope.ProductCard;

__ds_ns.QuantityStepper = __ds_scope.QuantityStepper;

__ds_ns.RollingNumber = __ds_scope.RollingNumber;

__ds_ns.StatusTones = __ds_scope.StatusTones;

__ds_ns.StatusPill = __ds_scope.StatusPill;

__ds_ns.VariantPicker = __ds_scope.VariantPicker;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.BottomTabBar = __ds_scope.BottomTabBar;

__ds_ns.CategoryTabs = __ds_scope.CategoryTabs;

__ds_ns.SearchField = __ds_scope.SearchField;

__ds_ns.TopBar = __ds_scope.TopBar;

__ds_ns.ActionBar = __ds_scope.ActionBar;

__ds_ns.Sheet = __ds_scope.Sheet;

})();
