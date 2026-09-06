"use client";

import { useActionState, useState } from "react";
import { updateProfile, type ProfileState } from "@/actions/logs";
import { SubmitButton } from "@/components/ui/submit-button";
import { Avatar } from "@/components/workspace/avatar";

async function fileToJpeg(file: File) {
  const bitmap = await createImageBitmap(file);
  const max = 720;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that photo.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (next) => (next ? resolve(next) : reject(new Error("Could not compress that photo."))),
      "image/jpeg",
      0.86,
    );
  });
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}

export function ProfileForm({
  user,
}: {
  user: {
    firstName: string;
    lastName: string;
    phone: string | null;
    bio: string | null;
    email: string;
    imageUrl: string | null;
  };
}) {
  const [state, action] = useActionState(updateProfile, undefined as ProfileState);
  const [preview, setPreview] = useState(user.imageUrl);
  const [photoError, setPhotoError] = useState<string | null>(null);

  return (
    <form action={action} className="mt-6 space-y-3 rounded-3xl bg-white p-5 shadow-sm">
      {state?.error ? (
        <p className="rounded-xl bg-coral/10 px-3 py-2 text-sm text-coral">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p>
      ) : null}
      <div className="flex items-center gap-3">
        <Avatar
          user={{ firstName: user.firstName, lastName: user.lastName, imageUrl: preview }}
          size={72}
        />
        <p className="text-sm text-ink/60">This is what the team sees on My Team and in messages.</p>
      </div>
      <label className="block text-sm">
        First name
        <input name="firstName" defaultValue={user.firstName} className="mt-1 w-full rounded-xl border px-3 py-2" />
      </label>
      <label className="block text-sm">
        Last name
        <input name="lastName" defaultValue={user.lastName} className="mt-1 w-full rounded-xl border px-3 py-2" />
      </label>
      <label className="block text-sm">
        Phone
        <input name="phone" defaultValue={user.phone ?? ""} className="mt-1 w-full rounded-xl border px-3 py-2" />
      </label>
      <label className="block text-sm">
        Bio — what should the team know about you?
        <textarea
          name="bio"
          defaultValue={user.bio ?? ""}
          rows={4}
          className="mt-1 w-full rounded-xl border px-3 py-2"
          placeholder="AP classes, what you work on, anything the team should know."
        />
      </label>
      <label className="block text-sm">
        Profile photo
        <input
          name="image"
          type="file"
          accept="image/*"
          className="mt-1 w-full text-sm"
          onChange={async (event) => {
            const input = event.currentTarget;
            const original = input.files?.[0];
            setPhotoError(null);
            if (!original) return;
            try {
              const jpeg = await fileToJpeg(original);
              const transfer = new DataTransfer();
              transfer.items.add(jpeg);
              input.files = transfer.files;
              setPreview(URL.createObjectURL(jpeg));
            } catch {
              setPhotoError("Could not read that photo. Try a JPG or PNG screenshot.");
            }
          }}
        />
      </label>
      {photoError ? <p className="text-sm text-coral">{photoError}</p> : null}
      <p className="text-sm text-ink/50">{user.email}</p>
      <SubmitButton className="rounded-full bg-ink px-4 py-2 text-paper" pendingLabel="Saving…">
        Save
      </SubmitButton>
    </form>
  );
}
