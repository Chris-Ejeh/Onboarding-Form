# Onboarding Form — Technical Specification

**Status:** Draft · **Owner:** Chris Ejeh · **Last updated:** 2026-09-04

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

| Concern             | Choice                                                 | Rationale                                                                                  |
| ------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Build / dev server  | Vite + React 19 + TypeScript                           | Fast, minimal config; no server-side rendering requirement exists.                         |
| Form state          | React Hook Form                                        | light, performant (less code and remove re-rendering) and fast mounting                    |
| Schema / validation | Zod + `@hookform/resolvers`                            | Typescript first schema validation, modern and light weight                                |
| Styling             | Tailwind CSS v4 (Vite plugin)                          | Keep style next to html (easy to read); no runtime cost with plugin.                       |
| Test runner         | Vitest + jsdom                                         | Shares the Vite transform pipeline — one config, no duplicate build setup.                 |
| Component testing   | React Testing Library + user-event                     | Tests the form the way a user does.                                                        |
| Network mocking     | MSW                                                    | Intercepts at the network layer, so production code under test uses the real `fetch` path. |
| Linting             | ESLint (flat config) + typescript-eslint + react-hooks | Enforces hook rules.                                                                       |

---

## 3. Architecture

Three layers, with a strict dependency direction. Nothing flows upward.

```
┌─────────────────────────────────────────────────────────┐
│  Presentation      OnboardingForm, TextField, Button    │
│                    Renders. Holds no business rules.    │
└────────────────────────────┬────────────────────────────┘
                             │ props / handlers
┌────────────────────────────▼────────────────────────────┐
│  Domain            useOnboardingForm                    │
│                    useCorporationNumberCheck            │
│                    schema.ts                            │
│                    Decides. Owns validation + orchestr. │
└────────────────────────────┬────────────────────────────┘
                             │ typed function calls
┌────────────────────────────▼────────────────────────────┐
│  Data              api/client.ts, api/onboarding.ts     │
│                    Fetches. Maps HTTP to typed results. │
└─────────────────────────────────────────────────────────┘
```

Invariants:

1. No `fetch` call appears in a component or a hook — only in `src/api/`.
2. No validation rule appears in a component — only in `schema.ts` or the async check hook.
3. No API URL is written outside `src/api/`; the base URL comes from `import.meta.env`.

### 3.1 Project structure

```
src/
  api/
    client.ts                     # fetch wrapper; throws ApiError
    onboarding.ts                 # checkCorporationNumber, submitProfileDetails
    types.ts                      # wire-format types
  features/onboarding/
    OnboardingForm.tsx            # composition + layout
    schema.ts                     # zod schema, OnboardingFormValues
    messages.ts                   # user-facing copy, single source
    hooks/
      useOnboardingForm.ts        # RHF config, blur/submit orchestration
      useCorporationNumberCheck.ts# async validation, cache, abort
  components/ui/
    TextField.tsx                 # label + input + error, forwardRef
    Button.tsx
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
// features/onboarding/schema.ts
export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
// {
//   firstName: string;
//   lastName: string;
//   phone: string;              // E.164, "+1XXXXXXXXXX"
//   corporationNumber: string;  // 9 digits
// }
```

The POST payload is structurally identical to `OnboardingFormValues`; no mapping
layer is required. Should they ever diverge, add an explicit `toProfilePayload()`
in `api/onboarding.ts` rather than reshaping inside the submit handler.

---

## 5. Validation specification

All rules are evaluated against the **trimmed** value. Every field is required.

| Field               | Rule                    | Message                                                |
| ------------------- | ----------------------- | ------------------------------------------------------ |
| `firstName`         | non-empty               | `First name is required`                               |
| `firstName`         | ≤ 50 characters         | `First name must be 50 characters or less`             |
| `lastName`          | non-empty               | `Last name is required`                                |
| `lastName`          | ≤ 50 characters         | `Last name must be 50 characters or less`              |
| `phone`             | non-empty               | `Phone number is required`                             |
| `phone`             | matches `/^\+1\d{10}$/` | `Enter a valid Canadian phone number starting with +1` |
| `corporationNumber` | non-empty               | `Corporation number is required`                       |
| `corporationNumber` | matches `/^\d{9}$/`     | `Corporation number must be 9 digits`                  |
| `corporationNumber` | verified by API         | `Invalid Corporation Number`                           |

