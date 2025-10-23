import WebApp from '@twa-dev/sdk';

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
  WebApp.BackButton.show();
  WebApp.BackButton.onClick(callback);
}

/**
 * Hide Back Button
 */
export function hideBackButton() {
  WebApp.BackButton.hide();
}

/**
 * Show Main Button
 */
export function showMainButton(text: string, callback: () => void) {
  WebApp.MainButton.setText(text);
  WebApp.MainButton.show();
  WebApp.MainButton.onClick(callback);
}

/**
 * Hide Main Button
 */
export function hideMainButton() {
  WebApp.MainButton.hide();
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


