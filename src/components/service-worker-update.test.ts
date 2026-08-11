import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

type WorkerHandlers = Record<string, (event: Record<string, unknown>) => void>;

function createWorkerHarness() {
  const template = fs.readFileSync(path.join(process.cwd(), "public/sw.template.js"), "utf8");
  const stores = new Map<string, Map<string, string>>();
  let deployedShell = "commit-a";
  let online = true;

  function loadWorker(buildId: string) {
    const source = template.replaceAll("__BUILD_ID__", buildId);
    const handlers: WorkerHandlers = {};
    const caches = {
      open: async (name: string) => {
        let store = stores.get(name);
        if (!store) {
          store = new Map();
          stores.set(name, store);
        }
        return {
          addAll: async (paths: string[]) => {
            for (const item of paths) store.set(item, deployedShell);
          },
        };
      },
      keys: async () => [...stores.keys()],
      delete: async (name: string) => stores.delete(name),
      match: async (request: string | { url: string }) => {
        const key = typeof request === "string" ? request : new URL(request.url).pathname;
        for (const store of stores.values()) {
          if (store.has(key)) return store.get(key);
        }
      },
    };
    const self = {
      location: {
        origin: "https://app.example",
        href: `https://app.example/sw.js?v=${buildId}`,
      },
      addEventListener: (type: string, handler: WorkerHandlers[string]) => {
        handlers[type] = handler;
      },
      skipWaiting() {},
      clients: { claim() {} },
    };

    vm.runInNewContext(source, {
      self,
      caches,
      URL,
      fetch: async () => {
        if (!online) throw new Error("offline");
        return deployedShell;
      },
      Promise,
    });

    return {
      async lifecycle(type: "install" | "activate") {
        let pending: Promise<unknown> | undefined;
        handlers[type]({
          waitUntil(value: Promise<unknown>) {
            pending = value;
          },
        });
        await pending;
      },
      async navigateOffline() {
        let response: Promise<string> | undefined;
        handlers.fetch({
          request: { method: "GET", mode: "navigate", url: "https://app.example/" },
          respondWith(value: Promise<string>) {
            response = value;
          },
        });
        return response;
      },
    };
  }

  return {
    loadWorker,
    deploy(shell: string) {
      deployedShell = shell;
    },
    goOffline() {
      online = false;
    },
    cacheNames: () => [...stores.keys()],
  };
}

describe("service worker updates", () => {
  it("replaces the installed shell when a new application build is deployed", async () => {
    const harness = createWorkerHarness();
    const firstWorker = harness.loadWorker("commit-a");
    await firstWorker.lifecycle("install");
    await firstWorker.lifecycle("activate");

    harness.deploy("commit-b");
    const nextWorker = harness.loadWorker("commit-b");
    await nextWorker.lifecycle("install");
    await nextWorker.lifecycle("activate");
    harness.goOffline();

    await expect(nextWorker.navigateOffline()).resolves.toBe("commit-b");
    expect(harness.cacheNames()).toEqual(["peace-valley-shell-commit-b"]);
  });
});
