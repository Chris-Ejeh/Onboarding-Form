# Onboarding Form — Technical Specification

**Status:** Draft · **Owner:** Chris Ejeh · **Last updated:** 2026-09-05

A single-page onboarding form capturing a user's personal and business details,
with synchronous field validation, asynchronous verification of the corporation
number, and submission to a remote profile endpoint.

---

## 1. Goals and non-goals

### Goals

- Collect and validate four fields: first name, last name, phone number, corporation number.
- Validate on blur, including a network round-trip for the corporation number.
- Block submission until every field is valid; surface per-field messages inline.
- POST a validated payload and report success or server-side failure to the user.
- Ship code that reads as production work: layered, DRY, typed, tested, accessible.

### Non-goals

- Authentication, sessions, or persistence between visits.
- Multi-step wizards, draft saving, or resuming a partially completed form.
- Internationalised copy or phone numbers outside the `+1` country code.
- A design-system package. Presentational primitives live in this repo only.

---

## 2. Stack

| Concern | Choice | Rationale |
| --- | --- | --- |
| Build / dev server | Vite 8 + React 19 + TypeScript | Fast, minimal config; no server-side rendering requirement exists. |
| Form state | React Hook Form | Uncontrolled inputs keep re-renders to the field that changed; first-class `onBlur` mode and imperative `setError` for async results. |
| Schema / validation | Zod 4 + `@hookform/resolvers` | One schema is the single source of truth for both runtime validation and the form's types. |
| HTTP client | axios | Defaults handle the API's mixed response formats (§6) without hand-written content-type sniffing; typed errors carry status and parsed body. |
| Async cache | TanStack Query 5 | Used imperatively via `queryClient.query()` for corporation-number verification — supplies the result cache and in-flight dedup that make the submit-time re-check free (§7). |
| Styling | Tailwind CSS v4 (Vite plugin) | Utility classes keep styling beside the markup in a single-screen app; build-time only, no runtime. |
| Test runner | Vitest + jsdom | Shares the Vite transform pipeline — one config, aliases and `import.meta.env` work without duplication. |
| Component testing | React Testing Library + user-event | Tests exercise the form the way a user does. |
| Network mocking | MSW | Intercepts at the network layer, so production code under test uses its real request path. |
| Linting | ESLint (flat config) + typescript-eslint + react-hooks | Enforces hook rules, which this design leans on. |

TypeScript runs with `strict` and `erasableSyntaxOnly`. The latter rules out
`enum`, namespaces, and parameter properties — use union types and explicit
field declarations instead.

---

## 3. Architecture

Three layers, with a strict dependency direction: lower layers know nothing
about higher ones.

```
┌─────────────────────────────────────────────────────────┐
│  Presentation      OnboardingForm, TextField, Button    │
│                    Renders. Holds no business rules.    │
└────────────────────────────┬────────────────────────────┘
                             │ props / handlers
┌────────────────────────────▼────────────────────────────┐
│  Domain            useCorporationNumberCheck            │
│                    onBoardingSchema, constants          │
│                    Decides. Owns validation + orchestr. │
└────────────────────────────┬────────────────────────────┘
                             │ typed function calls
┌────────────────────────────▼────────────────────────────┐
│  Data              api/clients, api/corporation-number, │
│                    api/onboarding-details               │
│                    Fetches. Maps HTTP to typed results. │
└─────────────────────────────────────────────────────────┘
```

Invariants:

1. No HTTP call appears in a component or a hook — only in `src/api/`.
2. No validation rule appears in a component — only in the schema or the check hook.
3. No API URL is written outside `src/api/`; the base URL comes from `import.meta.env`.
4. No user-facing copy is written in `src/api/`; messages live in `src/constants.ts`.

### 3.1 Project structure

