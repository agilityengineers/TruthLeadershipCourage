import { LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { logoutAction } from "@/server/auth-actions";

export function SignOut() {
  const [, navigate] = useLocation();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        logoutAction();
        navigate("/login");
      }}
    >
      <button
        type="submit"
        className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[13px] font-medium text-[#9b98ca] transition-colors hover:bg-white/5 hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </form>
  );
}
