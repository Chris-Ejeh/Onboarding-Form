import { Button } from "@/components/button/Button";
import { TextField } from "@/components/text-field/TextField";
import { useOnboardingForm } from "@/hooks/useOnboardingForm";
import { ONBOARDING_COMPLETED } from "@/utils/constants";

export function OnboardingForm() {
  const {
    corporationNumberRegistery,
    errors,
    isSubmitting,
    isSubmitSuccessful,
    isVerifying,
    onCorporationNumberBlur,
    register,
    submitFormData,
  } = useOnboardingForm();

  return (
    <div className="rounded-2xl bg-white p-8 border border-neutral-200 flex flex-col gap-4">
      <h1 id="form-title" className="text-2xl text-center font-light">
        Onboarding Form
      </h1>
      <form
        aria-labelledby="form-title"
        className="flex flex-col gap-6"
        onSubmit={submitFormData}
      >
        <div className="flex gap-6">
          <TextField
            label="First Name"
            type="text"
            maxLength={50}
            errorMessage={errors.firstName?.message}
            {...register("firstName")}
          />
          <TextField
            label="Last Name"
            type="text"
            maxLength={50}
            errorMessage={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>
        <TextField
          label="Phone Number"
          type="tel"
          inputMode="tel"
          placeholder="2084546666"
          maxLength={10}
          errorMessage={errors.phone?.message || errors.root?.message}
          {...register("phone")}
        />
        <TextField
          label="Corporation Number"
          type="type"
          inputMode="numeric"
          maxLength={9}
          errorMessage={errors.corporationNumber?.message}
          {...corporationNumberRegistery}
          onBlur={onCorporationNumberBlur}
        />

        {isSubmitSuccessful && (
          <p role="status" className="text-sm text-green-700">
            {ONBOARDING_COMPLETED}
          </p>
        )}

        <Button
          type="submit"
          role="button"
          disabled={isVerifying || isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </div>
  );
}
