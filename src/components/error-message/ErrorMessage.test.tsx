import { render, screen } from "@testing-library/react";
import type { ErrorMessageProps } from "./type";
import { ErrorMessage } from "./ErrorMessage";
import { INVALID_CORPORATION_NUMBER } from "@/utils/constants";

describe("Error Message Component", () => {
  function renderComponent(props: ErrorMessageProps) {
    return render(<ErrorMessage {...props} />);
  }

  it("should render its label", () => {
    renderComponent({ message: INVALID_CORPORATION_NUMBER });
    expect(screen.getByText(INVALID_CORPORATION_NUMBER)).toBeTruthy();
  });
});
