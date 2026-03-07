import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useData }   from './hooks/useData';
import { TopBar }    from './components/TopBar';
import { Toast }     from './components/Toast';
import { TABS }      from './constants';
import Analytics     from './pages/Analytics/index';
import Transactions  from './pages/Transactions/index';
import Management    from './pages/Management/index';

function Spinner() {
  return (
    <div className="flex items-center justify-center gap-2.5 mt-24 font-mono text-xs text-ink-dim">
      <div className="w-4 h-4 border-2 border-edge-hi border-t-accent rounded-full animate-spin" />
      connecting to backend…
    </div>
  );
}

function Shell() {
  const data = useData();

  return (
    <div className="min-h-screen bg-surface-base">
      <TopBar tabs={TABS} />

      <main className="w-screen mx-auto px-6 py-6">
        {data.loading ? (
          <Spinner />
        ) : (
          <Routes>
            <Route index element={<Navigate to="/analytics" replace />} />
            <Route
              path="analytics"
              element={
                <Analytics
                  transactions={data.transactions}
                  categories={data.categories}
                  merchants={data.merchants}
                />
              }
            />
            <Route
              path="transactions"
              element={
                <Transactions
                  transactions={data.transactions}
                  categories={data.categories}
                  merchants={data.merchants}
                  refresh={data.refresh}
                />
              }
            />
            <Route
              path="management"
              element={
                <Management
                  categories={data.categories}
                  merchants={data.merchants}
                  refresh={data.refresh}
                />
              }
            />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/analytics" replace />} />
          </Routes>
        )}
      </main>

      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<Shell />} />
      </Routes>
    </BrowserRouter>
  );
}