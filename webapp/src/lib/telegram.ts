import WebApp from '@twa-dev/sdk';

// Track current button handlers to properly detach them between pages
let currentMainButtonHandler: (() => void) | null = null;
let currentBackButtonHandler: (() => void) | null = null;

/**
 * Initialize Telegram Web App
 */
export function initTelegram() {
  WebApp.ready();
  WebApp.expand();

  // Set theme colors
  if (WebApp.themeParams.bg_color) {
    document.body.style.backgroundColor = WebApp.themeParams.bg_color;
  }
}

/**
 * Get Telegram initData for API authentication
 */
export function getTelegramInitData(): string {
  return WebApp.initData;
}

/**
 * Show Back Button
 */
export function showBackButton(callback: () => void) {
  // Detach previous handler if any
  if (currentBackButtonHandler) {
    WebApp.BackButton.offClick(currentBackButtonHandler);
  }

  WebApp.BackButton.show();
  WebApp.BackButton.onClick(callback);
  currentBackButtonHandler = callback;
}

/**
 * Hide Back Button
 */
export function hideBackButton() {
  WebApp.BackButton.hide();
  if (currentBackButtonHandler) {
    WebApp.BackButton.offClick(currentBackButtonHandler);
    currentBackButtonHandler = null;
  }
}

/**
 * Show Main Button
 */
export function showMainButton(text: string, callback: () => void) {
  // Detach previous handler if any
  if (currentMainButtonHandler) {
    WebApp.MainButton.offClick(currentMainButtonHandler);
  }

  WebApp.MainButton.setText(text);
  WebApp.MainButton.show();
  WebApp.MainButton.onClick(callback);
  currentMainButtonHandler = callback;
}

/**
 * Hide Main Button
 */
export function hideMainButton() {
  WebApp.MainButton.hide();
  if (currentMainButtonHandler) {
    WebApp.MainButton.offClick(currentMainButtonHandler);
    currentMainButtonHandler = null;
  }
}

/**
 * Show loading on Main Button
 */
export function showMainButtonProgress() {
  WebApp.MainButton.showProgress();
}

/**
 * Hide loading on Main Button
 */
export function hideMainButtonProgress() {
  WebApp.MainButton.hideProgress();
}

/**
 * Close Web App
 */
export function closeApp() {
  WebApp.close();
}

/**
 * Show alert
 */
export function showAlert(message: string, callback?: () => void) {
  WebApp.showAlert(message, callback);
}

/**
 * Open external link
 */
export function openLink(url: string) {
  WebApp.openLink(url);
}

export default WebApp;