Message copy lives in `messages.ts` so tests assert against the same constants the
UI renders, and copy changes never break tests silently.

### 5.1 Rules of interpretation

- **Reject rather than normalise.** The requirement states the phone number must
  not contain special characters other than a leading `+`. `+1 416 555 1234` and
  `+1-416-555-1234` are therefore invalid input, not input to be sanitised. The
  regex enforces exactly one accepted shape.
- **Country code only, no area-code allowlist.** `+1` is shared across the North
  American Numbering Plan, so a client-side check cannot fully prove a number is
  Canadian. A hardcoded area-code list would go stale and reject legitimate new
  codes; the backend remains the authority. _(Optional tightening, if a reviewer
  expects stricter format checking: `/^\+1[2-9]\d{2}[2-9]\d{6}$/`, which enforces
  the NANP rule that area code and exchange cannot begin with 0 or 1.)_
- **Length limits are validated, not truncated.** The 50-character cap is a Zod
  rule rather than a `maxLength` attribute, so the user is told why the value was
  rejected instead of silently losing keystrokes.
- **Digits assumption.** The requirement says the corporation number is "9 chars"
  and every documented example is numeric, so this spec treats it as 9 digits.
  If non-numeric identifiers are possible, relax to `.length(9)` — a one-line change.

---

## 6. API contract

Base URL: `import.meta.env.VITE_API_BASE_URL`
(`https://fe-hometask-api.qa.vault.tryvault.com`, committed as `.env.example`).

### 6.1 Verify corporation number

```
GET {base}/corporation-number/{number}
```

| Response                        | Body                                                          | Interpretation                        |
| ------------------------------- | ------------------------------------------------------------- | ------------------------------------- |
| `200`                           | `{ "corporationNumber": "123456789", "valid": true }`         | Valid                                 |
| `200` / `4xx`                   | `{ "valid": false, "message": "Invalid corporation number" }` | Invalid                               |
| `5xx`, network failure, timeout | —                                                             | **Unknown** — not the same as invalid |

The three-way outcome matters: a user whose number is genuinely fine must never
be told it is invalid because the network dropped.

### 6.2 Submit profile

```
POST {base}/profile-details
Content-Type: application/json

{ "firstName": "Hello", "lastName": "World",
  "corporationNumber": "826417395", "phone": "+13062776103" }
```

| Response                | Body                                    | Interpretation                                 |
| ----------------------- | --------------------------------------- | ---------------------------------------------- |
| `200`                   | _(empty)_                               | Success                                        |
| `400`                   | `{ "message": "Invalid phone number" }` | Server-side rejection; surface `message`       |
| other / network failure | —                                       | Generic failure message, form remains editable |

### 6.3 Client

`api/client.ts` exposes a thin `request()` wrapper that sets JSON headers, parses
the body defensively (a 200 with an empty body must not throw), and raises a typed
`ApiError { status, message }`. Every endpoint function returns a typed result;
callers never see a `Response` object.

---

## 7. Asynchronous corporation-number verification

The most complex behaviour in the app, and deliberately kept **out of the Zod
schema**. A Zod `.refine()` with an async predicate runs on every resolver pass,
so blurring the phone field would fire an unrelated HTTP request for the
corporation number. Instead the check is an explicit, cached side effect.

### 7.1 `useCorporationNumberCheck`

```ts
type CheckResult = "valid" | "invalid" | "unknown";

interface UseCorporationNumberCheck {
  check(value: string): Promise<CheckResult>;
  isChecking: boolean;
}
```

Behaviour:

- **Cache.** Results are memoised in a `Map<string, CheckResult>` keyed by the
  value. Re-blurring an unchanged field costs no request. `'unknown'` results are
  **not** cached, so a transient failure can be retried.
- **Abort.** An `AbortController` is held per in-flight request and aborted when a
  newer check starts, preventing a slow stale response from overwriting a newer one.
- **Cleanup.** The controller is aborted on unmount; no state is set afterwards.
- **Gate.** The caller only invokes `check()` for values that already pass the
  synchronous 9-digit rule, so malformed input never reaches the network.

