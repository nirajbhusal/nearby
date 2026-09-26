"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { profileInitial } from "@/lib/local-profile";
import { useProfile } from "@/lib/profile-store";

export function AvatarFace() {
  const profile = useProfile();
  const initial = profileInitial(profile.name);
  return (
    <span className="avatar-face" style={{ background: profile.color }} aria-hidden>
      {initial || <User size={16} strokeWidth={2.2} />}
    </span>
  );
}

export function ProfileAvatar({ current = false }: { current?: boolean }) {
  const profile = useProfile();
  const name = profile.name.trim();
  return (
    <Link
      href="/profile"
      className="avatar-btn"
      aria-label={name ? `${name}, profile` : "Profile"}
      aria-current={current ? "page" : undefined}
    >
      <AvatarFace />
    </Link>
  );
}
