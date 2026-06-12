import { signIn } from "@/lib/auth";

export default function AdminLoginPage() {
  async function login(formData: FormData) {
    "use server";
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin"
    });
  }

  return (
    <main className="page-shell">
      <div className="container" style={{ maxWidth: 520 }}>
        <form className="panel form-grid" action={login}>
          <div className="wide">
            <p className="kicker">Admin</p>
            <h1>Sign in.</h1>
          </div>
          <div className="field wide">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div className="field wide">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required />
          </div>
          <button className="btn wide" type="submit">Sign in</button>
        </form>
      </div>
    </main>
  );
}
