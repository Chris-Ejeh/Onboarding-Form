import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { server } from "./msw/server";

configure({ testIdAttribute: "data-test" });

// globals true, no need to import beforeAll from 'vitest'
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  server.events.removeAllListeners();
});
afterAll(() => server.close());
