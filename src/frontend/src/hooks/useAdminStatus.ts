import { useState, useEffect } from "react";
import { adminAuthService } from "../services/adminAuth";
import { walletService } from "../services/wallet";

export function useAdminStatus() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
      if (!wallet || !wallet.isConnected) {
        setIsAdmin(false);
        return;
      }

      const adminStatus = await adminAuthService.isCurrentUserAdmin();
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error("Failed to check admin status:", error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { isAdmin, isLoading, checkAdminStatus };
}