```
src/
  api/
    clients.ts                    # axios instance + error narrowing helpers
    corporation-number.ts         # getCorporationNumber + response type
    onboarding-details.ts         # submitProfileDetails
  components/
    button/Button.tsx
    text-field/TextField.tsx      # label + input + error, forwardRef
    onboarding-form/
      OnboardingForm.tsx          # composition, layout, submit orchestration
      types.ts                    # OnboardingFormTypes
  hooks/
    useCorporationNumberCheck.ts  # async verification, cached via TanStack Query
  models/
    onBoardingSchema.ts           # zod schema
  constants.ts                    # default values + user-facing copy
  test/
    setup.ts
    msw/handlers.ts
    msw/server.ts
    utils.tsx                     # renderForm(), fillValidForm()
  main.tsx
  App.tsx
```

---

## 4. Data model

```ts
export type OnboardingFormTypes = z.infer<typeof onBoardingFormSchema>;
// {
//   firstName: string;
//   lastName: string;
//   phone: string;              // "+1XXXXXXXXXX" — transform output
//   corporationNumber: string;  // 9 digits
// }
```

`phone` carries a Zod `.transform()`, so the schema has two types: the input
(10 digits, what the user types and what lives in form state) and the output
(`+1` prefixed, what `handleSubmit` receives and what is posted). `z.infer`
resolves to the **output** type. Both are `string`, so a single generic on
`useForm` type-checks; the three-generic form
(`useForm<z.input<S>, unknown, z.output<S>>`) documents the distinction more
precisely and is optional.

The POST payload is structurally identical to the output type; no mapping layer
is required.

---

## 5. Validation specification

All rules are evaluated against the **trimmed** value. Every field is required.
Messages live in `src/constants.ts` so tests assert against the same constants
the UI renders.

| Field | Rule | Message |
| --- | --- | --- |
| `firstName` | non-empty | `First name is required` |
| `firstName` | ≤ 50 characters | `First name must be 50 characters or less` |
| `lastName` | non-empty | `Last name is required` |
| `lastName` | ≤ 50 characters | `Last name must be 50 characters or less` |
| `phone` | non-empty | `Phone number is required` |
| `phone` | matches `/^\d{10}$/`, then transformed to `+1…` | `Enter a valid 10-digit Canadian phone number` |
| `corporationNumber` | non-empty | `Corporation number is required` |
| `corporationNumber` | digits only, length 9 | `Corporation number must be 9 digits` |
| `corporationNumber` | verified by API | `Invalid Corporation Number` |

Rule order matters: the non-empty check comes first in each chain, so an empty
field reports "is required" rather than a format message.

### 5.1 Rules of interpretation

- **The user types 10 digits; the schema adds `+1`.** The requirement states the
  submitted value must be `+1XXXXXXXXXX` with no special characters beyond the
  leading `+`. Rather than making the user type a country code they cannot vary,
  the field accepts 10 digits and a Zod `.transform()` produces the E.164 value.
  The input shows a placeholder (`2084546666`) and caps at `maxLength={10}`.
- **Country code only, no area-code allowlist.** `+1` is shared across the North
  American Numbering Plan, so a client-side check cannot prove a number is
  Canadian. A hardcoded area-code list would go stale; the backend is the
  authority. `libphonenumber-js` could verify properly but costs substantial
  metadata for a single-country form — rejected deliberately, documented in the
  README.
- **Reject rather than normalise.** `+1 416 555 1234` is invalid input, not input
  to be sanitised.
- **Length limits are validated, not truncated.** `maxLength` on the input stops
  overshoot as an affordance; the schema is what defines validity and what the
  tests run against.
- **Corporation number is a digit string, never a number.** `Number()` would drop
  leading zeros and split the Query cache key. It is an identifier, and the API
  returns it as a JSON string.

---

## 6. API contract

Base URL: `import.meta.env.VITE_API_BASE_URL`
(`https://fe-hometask-api.qa.vault.tryvault.com`, committed as `.env.example`).

Response shapes below were verified against the live API on 2026-09-05, and
differ from what the brief implies — see §6.3.

### 6.1 Verify corporation number

```
GET {base}/corporation-number/{number}
```

