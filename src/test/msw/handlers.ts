import { INVALID_CORPORATION_NUMBER } from "@/utils/constants";
import { http, HttpResponse } from "msw";

const VALID_CORPORATION_NUMBERS = [
  "826417395",
  "158739264",
  "123456789",
  "591863427",
  "312574689",
  "287965143",
  "265398741",
  "762354918",
  "468721395",
  "624719583",
];

export const handlers = [
  http.get("*/corporation-number/:number", ({ params }) => {
    const number = String(params.number);

    if (VALID_CORPORATION_NUMBERS.includes(number)) {
      return HttpResponse.json({ corporationNumber: number, valid: true });
    }

    return HttpResponse.json(
      { valid: false, message: INVALID_CORPORATION_NUMBER },
      { status: 404 },
    );
  }),

  http.post("*/profile-details", () => {
    return HttpResponse.text("OK", { status: 200 });
  }),
];
