import { useState, useEffect } from "react";
import { adminAuthService } from "../services/adminAuth";
import { walletService } from "../services/wallet";
import { SetupAdmin } from "./SetupAdmin";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [noAdminSet, setNoAdminSet] = useState(false);
  const [wallet, setWallet] = useState(walletService.getWallet());

  useEffect(() => {
    const unsubscribe = walletService.subscribe(setWallet);
    return unsubscribe;
  }, []);

  useEffect(() => {
    checkAdminStatus();
  }, [wallet]);

  const checkAdminStatus = async () => {
    setIsLoading(true);
    try {
      // First check if any admin is set
      const adminPrincipal = await adminAuthService.getAdminPrincipal();
      if (!adminPrincipal) {
        setNoAdminSet(true);
        setIsAdmin(false);
        return;
      }

      // If admin is set, check if current user is admin
      const adminStatus = await adminAuthService.isCurrentUserAdmin();
      setIsAdmin(adminStatus);
      setNoAdminSet(false);
    } catch (error) {
      console.error("Failed to check admin status:", error);
      setIsAdmin(false);
      setNoAdminSet(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass-hover relative overflow-hidden rounded-3xl p-12">
          <div className="gradient-icp-card absolute inset-0 rounded-3xl opacity-30"></div>
          <div className="relative z-10 text-center">
            <div className="mb-6">
              <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-blue-500"></div>
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">
              Checking Admin Access
            </h2>
            <p className="text-white/70">Verifying your permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!wallet || !wallet.isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass-hover relative overflow-hidden rounded-3xl p-12 text-center">
          <div className="gradient-icp-card absolute inset-0 rounded-3xl opacity-30"></div>
          <div className="relative z-10">
            <div className="mb-6">
              <div className="gradient-icp-warm mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="mb-4 text-2xl font-bold text-white">
              Wallet Connection Required
            </h2>
            <p className="mb-6 text-white/70">
              Please connect your wallet to access the admin interface.
            </p>
            <button
              onClick={() => (window.location.href = "/")}
              className="gradient-icp-primary rounded-xl px-6 py-3 font-medium text-white transition-all duration-300 hover:scale-105"
            >
              Return to Markets
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show setup admin interface if no admin is set
  if (noAdminSet && wallet && wallet.isConnected) {
    return <SetupAdmin onAdminSet={checkAdminStatus} />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass-hover relative overflow-hidden rounded-3xl p-12 text-center">
          <div className="gradient-icp-card absolute inset-0 rounded-3xl opacity-30"></div>
          <div className="relative z-10">
            <div className="mb-6">
              <div className="gradient-icp-warn mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="mb-4 text-2xl font-bold text-white">
              Access Denied
            </h2>
            <p className="mb-2 text-white/70">
              You don't have admin permissions to access this area.
            </p>
            <p className="mb-6 text-sm text-white/50">
              Connected as: {wallet.address}
            </p>
            <button
              onClick={() => (window.location.href = "/")}
              className="gradient-icp-primary rounded-xl px-6 py-3 font-medium text-white transition-all duration-300 hover:scale-105"
            >
              Return to Markets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
