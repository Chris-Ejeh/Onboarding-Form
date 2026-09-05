import { OnboardingForm } from "@/components/onboarding-form/OnboardingForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { render, screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

export const VALID_FORM = {
  firstName: "Hello",
  lastName: "World",
  phone: "3062776103",
  corporationNumber: "826417395",
};

export function renderForm() {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <OnboardingForm />
    </QueryClientProvider>,
  );
}

export async function fillValidForm(
  user: UserEvent,
  overrides: Partial<typeof VALID_FORM> = {},
) {
  const values = { ...VALID_FORM, ...overrides };

  const fields = [
    [/First Name/i, values.firstName],
    [/Last Name/i, values.lastName],
    [/Phone Number/i, values.phone],
    [/Corporation Number/i, values.corporationNumber],
  ] as const;

  for (const [label, value] of fields) {
    if (!value) continue;
    await user.type(screen.getByLabelText(label), value);
  }

  return values;
}
