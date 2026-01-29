const GAS = process.env.NEXT_PUBLIC_GAS_URL!;

async function post(path: string, email: string) {
  const res = await fetch(GAS + "?path=" + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });

  return res.json();
}

/* ================= API ================= */

export function getAdminStats(email: string) {
  return post("admin", email + '" , "action":"stats'); // handled in GAS
}

export function getAdminUsers(email: string) {
  return post("admin/users", email);
}

export function getAdminAssets(email: string) {
  return post("admin/assets", email);
}

export function getAdminEvents(email: string) {
  return post("admin/events", email);
}


/* ============ MODERATION ============ */

export function banUser(email: string, admin: string) {
  return post("admin/user/ban", admin, { email });
}

export function unbanUser(email: string, admin: string) {
  return post("admin/user/unban", admin, { email });
}

export function hideAsset(id: string, admin: string) {
  return post("admin/asset/hide", admin, { id });
}

export function showAsset(id: string, admin: string) {
  return post("admin/asset/show", admin, { id });
}