### 7.2 Field lifecycle

```
                  ┌──────────────────────────────────────────┐
   blur ─────────▶│ sync valid? ──no──▶ show format message   │
                  └────┬─────────────────────────────────────┘
                       │ yes
                       ▼
                cached? ──yes──▶ apply cached result
                       │ no
                       ▼
                  isChecking = true, submit disabled
                       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
    'valid'        'invalid'        'unknown'
  clearErrors   setError(field,    setError(field,
                 INVALID_CORP)      COULD_NOT_VERIFY)
```

### 7.3 Submit-time guarantee

`handleSubmit` runs Zod validation only, so a user who tabs straight to Submit
could otherwise POST an unverified number. The submit handler therefore awaits
`check(values.corporationNumber)` before the POST. Because of the cache this is a
no-op when the user has already blurred the field, so the happy path costs one
request in total.

---

## 8. Form orchestration

`useOnboardingForm` owns all of it and returns only what the view needs.

```ts
useForm<OnboardingFormValues>({
  resolver: zodResolver(onboardingSchema),
  mode: "onBlur",
  reValidateMode: "onBlur",
  defaultValues: {
    firstName: "",
    lastName: "",
    phone: "",
    corporationNumber: "",
  },
});
```

`reValidateMode: 'onBlur'` matches the requirement literally. React Hook Form
defaults to `'onChange'` after the first submit, which clears errors as the user
types and arguably feels better — this is a deliberate deviation from the default,
and worth a code comment saying so.

### 8.1 Submit sequence

1. RHF validates the schema. Failures render inline; **no request is made**.
2. Clear any previous form-level error.
3. `await check(corporationNumber)` — `'invalid'` or `'unknown'` sets the field
   error and aborts before the POST.
4. `POST /profile-details`.
5. On `200`, enter the success state and reset the form.
6. On `ApiError` with status `400`, route the message: if it names a field
   (`/phone/i`, `/corporation/i`, `/first ?name/i`, `/last ?name/i`), `setError`
   on that field; otherwise `setError('root')` for a form-level banner.
7. On any other failure, set a generic `root` error. The form stays editable and
   fully populated.

Submit is disabled while `isSubmitting || isChecking`, which also prevents
double-submission.

---

## 9. UI specification

Reference: `design.png`.

### 9.1 Layout

- Page: light grey background (`bg-neutral-100`), content centred vertically and horizontally.
- Card: white, `rounded-2xl`, `border border-neutral-200`, generous padding, `max-w-lg`.
- Heading: "Onboarding Form", centred, ~`text-2xl`, normal weight.
- First name and last name share a row: `grid grid-cols-1 sm:grid-cols-2 gap-4`.
- Phone number and corporation number each span the full width.
- Submit: full-width, black, white label, `rounded-lg`, `Submit →`.
- Errors render directly beneath their field in red, at a smaller size.

### 9.2 `TextField`

A single primitive owns label/input/error composition so accessibility cannot be
forgotten in one field and remembered in another:

- `<label htmlFor>` bound to a generated `id` (`useId`).
- `aria-invalid` when an error is present.
- `aria-describedby` pointing at the error node's id.
- Error node carries `role="alert"` so it is announced.
- `forwardRef` so RHF's `register()` spreads cleanly onto the input.

This also makes tests query by accessible role and label rather than by CSS class.

### 9.3 States

| State                       | Presentation                               |
| --------------------------- | ------------------------------------------ |
| Default                     | Neutral border                             |
| Focused                     | Darker border / ring                       |
| Error                       | Red border, red message below              |
| Corporation number checking | Subtle inline indicator; submit disabled   |
| Submitting                  | Button disabled, label reads `Submitting…` |
| Success                     | Confirmation replaces or precedes the form |

Responsive: single column below the `sm` breakpoint; the card fills available
width with margin on small screens.

---

## 10. Error handling matrix

