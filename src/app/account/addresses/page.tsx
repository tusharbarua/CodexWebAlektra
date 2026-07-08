import { deleteCustomerAddress, setDefaultCustomerAddress } from "@/app/account/actions";
import { CustomerAddressForm } from "@/components/CustomerAccountForms";
import { CustomerAccountShell } from "@/components/CustomerAccountShell";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AccountAddressesPage() {
  const customer = await requireCustomer();
  const addresses = await prisma.customerAddress.findMany({
    where: { customerId: customer.id },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }]
  });
  return (
    <CustomerAccountShell customer={customer} title="Saved addresses." subtitle="Save delivery locations for faster checkout.">
      <div className="account-address-layout">
        <section className="account-panel">
          <h2>Add a delivery address</h2>
          <CustomerAddressForm defaults={{
            recipientName: customer.fullName,
            mobileNumber: customer.mobileNumber ?? ""
          }} />
        </section>
        <section className="account-panel">
          <h2>Your saved addresses</h2>
          {addresses.length ? (
            <div className="account-address-list">
              {addresses.map((address) => (
                <article className="account-address-card" key={address.id}>
                  <div>
                    <strong>{address.recipientName}</strong>
                    {address.isDefault ? <span>Default</span> : null}
                    <p>{address.mobileNumber}<br />{address.addressLine}<br />{address.upazilaName}, {address.districtName}, {address.divisionName}{address.postalCode ? ` - ${address.postalCode}` : ""}</p>
                    {address.deliveryNotes ? <small>{address.deliveryNotes}</small> : null}
                  </div>
                  <details>
                    <summary>Edit</summary>
                    <CustomerAddressForm defaults={address} />
                  </details>
                  <div className="account-address-actions">
                    {!address.isDefault ? (
                      <form action={setDefaultCustomerAddress}>
                        <input type="hidden" name="id" value={address.id} />
                        <button className="account-secondary-button" type="submit">Set default</button>
                      </form>
                    ) : null}
                    <form action={deleteCustomerAddress}>
                      <input type="hidden" name="id" value={address.id} />
                      <button className="account-danger-button" type="submit">Delete</button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : <p className="account-empty">No saved addresses yet.</p>}
        </section>
      </div>
    </CustomerAccountShell>
  );
}
