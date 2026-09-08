"use client";

import { Pencil, RotateCcw, Save, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SettingsDetailPanel, SettingsFieldGroup } from "@/components/settings-crud-layout";
import type { UserProfile } from "@/lib/profile-management";

type Props = UserProfile & {
  provider: string;
  providerConfigured: boolean;
  onClose: () => void;
  onSaved: (profile: UserProfile) => void;
};

type ProfileDraft = UserProfile & { theme: string };
type FieldErrors = Partial<Record<keyof UserProfile, string>>;

function validateProfile(draft: ProfileDraft): FieldErrors {
  const errors: FieldErrors = {};
  const name = draft.name.trim();
  const email = draft.email.trim();
  if (!name) errors.name = "Enter a name.";
  else if (name.length > 100) errors.name = "Name must be 100 characters or fewer.";
  if (!email) errors.email = "Enter an email address.";
  else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  return errors;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {children}
      {error && <span className="mt-1.5 block text-sm text-brand-danger">{error}</span>}
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 break-all text-sm font-medium">{value}</dd></div>;
}

function themeLabel(theme: string) {
  return theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System";
}

export function ProfileView({ name, email, provider, providerConfigured, onClose, onSaved }: Props) {
  const { theme, setTheme } = useTheme();
  const initialTheme = theme ?? "system";
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [saved, setSaved] = useState<ProfileDraft>({ name, email, theme: initialTheme });
  const [draft, setDraft] = useState<ProfileDraft>({ name, email, theme: initialTheme });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const dirty = mode === "edit" && JSON.stringify(draft) !== JSON.stringify(saved);

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (dirty) event.preventDefault();
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (mode === "view") onClose();
      else if (!dirty || window.confirm("Discard your unsaved profile changes?")) cancelEdit();
    }
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("keydown", onEscape);
    };
  });

  function beginEdit() {
    const next = { ...saved, theme: theme ?? saved.theme };
    setSaved(next);
    setDraft(next);
    setErrors({});
    setFormError("");
    setMode("edit");
  }

  function cancelEdit() {
    setDraft(saved);
    setErrors({});
    setFormError("");
    setMode("view");
  }

  function resetForm() {
    setDraft(saved);
    setErrors({});
    setFormError("");
  }

  function updateDraft<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    if (key === "name" || key === "email") setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError("");
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clientErrors = validateProfile(draft);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      setFormError("Check the highlighted fields.");
      return;
    }

    setSaving(true);
    setErrors({});
    setFormError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft.name.trim(), email: draft.email.trim().toLowerCase() }),
      });
      const result = await response.json() as {
        profile?: UserProfile;
        error?: string;
        fieldErrors?: Partial<Record<keyof UserProfile, string[]>>;
      };
      if (!response.ok || !result.profile) {
        setFormError(result.error ?? "Your profile could not be saved.");
        if (result.fieldErrors) {
          setErrors(Object.fromEntries(Object.entries(result.fieldErrors).map(([key, value]) => [key, value?.[0]])) as FieldErrors);
        }
        return;
      }

      const next = { ...result.profile, theme: draft.theme };
      setTheme(draft.theme);
      setSaved(next);
      setDraft(next);
      onSaved(result.profile);
      setMode("view");
    } catch {
      setFormError("Your profile could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const toolbar = mode === "view" ? (
    <>
      <button type="button" className="button-primary" onClick={beginEdit}><Pencil size={16} /> Edit</button>
      <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close profile"><X size={19} /></button>
    </>
  ) : (
    <>
      <button type="button" className="button-secondary" onClick={cancelEdit} disabled={saving}>Cancel</button>
      <button type="reset" form="profile-form" className="button-secondary" disabled={saving}><RotateCcw size={16} /> Reset</button>
      <button type="submit" form="profile-form" className="button-primary" disabled={saving}><Save size={16} /> {saving ? "Saving…" : "Save"}</button>
    </>
  );

  return (
    <SettingsDetailPanel open title={mode === "edit" ? "Edit profile" : "Profile"} subtitle={mode === "view" ? "Account and workspace preferences" : "Update your profile and preferences"} onClose={onClose} footer={toolbar}>
      {mode === "view" ? (
        <>
          <SettingsFieldGroup title="Account" description="Signed-in identity"><Detail label="Display name" value={saved.name} /><Detail label="Email" value={saved.email} /></SettingsFieldGroup>
          <SettingsFieldGroup title="Appearance" description="Interface theme"><Detail label="Color theme" value={themeLabel(theme ?? saved.theme)} /></SettingsFieldGroup>
          <SettingsFieldGroup title="Model provider" description="Server runtime"><div className="sm:col-span-2 rounded-2xl border border-border bg-panel p-4"><div className="flex items-center justify-between gap-4"><span className="text-sm font-medium capitalize">{provider}</span><span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">{providerConfigured ? "Active" : "Needs configuration"}</span></div><p className="mt-3 text-sm leading-6 text-muted-foreground">Model names, endpoints, and secrets are managed with server environment variables and are never displayed here.</p></div></SettingsFieldGroup>
        </>
      ) : (
        <form id="profile-form" onSubmit={saveProfile} onReset={(event) => { event.preventDefault(); resetForm(); }}>
          <SettingsFieldGroup title="Account" description="Update the identity shown throughout the application.">
            <Field label="Display name" error={errors.name}><input className="field" value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} autoComplete="name" required autoFocus /></Field>
            <Field label="Email" error={errors.email}><input className="field" type="email" value={draft.email} onChange={(event) => updateDraft("email", event.target.value)} autoComplete="email" required /></Field>
          </SettingsFieldGroup>
          <SettingsFieldGroup title="Appearance" description="Choose the interface theme."><div className="sm:col-span-2"><Field label="Color theme"><select className="field" value={draft.theme} onChange={(event) => updateDraft("theme", event.target.value)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></Field></div></SettingsFieldGroup>
          <SettingsFieldGroup title="Model provider" description="Server runtime"><div className="sm:col-span-2 rounded-2xl border border-border bg-panel p-4"><div className="flex items-center justify-between gap-4"><span className="text-sm font-medium capitalize">{provider}</span><span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">{providerConfigured ? "Active" : "Needs configuration"}</span></div><p className="mt-3 text-sm leading-6 text-muted-foreground">Provider configuration is managed with server environment variables and cannot be edited here.</p></div></SettingsFieldGroup>
          {formError && <p role="alert" className="rounded-xl bg-brand-danger/15 px-4 py-3 text-sm text-brand-danger">{formError}</p>}
        </form>
      )}
    </SettingsDetailPanel>
  );
}
