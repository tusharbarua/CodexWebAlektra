"use client";

import { logoutCustomer } from "@/app/account/actions";

export function CustomerLogoutForm() {
  return (
    <form
      action={logoutCustomer}
      onSubmit={() => {
        window.dispatchEvent(new Event("alektra-customer-session-changed"));
      }}
    >
      <button className="account-logout-button" type="submit">Logout</button>
    </form>
  );
}
