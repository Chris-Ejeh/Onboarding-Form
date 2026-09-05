import { render, screen } from "@testing-library/react";
import { Button } from "./Button.tsx";
import type { ButtonProps } from "./types.ts";

describe("Button Component", () => {
  function renderComponent(props: Partial<ButtonProps> = {}) {
    return render(<Button {...props}>Submit</Button>);
  }

  it("should render its label", () => {
    renderComponent();
    expect(screen.getByText("Submit")).toBeTruthy();
  });
});
