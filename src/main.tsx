import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/nunito/300.css";
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
