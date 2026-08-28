import colyseusBrowserUrl from "../../node_modules/@colyseus/sdk/dist/colyseus.js?url";
import type { Callbacks as CallbacksClass, Client as ClientClass, Room } from "@colyseus/sdk";

interface ColyseusBrowserExports {
  Client: typeof ClientClass;
  Callbacks: typeof CallbacksClass;
}

declare global {
  interface Window { Colyseus?: ColyseusBrowserExports }
}

async function loadColyseusBrowser(): Promise<ColyseusBrowserExports> {
  if (window.Colyseus?.Client && window.Colyseus.Callbacks) return window.Colyseus;
  const existing = document.querySelector<HTMLScriptElement>("script[data-colyseus-browser]");
  await new Promise<void>((resolveLoad, rejectLoad) => {
    const script = existing ?? document.createElement("script");
    const loaded = () => resolveLoad();
    const failed = () => rejectLoad(new Error("Colyseus browser SDK failed to load"));
    script.addEventListener("load", loaded, { once: true });
    script.addEventListener("error", failed, { once: true });
    if (!existing) {
      script.dataset.colyseusBrowser = "true";
      script.src = colyseusBrowserUrl;
      document.head.append(script);
    }
  });
  if (!window.Colyseus?.Client || !window.Colyseus.Callbacks) throw new Error("Colyseus browser SDK did not expose its API");
  return window.Colyseus;
}

const sdk = await loadColyseusBrowser();
export const Client: typeof ClientClass = sdk.Client;
export const Callbacks: typeof CallbacksClass = sdk.Callbacks;
export type { Room };
