type Action = "like" | "unlike" | "comment" | "edit" | "delete";

interface WritePayload {
  itemSlug: string;
  value?: string;
  eventId?: string;
}

export async function apiWrite(action: Action, endpoint: string, payload: WritePayload) {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, ...payload }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "API write failed");
    }

    return data;
  } catch (err) {
    console.error(`apiWrite ${action} failed:`, err);
    throw err;
  }
}