import type { OnboardingFormTypes } from "@/components/onboarding-form/types";
import {
  COULD_NOT_VERIFY,
  DEFAULT_FORM,
  INVALID_CORPORATION_NUMBER,
  SUBMIT_ERROR_MESSAGE,
} from "@/utils/constants";
import { onBoardingFormSchema } from "@/models/onBoardingSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useCorporationNumberCheck } from "./useCorporationNumberCheck";
import { submitProfileDetails } from "@/api/onboarding-details";
import { apiErrorMessage } from "@/api/clients";
import { type BaseSyntheticEvent, type FocusEvent } from "react";

export function useOnboardingForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
    getFieldState,
    clearErrors,
  } = useForm<OnboardingFormTypes>({
    resolver: zodResolver(onBoardingFormSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: DEFAULT_FORM,
  });

  const { verify } = useCorporationNumberCheck();
  const corporationNumberRegistery = register("corporationNumber");

  function setInvalidCorporationError(message?: string) {
    setError("corporationNumber", { message });
  }

  async function verifyCorporationNumber(value: string) {
    try {
      const { valid, message } = await verify(value);
      if (valid) {
        return clearErrors("corporationNumber");
      } else {
        return setInvalidCorporationError(
          message ?? INVALID_CORPORATION_NUMBER,
        );
      }
    } catch {
      setInvalidCorporationError(COULD_NOT_VERIFY);
    }
  }

  const onSubmit: SubmitHandler<OnboardingFormTypes> = async (data) => {
    // already validated data
    try {
      const { valid, message } = await verify(data.corporationNumber);
      if (!valid) {
        setInvalidCorporationError(message ?? INVALID_CORPORATION_NUMBER);
        return;
      }
    } catch {
      setInvalidCorporationError(COULD_NOT_VERIFY);
      return;
    }

    try {
      await submitProfileDetails(data);
      reset();
    } catch (error) {
      setError("root", {
        message: apiErrorMessage(error, SUBMIT_ERROR_MESSAGE),
      });
    }
  };

  async function onCorporationNumberBlur(
    e: FocusEvent<HTMLInputElement, Element>,
  ) {
    await corporationNumberRegistery.onBlur(e); // sync the normal validation
    if (getFieldState("corporationNumber").error) return; // return on field error
    const number = e.target.value;
    await verifyCorporationNumber(number);
  }

  async function submitFormData(e: BaseSyntheticEvent) {
    await handleSubmit(onSubmit)(e);
  }

  return {
    corporationNumberRegistery,
    errors,
    isSubmitting,

    onCorporationNumberBlur,
    register,
    submitFormData,
  };
}
