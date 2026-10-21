import { createRoot } from "react-dom/client";
import { Helmet, HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { initAnalytics, initContactClickTracking } from "./lib/analytics";

initAnalytics();
initContactClickTracking();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <Helmet>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" />
    </Helmet>
    <App />
  </HelmetProvider>,
);
