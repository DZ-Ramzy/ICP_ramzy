import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { MarketListView } from "./views/MarketListView";
import { MarketDetailView } from "./views/MarketDetailView";
import { AdminView } from "./views/AdminView";
import { WalletButton } from "./components/WalletButton";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import { ToastContainer } from "./components/Toast";
import { useToast } from "./hooks/useToast";
import { useAdminStatus } from "./hooks/useAdminStatus";

function App() {
  const { toasts, removeToast } = useToast();
  const { isAdmin, isLoading } = useAdminStatus();

  return (
    <Router>
      <div className="relative flex min-h-screen flex-col">
        {/* Fixed animated background */}
        <div className="animated-bg fixed inset-0 -z-10"></div>

        {/* Navigation */}
        <nav className="glass sticky top-0 z-50 border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <Link to="/" className="group flex items-center space-x-3">
                  <div className="relative">
                    <div className="gradient-icp-primary pulse-glow flex h-10 w-10 items-center justify-center rounded-xl shadow-lg transition-all duration-300 group-hover:scale-110">
                      <span className="text-lg font-bold text-white">∞</span>
                    </div>
                    <div className="gradient-icp-accent absolute -inset-1 rounded-xl opacity-20 blur transition-opacity duration-300 group-hover:opacity-40"></div>
                  </div>
                  <div className="text-left">
                    <h1 className="text-gradient text-2xl font-bold">
                      PredictMarket
                    </h1>
                    <p className="text-xs font-medium tracking-wide text-white/70">
                      Powered by Internet Computer
                    </p>
                  </div>
                </Link>
              </div>

              <div className="flex items-center space-x-4">
                <Link
                  to="/"
                  className="group relative rounded-lg px-4 py-2 font-medium text-white/90 transition-all duration-300 hover:bg-white/10 hover:text-white"
                >
                  <span className="relative z-10">Markets</span>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                </Link>

                {/* Admin Link - Only show if user is admin */}
                {isAdmin && !isLoading && (
                  <Link
                    to="/admin"
                    className="gradient-icp-warm group relative overflow-hidden rounded-lg px-4 py-2 font-medium text-white shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    <span className="relative z-10 flex items-center space-x-2">
                      <span>Admin</span>
                      <svg
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </span>
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"></div>
                  </Link>
                )}

                <WalletButton />
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="relative z-10 flex-1">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<MarketListView />} />
              <Route path="/market/:id" element={<MarketDetailView />} />
              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <AdminView />
                  </AdminProtectedRoute>
                }
              />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <footer className="glass mt-auto border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between space-y-2 md:flex-row md:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="gradient-icp-primary flex h-6 w-6 items-center justify-center rounded-lg">
                  <span className="text-xs font-bold text-white">∞</span>
                </div>
                <div className="text-white/80">
                  <p className="text-sm font-medium">PredictMarket</p>
                  <p className="text-xs text-white/60">
                    Decentralized Prediction Markets
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-xs text-white/70">
                <a
                  href="#"
                  className="transition-colors duration-200 hover:text-white/90"
                >
                  Terms
                </a>
                <a
                  href="#"
                  className="transition-colors duration-200 hover:text-white/90"
                >
                  Privacy
                </a>
                <a
                  href="https://internetcomputer.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 transition-colors duration-200 hover:text-white/90"
                >
                  <span>Built on IC</span>
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </Router>
  );
}

export default App;
