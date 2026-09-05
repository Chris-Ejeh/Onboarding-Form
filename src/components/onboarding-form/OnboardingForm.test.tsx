import { server } from "@/test/msw/server";
import { fillValidForm, renderForm } from "@/test/utils";
import {
  INVALID_CORPORATION_NUMBER,
  INVALID_PHONE_NUMBER,
  ONBOARDING_COMPLETED,
} from "@/utils/constants";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

describe("Onboarding Form Component", () => {
  it("should have 4 TextFields", () => {
    renderForm();

    expect(screen.getByRole("heading").innerHTML).toBe("Onboarding Form");
    expect(screen.getAllByTestId("InputText").length).toBe(4);
  });

  it("starts with empty fields and no errors", () => {
    renderForm();

    expect(screen.getByLabelText("First Name")).toHaveValue("");
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
  });

  it("should submit successfully", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillValidForm(user);
    await user.click(screen.getByRole("button"));

    expect((await screen.findByRole("status")).innerHTML).toBe(
      ONBOARDING_COMPLETED,
    );
  });

  it("should shows the server's message when submission is rejected", async () => {
    server.use(
      // ← here
      http.post("*/profile-details", () =>
        HttpResponse.json({ message: INVALID_PHONE_NUMBER }, { status: 400 }),
      ),
    );

    const user = userEvent.setup();
    renderForm();

    await fillValidForm(user);
    await user.click(screen.getByRole("button"));

    expect(await screen.findByText(INVALID_PHONE_NUMBER)).toBeInTheDocument();
  });

  it("should show 4 error fields when an empty form is submitted", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillValidForm(user, {
      phone: "",
      corporationNumber: "",
      firstName: "",
      lastName: "",
    });
    await user.click(screen.getByRole("button"));

    expect(screen.getByLabelText("First Name").ariaInvalid).toBeTruthy();
    expect(screen.getByLabelText("Last Name").ariaInvalid).toBeTruthy();
    expect(screen.getByLabelText("Phone Number").ariaInvalid).toBeTruthy();
    expect(
      screen.getByLabelText("Corporation Number").ariaInvalid,
    ).toBeTruthy();
  });

  it("should show error message for invalid corporation number", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("Corporation Number"), "826417394");
    await user.tab();

    expect(screen.queryByText(INVALID_CORPORATION_NUMBER)).toBeInTheDocument();
  });
});
