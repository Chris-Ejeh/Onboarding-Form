import { apiClient } from "./clients";

/**
 * `corporationNumber` accompanies `valid: true`;
 * `message` accompanies `valid: false`.
 */
export interface CorporationNumberResponse {
  corporationNumber?: string;
  valid: boolean;
  message?: string;
}

export async function getCorporationNumber(value: string) {
  const { data } = await apiClient.get<CorporationNumberResponse>(
    `/corporation-number/${value}`,
  );
  return data;
}
