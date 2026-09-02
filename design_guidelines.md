{
  "design_system_name": "Stockroom OS — Enterprise Inventory UI",
  "brand_attributes": [
    "trustworthy",
    "precise",
    "fast",
    "quietly premium",
    "audit-ready",
    "mobile-capable"
  ],
  "visual_personality": {
    "style": "Modern enterprise minimalism with subtle depth (solid surfaces, crisp borders, restrained color accents)",
    "avoid": [
      "playful/consumer vibes",
      "glassmorphism behind text",
      "heavy hero animations",
      "busy gradients",
      "purple gradients"
    ],
    "signature": [
      "cool-neutral canvas + ocean-teal primary",
      "high-density tables with sticky headers",
      "chip-based filters",
      "timeline traceability",
      "camera-first scanner with bottom action dock"
    ]
  },

  "typography": {
    "google_fonts": [
      {
        "family": "Space Grotesk",
        "weights": ["400", "500", "600", "700"],
        "usage": "Headings, KPI numbers, page titles"
      },
      {
        "family": "IBM Plex Sans",
        "weights": ["400", "500", "600"],
        "usage": "Body, tables, forms, helper text"
      },
      {
        "family": "IBM Plex Mono",
        "weights": ["400", "500"],
        "usage": "SKUs, serial numbers, audit IDs, code strings"
      }
    ],
    "tailwind_mapping": {
      "font-sans": "IBM Plex Sans",
      "font-display": "Space Grotesk",
      "font-mono": "IBM Plex Mono"
    },
    "scale": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-display font-semibold tracking-tight",
      "h2": "text-base md:text-lg text-muted-foreground",
      "section_title": "text-lg font-display font-semibold",
      "table_header": "text-xs font-medium uppercase tracking-wide text-muted-foreground",
      "body": "text-sm md:text-base font-sans",
      "small": "text-xs text-muted-foreground",
      "kpi_number": "text-2xl md:text-3xl font-display font-semibold tabular-nums",
      "mono": "font-mono text-xs md:text-sm"
    },
    "number_formatting": {
      "rule": "Use tabular-nums for KPIs and quantities",
      "tailwind": "tabular-nums"
    }
  },

  "color_system": {
    "notes": [
      "Primary UI is light for enterprise readability.",
      "Use solid surfaces for content; gradients only as subtle decorative section background accents (<=20% viewport).",
      "No purple for AI/chat; here we also avoid purple to keep enterprise tone consistent."
    ],
    "tokens_css": {
      "location": "/app/frontend/src/index.css",
      "light": {
        "--background": "210 25% 98%",
        "--foreground": "222 47% 11%",
        "--card": "0 0% 100%",
        "--card-foreground": "222 47% 11%",
        "--popover": "0 0% 100%",
        "--popover-foreground": "222 47% 11%",

        "--primary": "186 78% 28%",
        "--primary-foreground": "0 0% 100%",

        "--secondary": "210 20% 96%",
        "--secondary-foreground": "222 47% 11%",

        "--muted": "210 20% 96%",
        "--muted-foreground": "215 16% 40%",

        "--accent": "186 55% 92%",
        "--accent-foreground": "186 78% 18%",

        "--border": "214 20% 90%",
        "--input": "214 20% 90%",
        "--ring": "186 78% 28%",

        "--destructive": "0 72% 51%",
        "--destructive-foreground": "0 0% 100%",

        "--radius": "0.75rem",

        "--chart-1": "186 78% 28%",
        "--chart-2": "205 78% 40%",
        "--chart-3": "160 55% 34%",
        "--chart-4": "35 85% 55%",
        "--chart-5": "0 72% 51%"
      },
      "dark": {
        "--background": "222 47% 7%",
        "--foreground": "210 40% 98%",
        "--card": "222 47% 9%",
        "--card-foreground": "210 40% 98%",
        "--popover": "222 47% 9%",
        "--popover-foreground": "210 40% 98%",

        "--primary": "186 70% 45%",
        "--primary-foreground": "222 47% 7%",

        "--secondary": "217 20% 16%",
        "--secondary-foreground": "210 40% 98%",

        "--muted": "217 20% 16%",
        "--muted-foreground": "215 20% 70%",

        "--accent": "186 35% 18%",
        "--accent-foreground": "186 70% 85%",

        "--border": "217 20% 18%",
        "--input": "217 20% 18%",
        "--ring": "186 70% 45%",

        "--destructive": "0 62% 40%",
        "--destructive-foreground": "210 40% 98%"
      }
    },
    "semantic_status": {
      "in_stock": {
        "label": "Available",
        "bg": "bg-emerald-50",
        "text": "text-emerald-800",
        "border": "border-emerald-200",
        "dot": "bg-emerald-500"
      },
      "low_stock": {
        "label": "Low",
        "bg": "bg-amber-50",
        "text": "text-amber-900",
        "border": "border-amber-200",
        "dot": "bg-amber-500"
      },
      "out_of_stock": {
        "label": "Out",
        "bg": "bg-rose-50",
        "text": "text-rose-800",
        "border": "border-rose-200",
        "dot": "bg-rose-500"
      },
      "discontinued": {
        "label": "Discontinued",
        "bg": "bg-slate-100",
        "text": "text-slate-700",
        "border": "border-slate-200",
        "dot": "bg-slate-500"
      },
      "needs_code": {
        "label": "Missing QR/Barcode",
        "bg": "bg-cyan-50",
        "text": "text-cyan-900",
        "border": "border-cyan-200",
        "dot": "bg-cyan-600"
      }
    },
    "allowed_gradients": {
      "rule": "Decorative only; max 20% viewport; never on text-heavy surfaces",
      "examples": [
        "bg-[radial-gradient(1200px_circle_at_20%_-10%,hsl(var(--accent))_0%,transparent_55%)]",
        "bg-[linear-gradient(135deg,hsl(186_55%_96%)_0%,hsl(210_25%_98%)_55%,hsl(205_70%_96%)_100%)]"
      ]
    }
  },

  "layout_and_grid": {
    "app_shell": {
      "pattern": "Sidebar + Topbar + Content",
      "desktop": {
        "sidebar_width": "w-[280px]",
        "content_max_width": "max-w-[1440px]",
        "page_padding": "px-4 md:px-6 lg:px-8 py-4 md:py-6",
        "topbar_height": "h-14"
      },
      "mobile": {
        "sidebar": "Use Sheet (drawer) triggered from topbar hamburger",
        "topbar": "Sticky topbar with search + quick actions",
        "content": "Single column; tables become card-list or horizontal scroll"
      }
    },
    "grid": {
      "desktop": "12-col grid; use gap-4 md:gap-6",
      "dashboard": "KPI row (4 cards) -> charts (2/3 + 1/3) -> tables",
      "forms": "Two-column on lg (details left, meta right); single column on mobile"
    },
    "spacing_scale": {
      "rule": "Use Tailwind spacing; prefer generous whitespace",
      "defaults": {
        "section_gap": "space-y-6",
        "card_padding": "p-4 md:p-5",
        "dense_table_cell": "py-2",
        "comfortable_table_cell": "py-3"
      }
    }
  },

  "components": {
    "component_path": {
      "shadcn_primary": "/app/frontend/src/components/ui",
      "use": [
        "button.jsx",
        "input.jsx",
        "textarea.jsx",
        "select.jsx",
        "checkbox.jsx",
        "switch.jsx",
        "badge.jsx",
        "card.jsx",
        "table.jsx",
        "tabs.jsx",
        "dialog.jsx",
        "drawer.jsx",
        "sheet.jsx",
        "alert-dialog.jsx",
        "breadcrumb.jsx",
        "pagination.jsx",
        "skeleton.jsx",
        "tooltip.jsx",
        "popover.jsx",
        "command.jsx",
        "calendar.jsx",
        "sonner.jsx"
      ]
    },

    "buttons": {
      "style": "Professional / Corporate with slightly softened radius",
      "tokens": {
        "radius": "rounded-xl",
        "height": "h-10",
        "padding": "px-4",
        "shadow": "shadow-sm",
        "press": "active:scale-[0.98]",
        "focus": "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      },
      "variants": {
        "primary": "bg-primary text-primary-foreground hover:bg-primary/90",
        "secondary": "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        "ghost": "hover:bg-accent hover:text-accent-foreground",
        "destructive": "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      },
      "icon_button": {
        "pattern": "Use Button variant=ghost size=icon with Tooltip",
        "hit_area": "min-h-[44px] min-w-[44px]"
      },
      "data_testid": {
        "rule": "Every button must include data-testid",
        "examples": [
          "data-testid=\"products-create-button\"",
          "data-testid=\"scanner-torch-toggle\"",
          "data-testid=\"movement-submit-button\""
        ]
      }
    },

    "inputs_and_forms": {
      "pattern": "Sectioned forms with sticky action bar",
      "components": ["Label", "Input", "Textarea", "Select", "Checkbox", "Switch", "Calendar", "Popover"],
      "layout": {
        "section_header": "flex items-center justify-between gap-3",
        "field_grid": "grid grid-cols-1 lg:grid-cols-2 gap-4",
        "helper_text": "text-xs text-muted-foreground",
        "error_text": "text-xs text-rose-700"
      },
      "validation": {
        "rule": "Inline validation under field; summary toast only on submit failure",
        "states": {
          "error": "ring-rose-200 focus-visible:ring-rose-400",
          "success": "ring-emerald-200 focus-visible:ring-emerald-400"
        }
      },
      "sticky_action_bar": {
        "desktop": "sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t px-4 md:px-6 py-3",
        "mobile": "same; ensure primary action on right; secondary on left"
      },
      "data_testid_examples": [
        "data-testid=\"product-form-name-input\"",
        "data-testid=\"product-form-category-select\"",
        "data-testid=\"product-form-save-button\""
      ]
    },

    "tables": {
      "density": {
        "default": "comfortable",
        "toggle": "Provide density toggle (comfortable/dense) stored in localStorage"
      },
      "patterns": {
        "sticky_header": "Use sticky top-0 header inside ScrollArea",
        "row_hover": "hover:bg-muted/50",
        "row_click": "Make row clickable only when it navigates; otherwise keep explicit action buttons",
        "zebra": "Avoid zebra by default; use hover + subtle separators"
      },
      "columns": {
        "recommended": [
          "Name + SKU (mono)",
          "Category",
          "Location",
          "Qty (tabular)",
          "Status badge",
          "Updated",
          "Actions (icon buttons)"
        ]
      },
      "filters": {
        "ui": "Top filter bar with search + filter popover + active filter chips",
        "components": ["Input", "Popover", "Command", "Badge", "Tabs"],
        "chips": {
          "style": "Badge variant=secondary with X icon",
          "placement": "Below filter bar; wrap; include Clear all",
          "url_state": "Persist filters in URL query params for shareable views"
        }
      },
      "pagination": {
        "component": "pagination.jsx",
        "pattern": "Bottom bar: rows-per-page select + page controls; sticky on mobile"
      },
      "empty_state": {
        "pattern": "Centered in table area with icon + short copy + primary CTA",
        "cta": "Create product / Clear filters"
      },
      "loading": {
        "pattern": "Skeleton rows (8–12) + skeleton header controls"
      },
      "data_testid_examples": [
        "data-testid=\"products-table\"",
        "data-testid=\"products-search-input\"",
        "data-testid=\"products-filter-popover-button\"",
        "data-testid=\"products-export-button\"",
        "data-testid=\"products-row-actions-<id>\""
      ]
    },

    "navigation": {
      "sidebar": {
        "pattern": "Grouped nav with section labels + icons; collapsible groups",
        "active_state": "bg-accent text-accent-foreground font-medium",
        "item": "h-10 px-3 rounded-lg flex items-center gap-2",
        "collapsed": "Optional icon-only mode on xl; keep tooltips",
        "mobile": "Sheet component; close on navigation"
      },
      "topbar": {
        "pattern": "Sticky topbar with breadcrumbs left, global search center, actions right",
        "components": ["Breadcrumb", "Input", "Button", "DropdownMenu", "Avatar"],
        "global_search": "Use Command (cmdk) palette for quick navigation + product lookup"
      },
      "breadcrumbs": {
        "component": "breadcrumb.jsx",
        "rule": "Always show for deep pages: Products > Item > History"
      }
    },

    "dialogs_and_toasts": {
      "confirmations": {
        "component": "alert-dialog.jsx",
        "rule": "Destructive actions require confirmation with explicit item name"
      },
      "modals": {
        "component": "dialog.jsx",
        "sizes": {
          "sm": "max-w-md",
          "md": "max-w-2xl",
          "lg": "max-w-4xl"
        }
      },
      "drawers": {
        "component": "drawer.jsx",
        "use_cases": ["mobile filters", "quick edit", "movement quick actions"]
      },
      "toasts": {
        "library": "sonner",
        "component": "/app/frontend/src/components/ui/sonner.jsx",
        "rules": [
          "Use success toast for completed actions",
          "Use error toast for failed network actions",
          "Avoid stacking >3; collapse duplicates"
        ]
      }
    },

    "badges_and_status": {
      "component": "badge.jsx",
      "pattern": "Badge with leading dot for status",
      "class_example": "inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs",
      "dot": "h-1.5 w-1.5 rounded-full"
    },

    "timeline_traceability": {
      "pattern": "Vertical timeline on product detail: movement events + audit entries",
      "layout": "Left rail with dots; right content card",
      "components": ["Card", "Badge", "Separator", "Tooltip"],
      "mono_fields": "Use font-mono for movement IDs, batch numbers"
    }
  },

  "page_blueprints": {
    "login": {
      "layout": "Split layout on desktop; single column on mobile",
      "left": "Brand panel with subtle radial accent background (<=20% viewport) + security copy",
      "right": "Card with form",
      "form": ["email", "password", "remember me", "submit"],
      "data_testid": [
        "login-email-input",
        "login-password-input",
        "login-submit-button"
      ]
    },

    "dashboard": {
      "kpis": {
        "cards": [
          "Total SKUs",
          "Items in stock (sum qty)",
          "Low stock count",
          "Movements today"
        ],
        "card_design": {
          "surface": "Card with subtle shadow-sm and border",
          "meta": "small label + trend chip",
          "number": "kpi_number",
          "sparkline": "Optional tiny chart area (Recharts)"
        }
      },
      "charts": {
        "library": "Recharts",
        "layout": "2/3 wide movements over time + 1/3 category distribution",
        "third_row": "Top moved products table + Alerts panel",
        "chart_conventions": [
          "Use muted gridlines",
          "Use 1 primary series color + 1 accent; avoid rainbow",
          "Tooltips must be high-contrast and concise"
        ],
        "data_testid": [
          "dashboard-kpi-total-skus",
          "dashboard-chart-movements-over-time",
          "dashboard-chart-category-distribution",
          "dashboard-panel-alerts"
        ]
      }
    },

    "products_list": {
      "top_controls": "Search left, filter popover, export, create button right",
      "table": "Sticky header + actions column",
      "quick_actions": ["View", "Edit", "Print label", "Entry", "Exit"],
      "bulk": "Bulk select with action bar (export, assign location, set status)",
      "data_testid": [
        "products-create-button",
        "products-search-input",
        "products-table"
      ]
    },

    "product_detail": {
      "header": "Title + status badge + quick actions (edit, print label, open scanner)",
      "layout": "Two-column on lg: details + code card right; tabs below",
      "tabs": ["Overview", "History", "Audit", "Attachments"],
      "code_card": {
        "content": "QR + barcode render + code string (mono) + print",
        "print": "Use clean label template with minimal ink"
      },
      "history": "Timeline + table view toggle",
      "data_testid": [
        "product-detail-title",
        "product-detail-print-label-button",
        "product-detail-history-table"
      ]
    },

    "movements": {
      "tabs": ["All", "Entries", "Exits", "Adjustments"],
      "filters": "Chip-based multi-filter + date range (Calendar in Popover)",
      "export": "CSV/Excel/PDF",
      "data_testid": [
        "movements-tabs",
        "movements-filter-date-button",
        "movements-export-button"
      ]
    },

    "movement_forms": {
      "pages": ["/movements/entry", "/movements/exit", "/movements/adjustment"],
      "pattern": "Fast form with product lookup (Command) + qty + location + notes",
      "speed": [
        "Auto-focus first field",
        "Enter submits when valid",
        "Keyboard shortcuts: / to focus search"
      ],
      "data_testid": [
        "movement-product-lookup",
        "movement-quantity-input",
        "movement-submit-button"
      ]
    },

    "scanner": {
      "goal": "Camera-first, minimal chrome, one-hand operation",
      "layout": {
        "top": "Compact header with back + title + torch",
        "center": "Camera viewport with viewfinder overlay",
        "bottom": "Action dock with big buttons"
      },
      "controls": {
        "primary": "Scan automatically; on decode show bottom sheet with product summary + actions",
        "actions": ["Quick Entry", "Quick Exit", "View Product"],
        "secondary": ["Switch camera", "Torch", "Upload image"],
        "hit_targets": "min 44x44; primary buttons h-12"
      },
      "html5_qrcode": {
        "config": {
          "facingMode": "environment",
          "fps": 10,
          "qrbox": {"width": 250, "height": 250},
          "aspectRatio": 1.0,
          "showTorchButtonIfSupported": true
        },
        "react_rule": "Keep scanner container mounted; toggle visibility via CSS to avoid DOM conflicts"
      },
      "micro_interactions": [
        "On successful scan: vibrate 30ms (if supported) + subtle success toast",
        "Overlay animates from idle -> locked state",
        "If no code detected after 8s: show helper tip card"
      ],
      "data_testid": [
        "scanner-camera-container",
        "scanner-torch-toggle",
        "scanner-switch-camera",
        "scanner-upload-image",
        "scanner-result-sheet"
      ]
    },

    "import_wizard": {
      "pattern": "Stepper with 4 stages: Download template -> Upload -> Preview errors -> Commit",
      "components": ["Tabs or custom stepper", "Table", "Alert", "Dialog"],
      "preview": "Error rows highlighted; downloadable error report",
      "data_testid": [
        "import-download-template-button",
        "import-upload-input",
        "import-commit-button"
      ]
    },

    "counts": {
      "pattern": "Session list -> session detail with scan mode",
      "scan_mode": "Same scanner UI but with count list + discrepancy badge",
      "data_testid": [
        "counts-create-session-button",
        "counts-session-table",
        "counts-scan-mode-button"
      ]
    },

    "alerts": {
      "pattern": "Inbox-like list with severity tabs + bulk resolve",
      "severity": "Use semantic_status colors",
      "data_testid": [
        "alerts-tabs",
        "alerts-table"
      ]
    },

    "audit": {
      "pattern": "Immutable log viewer with advanced filters + export",
      "density": "Dense by default",
      "data_testid": [
        "audit-table",
        "audit-filter-user",
        "audit-export-button"
      ]
    },

    "permissions": {
      "pattern": "Role-permission matrix table with sticky first column",
      "interaction": "Checkboxes with confirmation dialog for risky permissions",
      "data_testid": [
        "permissions-matrix-table",
        "permissions-save-button"
      ]
    }
  },

  "motion_and_microinteractions": {
    "principles": [
      "Subtle, fast, purposeful",
      "Prefer opacity/translate transitions; avoid large bouncy easing",
      "Respect prefers-reduced-motion"
    ],
    "durations": {
      "fast": "150ms",
      "base": "200ms",
      "slow": "280ms"
    },
    "easing": {
      "standard": "cubic-bezier(0.2, 0.8, 0.2, 1)",
      "out": "cubic-bezier(0.16, 1, 0.3, 1)"
    },
    "allowed_transitions": {
      "rule": "Never use transition: all",
      "examples": [
        "transition-colors duration-200",
        "transition-opacity duration-150",
        "transition-shadow duration-200"
      ]
    },
    "patterns": {
      "hover": "Buttons: slight shade shift + shadow-sm -> shadow",
      "press": "active:scale-[0.98]",
      "page_enter": "opacity-0 translate-y-1 -> opacity-100 translate-y-0",
      "table_row": "hover highlight only",
      "skeleton": "Use shadcn Skeleton; avoid shimmer if it distracts"
    },
    "libraries": {
      "optional": {
        "framer_motion": {
          "why": "Consistent entrance animations + bottom sheet transitions",
          "install": "npm i framer-motion",
          "usage": "Use for scanner result sheet + dashboard card entrance; keep minimal"
        }
      }
    }
  },

  "charts": {
    "library": "Recharts",
    "styling": {
      "grid": "stroke: hsl(var(--border))",
      "axis": "tick fill: hsl(var(--muted-foreground))",
      "tooltip": "bg-card border border-border shadow-sm rounded-lg",
      "series": {
        "primary": "hsl(var(--chart-1))",
        "secondary": "hsl(var(--chart-2))",
        "warning": "hsl(var(--chart-4))",
        "danger": "hsl(var(--chart-5))"
      }
    },
    "empty_state": "Show Card with icon + 'No data for selected range' + reset filters",
    "data_testid": [
      "chart-tooltip",
      "chart-legend"
    ]
  },

  "accessibility": {
    "wcag": "AA",
    "rules": [
      "All interactive elements must be keyboard reachable",
      "Visible focus ring using ring token",
      "Minimum touch target 44x44 on mobile",
      "Use aria-label for icon-only buttons",
      "Use semantic headings and landmarks",
      "Color is never the only indicator: pair badges with text labels"
    ],
    "tables": [
      "Use proper <th scope=\"col\">",
      "Announce sorting state via aria-sort",
      "Provide caption or aria-label for table purpose"
    ],
    "scanner": [
      "Provide fallback: manual code input + upload image",
      "Announce scan success via toast + optional aria-live region"
    ]
  },

  "iconography": {
    "library": "lucide-react",
    "sizes": {
      "nav": "18",
      "table_actions": "16",
      "kpi": "18-20",
      "scanner": "20-24"
    },
    "stroke": "Use default stroke; avoid filled icons for enterprise consistency"
  },

  "images_and_illustrations": {
    "rule": "Avoid stocky hero photos; use subtle abstract shapes/noise. If images are needed, use neutral IT/warehouse photography sparingly.",
    "image_urls": [
      {
        "category": "login_background",
        "description": "Abstract, neutral, enterprise-friendly background image (optional). Use with low opacity overlay; keep text on solid card.",
        "urls": []
      },
      {
        "category": "empty_states",
        "description": "Use lucide icons + simple SVG illustrations (local) rather than photos.",
        "urls": []
      }
    ]
  },

  "implementation_notes": {
    "js_only": "Project uses .js (not .tsx). Keep component examples in JS and avoid TS-only patterns.",
    "testing": {
      "data_testid_rule": "All interactive and key informational elements MUST include data-testid (kebab-case).",
      "examples": [
        "data-testid=\"sidebar-nav-products\"",
        "data-testid=\"topbar-global-search\"",
        "data-testid=\"dashboard-kpi-low-stock\"",
        "data-testid=\"products-export-button\"",
        "data-testid=\"scanner-quick-exit-button\""
      ]
    },
    "performance": [
      "Paginate tables; avoid rendering 1000+ rows",
      "Debounce search input (200–300ms)",
      "Use Skeleton for loading states",
      "Prefer Drawer/Sheet for mobile filters"
    ]
  },

  "instructions_to_main_agent": [
    "Replace default CRA App.css centered header styles; do not center the entire app container.",
    "Update /app/frontend/src/index.css :root and .dark tokens to match the provided HSL values.",
    "Add Google Fonts (Space Grotesk, IBM Plex Sans, IBM Plex Mono) in index.html or via CSS import; map Tailwind font families accordingly.",
    "Build an AppShell layout: Sidebar (desktop) + Sheet (mobile) + sticky Topbar with Breadcrumbs and Command-based global search.",
    "Use shadcn Table + ScrollArea for sticky headers; implement filter chips using Badge + Button (X) and persist filters in URL.",
    "Scanner page: keep html5-qrcode container mounted; bottom action dock with thumb-friendly buttons; add upload fallback.",
    "Ensure every button/input/link/table has stable data-testid attributes.",
    "Use Sonner for toasts; AlertDialog for destructive confirmations; Dialog/Drawer for quick edits and mobile flows.",
    "Charts: Recharts with restrained palette; avoid rainbow; provide empty states and tooltips with high contrast."
  ],

  "general_ui_ux_design_guidelines_appendix": "<General UI UX Design Guidelines>  \n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
