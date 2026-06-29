"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { issueCertificateForEnrollment } from "@/server/trainer-actions";

/** Trainer/admin control to issue a completion certificate for a finished enrollment. */
export function IssueCertificateButton({ enrollmentId }: { enrollmentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await issueCertificateForEnrollment(enrollmentId);
            if (!res.ok) {
              setError(res.error);
              return;
            }
            router.refresh();
          })
        }
      >
        {pending ? "Issuing…" : "Issue certificate"}
      </Button>
      {error && (
        <p role="alert" className="text-[12px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
