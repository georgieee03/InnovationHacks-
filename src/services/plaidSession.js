const STORAGE_KEYS = {
  formData: 'plaid:pending-form-data',
  linkToken: 'plaid:link-token',
  preparedSession: 'plaid:prepared-session',
  returnPath: 'plaid:return-path',
  resumeResult: 'plaid:resume-result',
};

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function getPlaidRedirectUri() {
  if (!isBrowser()) {
    return '';
  }

  return `${window.location.origin}/plaid-oauth.html`;
}

export function rememberPendingPlaidSession(formData) {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEYS.formData, JSON.stringify(formData));
  window.sessionStorage.setItem(
    STORAGE_KEYS.returnPath,
    `${window.location.pathname}${window.location.search}${window.location.hash}`
  );
}

export function getStoredPlaidFormData() {
  if (!isBrowser()) {
    return null;
  }

  return safeParse(window.sessionStorage.getItem(STORAGE_KEYS.formData));
}

export function storePlaidLinkToken(linkToken) {
  if (!isBrowser() || !linkToken) {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEYS.linkToken, linkToken);
}

export function storePlaidPreparedSession(preparedSession) {
  if (!isBrowser() || !preparedSession) {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEYS.preparedSession, JSON.stringify(preparedSession));
}

export function getStoredPlaidPreparedSession() {
  if (!isBrowser()) {
    return null;
  }

  return safeParse(window.sessionStorage.getItem(STORAGE_KEYS.preparedSession));
}

export function getStoredPlaidLinkToken() {
  if (!isBrowser()) {
    return '';
  }

  return window.sessionStorage.getItem(STORAGE_KEYS.linkToken) || '';
}

export function clearStoredPlaidLinkToken() {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.removeItem(STORAGE_KEYS.linkToken);
}

export function setPlaidResumeResult(result) {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEYS.resumeResult, JSON.stringify(result));
}

export function consumePlaidResumeResult() {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEYS.resumeResult);
  window.sessionStorage.removeItem(STORAGE_KEYS.resumeResult);
  return raw ? safeParse(raw) : null;
}

export function getPlaidReturnPath() {
  if (!isBrowser()) {
    return '/';
  }

  return window.sessionStorage.getItem(STORAGE_KEYS.returnPath) || '/';
}

export function clearPendingPlaidSession() {
  if (!isBrowser()) {
    return;
  }

  Object.values(STORAGE_KEYS).forEach((storageKey) => {
    window.sessionStorage.removeItem(storageKey);
  });
}
