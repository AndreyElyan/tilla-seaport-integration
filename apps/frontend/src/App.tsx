import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { SeaportsPage } from "./pages/SeaportsPage";
import { SyncPage } from "./pages/SyncPage";

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<SeaportsPage />} />
        <Route path="/sync" element={<SyncPage />} />
      </Routes>
    </Layout>
  );
}
