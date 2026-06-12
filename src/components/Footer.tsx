import Link from "next/link";
import { brand } from "@/data/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <img src={brand.logo} alt="Alektra Renewable" style={{ width: 260, filter: "brightness(0) invert(1)" }} />
          <p>Solar EPC, thermal inspection, cleaning and mapping for renewable-energy assets in Bangladesh.</p>
        </div>
        <div>
          <strong>Company</strong>
          <p>
            <Link href="/#epc">Alektra EPC</Link>
            <br />
            <Link href="/#subdivisions">Alektra Thermal</Link>
            <br />
            <Link href="/#subdivisions">Alektra Sparkle</Link>
            <br />
            <Link href="/#subdivisions">Alektra Mapping</Link>
          </p>
        </div>
        <div>
          <strong>{brand.domain}</strong>
          <p>
            {brand.email}
            <br />
            {brand.phone}
            <br />
            {brand.address}
          </p>
        </div>
      </div>
    </footer>
  );
}
