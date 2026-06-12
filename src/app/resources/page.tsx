import Link from "next/link";
import { learningArticles, resourceCategories } from "@/data/site";

export default function ResourcesPage() {
  return (
    <main className="page-shell">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="kicker">Resources</p>
            <h1>Solar learning library.</h1>
          </div>
          <p>Articles are managed from admin with publish, unpublish, edit and delete support.</p>
        </div>
        <div className="category-strip">
          {resourceCategories.map((category) => (
            <span key={category}>{category}</span>
          ))}
        </div>
        <div className="resource-grid">
          {learningArticles.map((article) => (
            <Link className="card" href={`/resources/${article.slug}`} key={article.slug}>
              <div className="card-body">
                <small>{article.category}</small>
                <h3>{article.title}</h3>
                <p>{article.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
