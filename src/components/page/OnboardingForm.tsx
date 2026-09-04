import { Button } from "@/components/common/Button";
import { TextField } from "@/components/common/TextField";

export function OnboardingForm() {
  return (
    <main className="rounded-2xl bg-white p-8 border border-neutral-200 flex flex-col gap-4">
      <h1 id="form-title" className="text-2xl text-center font-light">
        Onboarding Form
      </h1>
      <form aria-labelledby="form-title" className="flex flex-col gap-6">
        <div className="flex gap-6">
          <TextField name="firstName" label="First Name" type="text" />
          <TextField name="lastName" label="Last Name" type="text" />
        </div>
        <TextField name="phoneNumber" label="Phone Number" type="text" />
        <TextField
          name="corporationNumber"
          label="Corporation Number"
          type="text"
        />

        <Button type="submit">Submit</Button>
      </form>
    </main>
  );
}
