import { createContext, useContext, useState } from "react";

export const DATA_SOURCES = [
  {
    id: "event_log_data",
    label: "BPI Challenge 2012",
    description: "Hollanda bankası kredi başvuru süreci",
    badge: "BPI",
    stats: {
      total_events: 262200,
      total_cases: 13087,
      avg_events_per_case: 20.04,
      date_range: { min: "2011-10-01", max: "2012-03-14" },
    },
  },
  {
    id: "d365_event_log",
    label: "Dynamics 365 Dummy Data",
    description: "Satın alma ve tedarik süreci",
    badge: "D365",
    stats: {
      total_events: 980,
      total_cases: 100,
      avg_events_per_case: 9.8,
      date_range: { min: "2024-01-15", max: "2025-06-10" },
    },
  },
];

const DataSourceContext = createContext(null);

export function DataSourceProvider({ children }) {
  const [tableName, setTableName] = useState("d365_event_log");
  const source = DATA_SOURCES.find((s) => s.id === tableName) ?? DATA_SOURCES[0];
  return (
    <DataSourceContext.Provider value={{ tableName, setTableName, source, sources: DATA_SOURCES }}>
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSource() {
  return useContext(DataSourceContext);
}