| Case | Status | Content-Type | Body |
| --- | --- | --- | --- |
| Valid | `200` | `application/json` | `{"corporationNumber":"826417395","valid":true}` |
| Invalid | **`404`** | `application/json` | `{"valid":false,"message":"Invalid corporation number"}` |
| Malformed (e.g. `12345`) | `404` | `application/json` | same as invalid |
| Unreachable | — | — | no response |

Note the invalid case is **404, not 400** — any status check must be a range
(`< 500`), not an equality test. The error body is itself a complete
`CorporationNumberResponse`.

Three outcomes must stay distinct: valid, invalid, and *unverifiable*. A user
whose number is genuinely fine must never be told it is invalid because the
network dropped.

### 6.2 Submit profile

```
POST {base}/profile-details
{ "firstName": "Hello", "lastName": "World",
  "corporationNumber": "826417395", "phone": "+13062776103" }
```

| Case | Status | Content-Type | Body |
| --- | --- | --- | --- |
| Success | `200` | **`text/plain`** | `OK` |
| Rejected | `400` | `application/json` | `{"message":"Invalid phone number"}` |
| Failure | other | — | — |

### 6.3 Client

`api/clients.ts` exposes a configured axios instance plus narrowing helpers
(`isApiError<T>`, `apiErrorStatus`, `apiErrorMessage`). axios is used
specifically because the two response formats above are mixed: success is
`text/plain`, failure is JSON. A hand-rolled `fetch` wrapper must sniff
`content-type` before parsing — assuming JSON throws a `SyntaxError` on the
literal string `OK`, which surfaces as a spurious submit failure.

`isApiError<T>` is generic so each call site names the body shape it expects;
`ApiErrorBody` describes only the common contract (an optional `message`).

---

## 7. Asynchronous corporation-number verification

Kept **out of the Zod schema**: a Zod `.refine()` with an async predicate runs on
every resolver pass, so blurring the phone field would fire an HTTP request for
the corporation number. It is an explicit, cached side effect instead.

### 7.1 `useCorporationNumberCheck`

```ts
{
  verify(value: string): Promise<CorporationNumberResponse>;
  isVerifying: boolean;
}
```

Implemented over `queryClient.query()` — TanStack Query used imperatively:

- **Cache.** `queryKey: ["corporation-number", value]` with `staleTime: "static"`.
  A verified value is never re-requested for the life of the session. `"static"`
  (not `Infinity`) means the entry is never refetched even by invalidation.
- **Dedup.** Concurrent checks of the same value share one in-flight promise,
  which is what lets the blur and the submit overlap safely.
- **`retry: false`.** A failure must surface immediately, not after backoff.
- **Answer vs failure.** The `queryFn` *returns* for a 4xx — the server answering
  "no" is a result, and gets cached. It *throws* for anything else, so a network
  failure is not cached and the next blur retries.
- **`isVerifying`** comes from `useIsFetching` scoped to the key prefix.
  `queryClient.query()` returns a promise and creates no subscription, so it
  cannot supply loading state itself.

The keys are value-scoped, so a response can never be applied to a different
number — which is why no `AbortController` is needed.

### 7.2 Field lifecycle

```
   blur ──▶ RHF sync validation ──invalid──▶ show format message, no request
                    │ valid
                    ▼
              verify(value)
                    │
      ┌─────────────┼──────────────┐
      ▼             ▼              ▼
  valid: true   valid: false     throws
  clearErrors   INVALID_         COULD_NOT_
                CORPORATION_     VERIFY
                NUMBER
```

The blur handler composes with `register("corporationNumber").onBlur` rather
than replacing it, so RHF's own validation still runs, and guards on
`getFieldState(...).error` so no request is made for a malformed value.

### 7.3 Submit-time guarantee

`handleSubmit` re-runs the resolver, which is Zod-only — **any error set via
`setError` is cleared by that re-validation**. A blur result therefore cannot be
relied upon to block submission, and `onSubmit` must consult `verify` again.

This is not a second request. With `staleTime: "static"` a completed check
resolves from cache, and an in-flight one is joined via dedup — so the call also
serves as the "wait for verification to finish" step. Blur and submit race by
construction, because clicking Submit is what blurs the field.

