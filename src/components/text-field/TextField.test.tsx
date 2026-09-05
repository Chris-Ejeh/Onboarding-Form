import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { TextFieldProps } from "./types";
import { TextField } from "./TextField";

describe("TextField Component", () => {
  function renderComponent(props: Partial<TextFieldProps> = {}) {
    return render(<TextField label="First Name" name="firstName" {...props} />);
  }

  it("should render its label", () => {
    renderComponent();
    expect(screen.getByText("First Name")).toBeTruthy();
  });

  it("should accept typed input", async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByLabelText("First Name") as HTMLInputElement;
    await user.type(input, "John");

    expect(input.value).toBe("John");
  });

  it("renders no error by default", () => {
    renderComponent();

    expect(screen.getByLabelText("First Name")).toHaveAttribute(
      "aria-invalid",
      "false",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders the error and marks the input invalid", () => {
    renderComponent({ errorMessage: "First name is required" });

    expect(screen.getByLabelText("First Name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "First name is required",
    );
  });
});
