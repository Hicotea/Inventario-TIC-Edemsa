// Central place for data-testid values for stable test hooks.
export const TID = {
  // Auth
  loginEmail: "login-email-input",
  loginPassword: "login-password-input",
  loginSubmit: "login-submit-button",
  // Topbar / Sidebar
  topbarUserMenu: "topbar-user-menu",
  topbarLogout: "topbar-logout-button",
  topbarSearch: "topbar-global-search",
  sidebarNav: (key) => `sidebar-nav-${key}`,
  // Dashboard
  kpi: (key) => `dashboard-kpi-${key}`,
  chartMovements: "dashboard-chart-movements-over-time",
  chartCategory: "dashboard-chart-category-distribution",
  alertsPanel: "dashboard-panel-alerts",
  // Products
  productsSearch: "products-search-input",
  productsCreate: "products-create-button",
  productsTable: "products-table",
  productsExport: "products-export-button",
  productRow: (id) => `products-row-${id}`,
  // Product form
  pfSave: "product-form-save-button",
  pfName: "product-form-name-input",
  pfSku: "product-form-sku-input",
  // Movements
  movementsTabs: "movements-tabs",
  movementsExport: "movements-export-button",
  movementProduct: "movement-product-lookup",
  movementQty: "movement-quantity-input",
  movementSubmit: "movement-submit-button",
  // Scanner
  scannerStart: "scanner-start-button",
  scannerStop: "scanner-stop-button",
  scannerManualInput: "scanner-manual-code-input",
  scannerManualSubmit: "scanner-manual-submit-button",
  scannerResult: "scanner-result-sheet",
  scannerQuickEntry: "scanner-quick-entry-button",
  scannerQuickExit: "scanner-quick-exit-button",
  scannerView: "scanner-view-product-button",
};
