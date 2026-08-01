let csrfToken: string | null = null;

export const csrf = {
  get: () => csrfToken,
  set: (token: string | null | undefined) => {
    csrfToken = token ?? null;
  },
};
