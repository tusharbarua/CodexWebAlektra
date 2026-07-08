import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";

export async function GET() {
  const customer = await getCustomerSession();
  return NextResponse.json({
    authenticated: Boolean(customer),
    customer: customer ? { fullName: customer.fullName, email: customer.email } : null
  });
}
