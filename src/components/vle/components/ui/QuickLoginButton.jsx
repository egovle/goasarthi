import { Button } from "@/components/ui/button";

export default function QuickLoginButton({ role, icon: Icon, label, email, password, loading, onClick, spanAll = false }) {
  return (
    <Button
      variant="outline"
      className={`bg-white/5 border border-white/20 text-white hover:bg-white/10 backdrop-blur-sm rounded-lg py-2 text-xs font-medium transition-all duration-200 ease-in-out h-10 hover:-translate-y-0.5 hover:shadow-md ${spanAll ? "col-span-2" : ""}`}
      onClick={() => onClick(email, password)}
      disabled={loading}
      aria-label={`Quick login as ${role}`}
    >
      <Icon className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </Button>
  );
}
