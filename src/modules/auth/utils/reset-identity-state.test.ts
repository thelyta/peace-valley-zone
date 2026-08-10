import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { csrf } from "@/lib/csrf";
import { resetIdentityState } from "./reset-identity-state";

describe("resetIdentityState", () => {
  it("clears cached identity data, UI selection, and the CSRF token together", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["auth", "session"], { user: { id: "old-user" } });
    csrf.set("old-csrf-token");
    const clearSelection = vi.fn();

    await resetIdentityState(queryClient, clearSelection);

    expect(queryClient.getQueryData(["auth", "session"])).toBeUndefined();
    expect(clearSelection).toHaveBeenCalledOnce();
    expect(csrf.get()).toBeNull();
  });
});
