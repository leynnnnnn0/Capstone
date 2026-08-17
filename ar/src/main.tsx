import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/instrument-sans";
import "./styles.css";

const App = lazy(() => import("./App"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense
      fallback={
        <main className="ar-loading-shell" role="status">
          Loading AR workspace…
        </main>
      }
    >
      <App />
    </Suspense>
  </StrictMode>,
);
