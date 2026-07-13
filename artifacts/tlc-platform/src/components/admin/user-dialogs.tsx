import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useImpersonateUser,
  useRegenerateInvite,
  type AdminUserRow,
  type Role,
} from "@workspace/api-client-react";
import {
  getPrincipal,
  isImpersonating,
  startImpersonation,
} from "@/lib/session";
import { homeForRole } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type CompanyOpt = { id: string; name: string };

const selectClass =
  "h-11 rounded-[9px] border border-[#e0e4ee] bg-white px-3.5 text-sm";

/** Surface the server's friendly error message (ApiError carries `.data.error`). */
function errMsg(e: unknown): string {
  const data = (e as { data?: { error?: string } })?.data;
  return (
    data?.error ?? (e instanceof Error ? e.message : "Something went wrong.")
  );
}

function roleOptions(canSuper: boolean): Role[] {
  const base: Role[] = ["PARTICIPANT", "COMPANY_VIEWER", "TRAINER", "ADMIN"];
  return canSuper ? [...base, "SUPER_ADMIN"] : base;
}

/** Compose the full, shareable invite URL from the server-returned relative path. */
function inviteUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${window.location.origin}${base}${path}`;
}

function InviteLinkBox({ path }: { path: string }) {
  const url = inviteUrl(path);
  return (
    <div className="flex flex-col gap-1.5 rounded-[9px] border border-[#e0e4ee] bg-soft-2 p-3">
      <span className="text-[11px] font-semibold uppercase tracking-[.06em] text-muted-3">
        Invite link
      </span>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate text-[12px] text-ink">{url}</code>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            navigator.clipboard?.writeText(url);
            toast.success("Invite link copied");
          }}
        >
          Copy
        </Button>
      </div>
      <span className="text-[11px] text-muted-2">
        Valid for 7 days. Share it securely.
      </span>
    </div>
  );
}

export function AddUserDialog({
  companies,
  canSuper,
}: {
  companies: CompanyOpt[];
  canSuper: boolean;
}) {
  const qc = useQueryClient();
  const createUser = useCreateUser();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"invite" | "password">("invite");
  const [error, setError] = useState<string | null>(null);
  const [invitePath, setInvitePath] = useState<string | null>(null);

  function reset() {
    setMode("invite");
    setError(null);
    setInvitePath(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">+ Add user</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Create a participant, viewer, trainer, or administrator.
          </DialogDescription>
        </DialogHeader>

        {invitePath ? (
          <div className="flex flex-col gap-4">
            <p className="text-[13px] text-muted">
              User created. Send them this link to set their password and
              activate the account.
            </p>
            <InviteLinkBox path={invitePath} />
            <div className="flex justify-end">
              <Button type="button" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              const fd = new FormData(e.currentTarget);
              try {
                const res = await createUser.mutateAsync({
                  data: {
                    name: String(fd.get("name") || "").trim() || undefined,
                    email: String(fd.get("email") || "")
                      .trim()
                      .toLowerCase(),
                    role: String(fd.get("role")) as Role,
                    title: String(fd.get("title") || "").trim() || undefined,
                    companyId: String(fd.get("companyId") || "") || null,
                    mode,
                    password:
                      mode === "password"
                        ? String(fd.get("password") || "")
                        : undefined,
                  },
                });
                qc.invalidateQueries();
                if (res.invitePath) {
                  setInvitePath(res.invitePath);
                } else {
                  toast.success("User created");
                  setOpen(false);
                  reset();
                }
              } catch (err) {
                setError(errMsg(err));
              }
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" placeholder="Jane Doe" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  className={selectClass}
                  defaultValue="PARTICIPANT"
                >
                  {roleOptions(canSuper).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="companyId">Company (optional)</Label>
                <select
                  id="companyId"
                  name="companyId"
                  className={selectClass}
                  defaultValue=""
                >
                  <option value="">— None —</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Title (optional)</Label>
              <Input id="title" name="title" placeholder="e.g. Lead Trainer" />
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-[13px] font-medium text-ink">
                Onboarding
              </legend>
              <label className="flex items-center gap-2 text-[13px] text-muted">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "invite"}
                  onChange={() => setMode("invite")}
                />
                Send an invite link (they set their own password)
              </label>
              <label className="flex items-center gap-2 text-[13px] text-muted">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "password"}
                  onChange={() => setMode("password")}
                />
                Set an initial password now
              </label>
            </fieldset>
            {mode === "password" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Initial password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  minLength={8}
                  required
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                />
              </div>
            )}

            {error && <p className="text-[13px] text-danger">{error}</p>}
            <div className="flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? "Creating…" : "Create user"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function EditUserDialog({
  user,
  companies,
  canSuper,
}: {
  user: AdminUserRow;
  companies: CompanyOpt[];
  canSuper: boolean;
}) {
  const qc = useQueryClient();
  const updateUser = useUpdateUser();
  const regenerate = useRegenerateInvite();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitePath, setInvitePath] = useState<string | null>(null);
  const active = user.status === "active";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setError(null);
          setInvitePath(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <button className="text-[12px] font-semibold text-eq">Edit</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget);
            try {
              await updateUser.mutateAsync({
                id: user.id,
                data: {
                  name: String(fd.get("name") || "").trim() || null,
                  title: String(fd.get("title") || "").trim() || null,
                  role: String(fd.get("role")) as Role,
                  status: String(fd.get("status")),
                  companyId: String(fd.get("companyId") || "") || null,
                },
              });
              qc.invalidateQueries();
              toast.success("User updated");
              setOpen(false);
            } catch (err) {
              setError(errMsg(err));
            }
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Full name</Label>
            <Input id="edit-name" name="name" defaultValue={user.name ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-role">Role</Label>
              <select
                id="edit-role"
                name="role"
                className={selectClass}
                defaultValue={user.role}
              >
                {roleOptions(canSuper || user.role === "SUPER_ADMIN").map(
                  (r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                name="status"
                className={selectClass}
                defaultValue={user.status}
              >
                <option value="active">active</option>
                <option value="disabled">disabled</option>
                {!active && user.status !== "disabled" && (
                  <option value={user.status}>{user.status}</option>
                )}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                name="title"
                defaultValue={user.title ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-company">Company</Label>
              <select
                id="edit-company"
                name="companyId"
                className={selectClass}
                defaultValue={user.companyId ?? ""}
              >
                <option value="">— None —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {invitePath && <InviteLinkBox path={invitePath} />}
          {error && <p className="text-[13px] text-danger">{error}</p>}
          <div className="flex items-center justify-between gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={regenerate.isPending}
              onClick={async () => {
                setError(null);
                try {
                  const res = await regenerate.mutateAsync({ id: user.id });
                  if (res.invitePath) setInvitePath(res.invitePath);
                } catch (err) {
                  setError(errMsg(err));
                }
              }}
            >
              {regenerate.isPending ? "Generating…" : "Reset password link"}
            </Button>
            <div className="flex gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ImpersonateUserButton({ user }: { user: AdminUserRow }) {
  const impersonate = useImpersonateUser();
  const self = getPrincipal();
  // Mirrors the server's guards: active, non-admin, not yourself, one at a time.
  const eligible =
    user.status === "active" &&
    user.role !== "ADMIN" &&
    user.role !== "SUPER_ADMIN" &&
    user.id !== self?.id &&
    !isImpersonating();
  if (!eligible) return null;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="text-[12px] font-semibold text-mq">
          Impersonate
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Impersonate {user.name ?? user.email}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            You'll see the platform exactly as this user does for up to one
            hour. Anything you do is real, attributed to them, and flagged with
            your admin account in the audit log. Use "Exit impersonation" in
            the banner to return.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async (e) => {
              e.preventDefault();
              try {
                const res = await impersonate.mutateAsync({ id: user.id });
                startImpersonation(
                  {
                    id: res.user.id,
                    role: res.user.role,
                    companyId: res.user.companyId ?? null,
                    name: res.user.name ?? null,
                    email: res.user.email,
                  },
                  res.token,
                );
                // Full page navigation: fresh react-query cache, guards
                // re-run against the impersonated session.
                window.location.assign(base + homeForRole(res.user.role));
              } catch (err) {
                toast.error(errMsg(err));
              }
            }}
          >
            Impersonate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DeleteUserButton({ user }: { user: AdminUserRow }) {
  const qc = useQueryClient();
  const deleteUser = useDeleteUser();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="text-[12px] font-semibold text-danger">
          Delete
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {user.name ?? user.email}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the account. Users linked to enrollments,
            messages, or other records can't be deleted — deactivate them
            instead.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async (e) => {
              e.preventDefault();
              try {
                await deleteUser.mutateAsync({ id: user.id });
                qc.invalidateQueries();
                toast.success("User deleted");
              } catch (err) {
                toast.error(errMsg(err));
              }
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
