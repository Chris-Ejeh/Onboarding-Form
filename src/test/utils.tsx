import { OnboardingForm } from "@/components/onboarding-form/OnboardingForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { render } from "@testing-library/react";

export function renderForm() {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <OnboardingForm />
    </QueryClientProvider>,
  );
}
