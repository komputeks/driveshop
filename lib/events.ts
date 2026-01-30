const GAS = process.env.NEXT_PUBLIC_API_BASE_URL!;

let queue: any[] = [];
let timer: any = null;

export function sendEvent(e: any) {
  queue.push(e);

  if (!timer) {
    timer = setTimeout(flush, 3000);
  }
}

async function flush() {
  const batch = [...queue];
  queue = [];
  timer = null;

  if (!batch.length) return;

  try {
    await fetch(GAS + "?path=event/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items: batch }),
    });
  } catch {
    queue.unshift(...batch); // retry later
  }
}