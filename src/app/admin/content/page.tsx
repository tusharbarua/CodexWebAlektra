export default function AdminContentPage() {
  return <AdminPlaceholder title="Website content" body="Company introduction, mission, vision, objectives, why choose us and section copy are modeled in SiteContent." />;
}

function AdminPlaceholder({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="kicker">Admin</p>
      <h1>{title}</h1>
      <div className="panel"><p>{body}</p></div>
    </div>
  );
}
