export async function logoutClient() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  }
  