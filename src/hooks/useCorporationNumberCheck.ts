import { isApiError } from "@/api/clients";
import {
  getCorporationNumber,
  type CorporationNumberResponse,
} from "@/api/corporation-number";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export const CORPORATION_NUMBER_KEY = "corporation-number";

export function useCorporationNumberCheck() {
  const queryClient = useQueryClient();
  const isVerifying = useIsFetching({ queryKey: [CORPORATION_NUMBER_KEY] }) > 0;

  // cache the corporateNumber
  const verify = useCallback(
    (value: string): Promise<CorporationNumberResponse> =>
      queryClient.query({
        queryKey: [CORPORATION_NUMBER_KEY, value],
        staleTime: "static",
        retry: false,
        queryFn: async (): Promise<CorporationNumberResponse> => {
          try {
            return await getCorporationNumber(value);
          } catch (error) {
            if (
              isApiError<CorporationNumberResponse>(error) &&
              error.response
            ) {
              const { status, data } = error.response;
              if (status < 500 && data) {
                return data;
              }
            }

            throw error;
          }
        },
      }),
    [queryClient],
  );

  return { verify, isVerifying };
}
