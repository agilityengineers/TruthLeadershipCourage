"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setConsent, requestAccountDeletion } from "@/server/account-actions";

export function AccountActions({
  marketingGranted,
  deletionRequested,
}: {
  marketingGranted: boolean;
  deletionRequested: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2.5 text-[14px] text-ink">
        <input
          type="checkbox"
          defaultChecked={marketingGranted}
          onChange={(e) =>
            start(async () => {
              await setConsent("marketing", e.target.checked);
              router.refresh();
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
                await requestAccountDeletion();
                router.refresh();
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
