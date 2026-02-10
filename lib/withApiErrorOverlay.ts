// @/lib/withApiErrorOverlay.ts
import { NextResponse } from "next/server";

type RouteHandler<T = any> = () => Promise<T | Response>;

export function withApiErrorOverlay(handler: RouteHandler) {
  return async function wrappedHandler() {
    try {
      const result = await handler();

      // Allow handlers to return NextResponse directly
      if (result instanceof Response) {
        return result;
      }

      return NextResponse.json(result);
    } catch (err: any) {
      const isDev = process.env.NODE_ENV === "development";

      const overlay = {
        time: new Date().toLocaleTimeString(),
        label: "API Error (Server)",
        message: err?.message ?? String(err),
        action: err?.action,
        payload: err?.payload,
        response: err?.response,
        durationMs: err?.durationMs,
        stack: isDev ? err?.stack : undefined,
      };

      return NextResponse.json(
        {
          ok: false,
          error: overlay.message,
          ...(isDev && { __overlay: overlay }),
        },
        { status: 500 }
      );
    }
  };
}



// import { withApiErrorOverlay } from "@/lib/withApiErrorOverlay";
// import { apiFetchServer } from "@/lib/typedFetch";

// export const GET = withApiErrorOverlay(async () => {
//   return apiFetchServer("https://jsonplaceholder.typicode.com/todos/1", {
//     method: "GET",
//     action: "fetch-todo",
//   });
// });