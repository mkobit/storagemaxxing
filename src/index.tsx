import { createRoot } from "react-dom/client";

const App = () => {
  return <div>StorageMaxxing Scaffold</div>;
};

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
