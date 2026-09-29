import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function ContactPage() {
  return <><Header /><main className="page"><div className="container"><div className="eyebrow">Contact SIMS Raipur</div><h1 className="page-title" style={{ marginTop: 10 }}>Need help with your test?</h1><div className="grid-3 mt-24"><div className="card card-pad"><h3>Teacher</h3><p className="page-lead"><strong className="gold">P. Nishad Sir</strong></p></div><div className="card card-pad"><h3>Call</h3><p className="page-lead"><a className="gold" href="tel:+918959774702">8959774702</a></p></div><div className="card card-pad"><h3>Address</h3><p className="page-lead">Floor - 3, Main Road Choubey Colony, Samta, Raipur - 492001</p></div></div></div></main><Footer /></>;
}