---

## 8. Form orchestration

```ts
useForm<OnboardingFormTypes>({
  resolver: zodResolver(onBoardingFormSchema),
  mode: "onBlur",
  reValidateMode: "onBlur",
  defaultValues: DEFAULT_FORM,
});
```

`reValidateMode: "onBlur"` matches the requirement literally and is a deliberate
deviation from RHF's `"onChange"` default.

### 8.1 Submit sequence

1. RHF validates the schema. Failures render inline; **no request is made**.
2. `await verify(corporationNumber)` — a falsy `valid` or a rejection sets the
   field error and returns before the POST.
3. `POST /profile-details`.
4. On success, reset the form and show a confirmation.
5. On failure, `setError("root", …)` with the server's `message` when present
   and `SUBMIT_ERROR_MESSAGE` otherwise.

**Server errors are not attributed to fields.** The API returns
`{ message: string }` with no field key, so any attribution would be regex
matching on prose — brittle, and least reliable in exactly the case it would be
used, since client-side validation already covers every field. Everything goes
to `root`.

### 8.2 Submit button

Always enabled; disabled only while work is in flight:

```tsx
<Button type="submit" disabled={isVerifying || isSubmitting}>
```

Gating on validity would break a stated requirement — submitting an empty form
must produce the per-field "is required" messages, which only happens if the
click goes through. `isSubmitting` covers the whole async handler including the
verification step; `isVerifying` covers the blur-triggered check, which runs
outside it.

---

## 9. UI specification

Reference: `design.png`. Colours sampled from the file directly.

### 9.1 Layout and colour

| Element | Value | Tailwind |
| --- | --- | --- |
| Page background | `#f5f5f5` | `bg-neutral-100` (exact match) |
| Card fill | `#ffffff` | `bg-white` |
| Card border | `#eeeeee` | `border-neutral-200` (or `border-[#eee]`) |
| Input border | `#e2e2e2` | `border-neutral-200` |
| Submit button | `#000000` | `bg-black` |

Card is `rounded-2xl`, `max-w-lg`, generously padded, centred in a
`min-h-svh` flex container. First and last name share a row and collapse to one
column below `sm`; phone and corporation number span full width. Submit is
full-width with a trailing arrow (inline SVG, `currentColor`, `aria-hidden`).

Tailwind Preflight strips native borders from form controls — inputs are
invisible until explicitly bordered.

### 9.2 `TextField`

One primitive owns label/input/error composition so accessibility cannot be
applied unevenly:

- `<label htmlFor>` bound to a generated id (`useId`).
- `aria-invalid` when an error is present.
- `aria-describedby` pointing at the error node.
- Error node carries `role="alert"`.
- `forwardRef` so `register()` spreads cleanly onto the input.

The page heading is an `<h1>`, and the `<form>` is named via
`aria-labelledby` so it registers as a landmark.

### 9.3 States

| State | Presentation |
| --- | --- |
| Default | Neutral border |
| Focused | Darker border / ring |
| Error | Red border, red message below |
| Verifying | Submit disabled; optional inline indicator |
| Submitting | Button disabled, label reads `Submitting…` |
| Success | Confirmation via `formState.isSubmitSuccessful`; form reset |

---

## 10. Error handling matrix

| Trigger | Where shown | Copy |
| --- | --- | --- |
| Empty required field on blur or submit | Under field | `<Field> is required` |
| Name over 50 characters | Under field | `<Field> must be 50 characters or less` |
| Malformed phone | Under field | `Enter a valid 10-digit Canadian phone number` |
| Corporation number not 9 digits | Under field | `Corporation number must be 9 digits` |
| Corporation number rejected (404) | Under field | `Invalid Corporation Number` |
| Corporation number check unreachable | Under field | `Couldn't verify corporation number. Please try again.` |
| `400` on submit | Form-level, above button | Server `message`, verbatim |
| Network / `5xx` on submit | Form-level, above button | `Something went wrong. Please try again.` |

