import { Button } from "@/components/button/Button";
import { TextField } from "@/components/text-field/TextField";
import { useOnboardingForm } from "@/hooks/useOnboardingForm";

export function OnboardingForm() {
  const {
    corporationNumberRegistery,
    errors,
    isSubmitting,
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
          errorMessage={errors.phone?.message}
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

        <Button type="submit">
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </div>
  );
}
