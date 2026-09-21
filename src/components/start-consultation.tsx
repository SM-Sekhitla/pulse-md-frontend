import { ActionButton } from "@/components/action-feedback";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "@/lib/router-compat";
import { useQueryClient } from "@tanstack/react-query";
import API from "@/utils/api";

export function StartConsultation({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const cache = useQueryClient();
  if (user?.role !== "owner" || ["Cancelled", "No-show"].includes(status))
    return null;
  return (
    <ActionButton
      className="gp-button gp-button-yellow"
      onClick={async () => {
        if (status !== "Completed")
          await API.post(`/appointments/${id}/consultation/start`);
        await cache.invalidateQueries({ queryKey: ["appointments"] });
        navigate({ to: `/appointments/${id}/consultation` });
      }}
    >
      {status === "Completed"
        ? "View clinical notes"
        : status === "In progress"
          ? "Resume consultation"
          : "Start appointment"}
    </ActionButton>
  );
}
