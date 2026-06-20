import Dashboard from "./app/Dashboard.jsx";
import { DataSourceProvider } from "./app/context/DataSourceContext.jsx";

export default function App() {
  return (
    <DataSourceProvider>
      <Dashboard />
    </DataSourceProvider>
  );
}
