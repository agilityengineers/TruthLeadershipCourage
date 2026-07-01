import { useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useSetConsent, useRequestAccountDeletion } from "@workspace/api-client-react";

export function AccountActions({
  marketingGranted,
  deletionRequested,
}: {
  marketingGranted: boolean;
  deletionRequested: boolean;
}) {
  const qc = useQueryClient();
  const setConsent = useSetConsent();
  const requestAccountDeletion = useRequestAccountDeletion();
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2.5 text-[14px] text-ink">
        <input
          type="checkbox"
          defaultChecked={marketingGranted}
          onChange={(e) =>
            start(async () => {
              await setConsent.mutateAsync({ data: { type: "marketing", granted: e.target.checked } });
              await qc.invalidateQueries();
            })
          }
        />
        Receive marketing &amp; program-update emails
      </label>

      <div className="border-t border-hair-2 pt-4">
        {deletionRequested ? (
          <p className="text-[13px] font-medium text-warning">
            Account erasure requested — our team will process it shortly.
          </p>
        ) : (
          <Button
            variant="danger"
            disabled={pending}
            onClick={() => {
              if (!confirm("Request erasure of your account and personal data?")) return;
              start(async () => {
                await requestAccountDeletion.mutateAsync(undefined);
                await qc.invalidateQueries();
              });
            }}
          >
            Request account deletion
          </Button>
        )}
      </div>
    </div>
  );
}