Form-level errors render from `errors.root`, which RHF clears at the start of
each submit. **This slot must exist in the JSX** — without it, a failed
submission is silently invisible.

---

## 11. Testing strategy

Integration tests drive the rendered form through `user-event`; hooks are not
tested in isolation. MSW handles all network traffic. The ten valid corporation
numbers live **only** in `test/msw/handlers.ts` — never in application code.

`test/utils.tsx` provides `renderForm()`, which wraps the form in a
`QueryClientProvider` with a **fresh `QueryClient` per test**. A shared client
leaks its cache between tests, so an invalid-number test could read a previous
test's cached result and pass for the wrong reason.

| ID | Scenario | Assertion |
| --- | --- | --- |
| T1 | Initial render | All four fields and the submit button are reachable by label/role |
| T2 | Submit an empty form | Four required messages appear; **no** POST is issued |
| T3 | First name of 51 characters, blur | Length message appears |
| T4 | `416555123` (9 digits), blur | Phone format message appears |
| T5 | `+14165551234` (leading `+1`), blur | Phone format message appears |
| T6 | Valid corporation number, blur | No error; exactly one GET issued |
| T7 | Invalid corporation number (404), blur | `Invalid Corporation Number` under the field |
| T8 | Blur the same corporation number twice | Exactly one GET — asserts `staleTime: "static"` |
| T9 | Complete valid form, submit | POST body deep-equals the §6.2 payload, with `phone` as `+1…`; confirmation shown; form reset |
| T10 | Submit without ever blurring the corporation number | Verification runs, then POST |
| T11 | POST returns `400 {"message":"Invalid phone number"}` | Message rendered at form level |
| T12 | Corporation-number check fails with a network error | "Couldn't verify" message; **not** reported as invalid |
| T13 | Submit while a check is in flight | Button disabled; only one POST |
| T14 | POST returns `200` with `text/plain` body `OK` | Treated as success, not a parse failure |

Requests are asserted by recording them inside MSW handlers, never by stubbing
the HTTP client.

**Coverage intent:** validation rules, the verification hook including cache and
failure modes, and the full submit path. Styling and layout are out of scope —
jsdom has no layout engine.

---

## 12. Tooling

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b && vite build` — type errors fail the build |
| `npm run test` | Vitest watch |
| `npm run test:run` | Single pass, for CI |
| `npm run lint` | ESLint over `src/` |

`.env.example` is committed; `.env` is not. `tsconfig.app.json` runs `strict`
with `paths: { "@/*": ["./src/*"] }`, mirrored by `resolve.alias` in
`vite.config.ts` so the alias resolves for the bundler and for Vitest.
Vitest config lives in `vite.config.ts` under `test:`, enabled by
`/// <reference types="vitest/config" />`.

---

## 13. Decisions and open questions

Resolved during implementation:

1. **Corporation number character set** — treated as 9 digits. Every documented
   example is numeric and the API rejects non-numeric input with the same 404.
2. **Invalid-number status** — confirmed `404`, not `400` (§6.1).
3. **Success response format** — confirmed `text/plain` `OK`, not an empty body.
4. **Server message passthrough** — not used for the corporation number. The API
   sends `"Invalid corporation number"`; the design specifies
   `"Invalid Corporation Number"`. The local constant wins.
5. **No debounce** — validation is blur-triggered, not keystroke-triggered, and
   results are cached.

Open:

6. **Post-success behaviour** — no redirect target is specified; the form shows
   an inline confirmation and resets.

---

## 14. Implementation status

1. ✅ Scaffold, Tailwind, path alias, Vitest config
2. ✅ `TextField` and `Button`
3. ✅ Schema, constants, form layout
4. ✅ API layer (axios) and verification hook
5. ✅ Submit orchestration
6. ⬜ Render `errors.root` — currently set but not displayed (§10)
7. ⬜ Success confirmation via `isSubmitSuccessful` (§9.3)
8. ⬜ MSW handlers and the T1–T14 suite
9. ⬜ Styling pass against `design.png`; responsive check
10. ⬜ ESLint pass; README documenting §5.1 and §8.1 decisions
