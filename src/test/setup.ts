import { server } from "./msw/server";

// globals true, no need to import beforeAll from 'vitest'
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  server.events.removeAllListeners();
});
afterAll(() => server.close());