| Trigger                                | Where shown              | Copy                                                    |
| -------------------------------------- | ------------------------ | ------------------------------------------------------- |
| Empty required field on blur or submit | Under field              | `<Field> is required`                                   |
| Name over 50 characters                | Under field              | `<Field> must be 50 characters or less`                 |
| Malformed phone                        | Under field              | `Enter a valid Canadian phone number starting with +1`  |
| Corporation number not 9 digits        | Under field              | `Corporation number must be 9 digits`                   |
| Corporation number rejected by API     | Under field              | `Invalid Corporation Number`                            |
| Corporation number check unreachable   | Under field              | `Couldn't verify corporation number. Please try again.` |
| `400` naming a field                   | Under that field         | Server `message`, verbatim                              |
| `400`, unattributable                  | Form-level, above submit | Server `message`, verbatim                              |
| Network / `5xx` on submit              | Form-level, above submit | `Something went wrong. Please try again.`               |

---

## 11. Testing strategy

Integration tests drive the rendered form through user-event; hooks are not tested
in isolation. MSW handles all network traffic, so production code exercises its
real `fetch` path. The ten valid corporation numbers live **only** in
`test/msw/handlers.ts` — never in application code.

`test/utils.tsx` provides `renderForm()` and `fillValidForm()` so each test states
only what makes it different.

| ID  | Scenario                                              | Assertion                                                                      |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| T1  | Initial render                                        | All four fields and the submit button are present and accessible by label/role |
| T2  | Submit an empty form                                  | Four required messages appear; **no** POST is issued                           |
| T3  | First name of 51 characters, blur                     | Length message appears                                                         |
| T4  | `4165551234` (no country code), blur                  | Phone format message appears                                                   |
| T5  | `+1 416 555 1234` (spaces), blur                      | Phone format message appears                                                   |
| T6  | Valid corporation number, blur                        | No error; exactly one GET issued                                               |
| T7  | Invalid corporation number, blur                      | `Invalid Corporation Number` appears under the field                           |
| T8  | Blur the same corporation number twice                | Exactly one GET (cache holds)                                                  |
| T9  | Complete valid form, submit                           | POST body deep-equals the documented payload; success state shown              |
| T10 | Submit without ever blurring the corporation number   | Check runs, then POST                                                          |
| T11 | POST returns `400 {"message":"Invalid phone number"}` | Message is rendered to the user                                                |
| T12 | Corporation-number check returns a network error      | "Couldn't verify" message; **not** reported as invalid                         |
| T13 | Submit while a check is in flight                     | Button disabled; only one POST                                                 |

Requests are asserted by recording them inside MSW handlers (or via
`server.events`), never by stubbing `global.fetch`.

**Coverage intent:** validation rules, the async check including cache and failure
modes, and the full submit path. Styling and layout are out of scope for tests.

---

## 12. Tooling

| Script             | Purpose                                             |
| ------------------ | --------------------------------------------------- |
| `npm run dev`      | Vite dev server                                     |
| `npm run build`    | `tsc -b && vite build` — type errors fail the build |
| `npm run test`     | Vitest watch                                        |
| `npm run test:run` | Single pass, for CI                                 |
| `npm run lint`     | ESLint over `src/`                                  |

`.env.example` is committed; `.env` is not. `tsconfig` runs in `strict` mode with
the `@/*` → `src/*` alias mirrored in `vite.config.ts`.

---

## 13. Open questions and assumptions

1. **Corporation number character set** — assumed numeric (§5.1). Relax the regex
   to a bare length check if alphanumeric identifiers are valid.
2. **Invalid-number HTTP status** — the requirements do not state whether the GET
   returns `200` or `404` for an invalid number. Both are handled as "invalid" so
   long as the body carries `valid: false`.
3. **Post-success behaviour** — no redirect target is specified; the form shows an
   inline confirmation and resets.
4. **Rate limiting** — no debounce is applied, since validation is blur-triggered
   rather than keystroke-triggered and results are cached.

---

## 14. Implementation sequence

1. Scaffold Vite + TypeScript + Tailwind; ESLint and Vitest config.
2. Build `TextField` and `Button` with accessibility baked in.
3. Write `schema.ts` and `messages.ts`; render the static form. → T1–T5 green.
4. Add `api/` and the MSW handlers.
5. Implement `useCorporationNumberCheck`. → T6–T8, T12 green.
6. Implement submit orchestration in `useOnboardingForm`. → T9–T11, T13 green.
7. Style to match `design.png`; verify responsive behaviour.
8. Lint pass; README documenting the interpretation decisions in §5.1.
