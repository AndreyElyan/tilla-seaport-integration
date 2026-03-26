import { Link, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { SeaportsPage } from "./pages/SeaportsPage";
import { SyncPage } from "./pages/SyncPage";

function NotFound() {
  return (
    <div className="not-found">
      <h2>404</h2>
      <p>Page not found.</p>
      <Link to="/">Back to Seaports</Link>
    </div>
  );
}

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<SeaportsPage />} />
        <Route path="/sync" element={<SyncPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
