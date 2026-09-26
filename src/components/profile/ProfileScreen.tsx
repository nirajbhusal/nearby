"use client";

import { SiteLink as Link } from "@/components/SiteLink";
import { useSyncExternalStore, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Compass, Download, Info, Share, User } from "lucide-react";
import { useInstallOffer } from "@/components/InstallPrompt";
import { ThemeChoiceControl } from "@/components/ThemeToggle";
import {
  AVATAR_COLORS,
  CONNECTOR_OPTIONS,
  EVENT_INTERESTS,
  HOME_CITY_OPTIONS,
  JOB_INTERESTS,
  profileInitial,
  savedCounts,
  type ConnectorId,
  type Profile,
  type SavedKind,
} from "@/lib/local-profile";
import { clearLocalData, toggleSaved, useProfile, useSaved, writeProfile, writeUnits, useUnits } from "@/lib/profile-store";

const SAVED_ROWS: { kind: SavedKind; label: string }[] = [
  { kind: "charger", label: "Chargers" },
  { kind: "job", label: "Jobs" },
  { kind: "event", label: "Events" },
  { kind: "stay", label: "Stays" },
  { kind: "cowork", label: "Coworking" },
];

function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function useHash(): string {
  return useSyncExternalStore(subscribeHash, () => window.location.hash, () => "");
}

function setHash(hash: string) {
  const next = hash ? `#${hash}` : window.location.pathname + window.location.search;
  if (hash) window.location.hash = hash;
  else window.history.pushState(null, "", next);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

function patch(profile: Profile, partial: Partial<Profile>) {
  writeProfile({ ...profile, ...partial });
}

function toggleId<T extends string>(list: T[], id: T): T[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function fitsSummary(profile: Profile): string {
  if (!profile.evOn) return "Not set";
  const labels = CONNECTOR_OPTIONS.filter((item) => profile.connectors.includes(item.id)).map((item) => item.label);
  if (labels.length === 0) return "Turned on, no connectors yet";
  const speed = profile.fastCharge ? "includes fast charge" : "AC only";
  return `${labels.join(", ")}. ${speed}.`;
}

export function ProfileScreen() {
  const hash = useHash();
  const profile = useProfile();
  const saved = useSaved();
  const counts = savedCounts(saved);
  const savedKind = SAVED_ROWS.find((row) => hash === `#saved-${row.kind}`);

  if (hash === "#edit") return <EditProfile profile={profile} />;
  if (savedKind) {
    const rows = saved.filter((item) => item.kind === savedKind.kind);
    return (
      <main className="page-wrap profile-page">
        <button type="button" className="text-btn profile-back" onClick={() => setHash("")}>
          <ChevronLeft size={18} aria-hidden />
          Profile
        </button>
        <h1 className="page-title">{savedKind.label}</h1>
        {rows.length === 0 ? (
          <p className="group-note">Nothing saved here yet.</p>
        ) : (
          <div className="settings-list">
            {rows.map((item) => (
              <div key={`${item.kind}:${item.id}`} className="settings-row">
                <Link href={item.href} className="settings-copy">
                  <strong>{item.title}</strong>
                  {item.subtitle ? <small>{item.subtitle}</small> : null}
                </Link>
                <button type="button" className="text-btn" onClick={() => toggleSaved(item)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    );
  }

  const name = profile.name.trim() || "Your profile";
  const initial = profileInitial(profile.name);

  return (
    <main className="page-wrap profile-page">
      <header className="page-hero profile-head">
        <span className="avatar-face avatar-lg" style={{ background: profile.color }} aria-hidden>
          {initial || <User size={22} strokeWidth={2.2} />}
        </span>
        <div className="profile-head-copy">
          <p className="eyebrow">Profile</p>
          <h1 className="page-title">{name}</h1>
          <p>{profile.homeCity || "Home city not set"}</p>
        </div>
        <a className="btn-secondary" href="#edit">
          Edit
        </a>
      </header>

      <section className="settings-group" aria-labelledby="profile-ev">
        <h2 id="profile-ev">My EV</h2>
        <div className="settings-list">
          <a className="settings-row" href="#edit">
            <span className="settings-copy">
              <strong>Fits my car</strong>
              <small>{fitsSummary(profile)}</small>
            </span>
            <ChevronRight size={18} aria-hidden />
          </a>
        </div>
      </section>

      <section className="settings-group" aria-labelledby="profile-saved">
        <h2 id="profile-saved">Saved</h2>
        <div className="settings-list">
          {SAVED_ROWS.map((row) => (
            <a key={row.kind} className="settings-row" href={`#saved-${row.kind}`}>
              <span className="settings-copy">
                <strong>{row.label}</strong>
              </span>
              <span className="row-count">
                {counts[row.kind]}
                <ChevronRight size={18} aria-hidden />
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="settings-group" aria-labelledby="profile-explore">
        <h2 id="profile-explore">Explore</h2>
        <div className="settings-list">
          <Link className="settings-row" href="/learn">
            <BookOpen size={20} strokeWidth={1.9} aria-hidden />
            <span className="settings-copy">
              <strong>Learn</strong>
            </span>
            <ChevronRight size={18} aria-hidden />
          </Link>
          <Link className="settings-row" href="/nomad">
            <Compass size={20} strokeWidth={1.9} aria-hidden />
            <span className="settings-copy">
              <strong>Nomad</strong>
              <small>Kathmandu and Pokhara</small>
            </span>
            <ChevronRight size={18} aria-hidden />
          </Link>
          <Link className="settings-row" href="/about">
            <Info size={20} strokeWidth={1.9} aria-hidden />
            <span className="settings-copy">
              <strong>About</strong>
            </span>
            <ChevronRight size={18} aria-hidden />
          </Link>
        </div>
      </section>

      <SettingsGroup />

      <footer className="profile-signin-block">
        <p>Saved on this device. Sign-in and sync coming soon.</p>
        <button type="button" className="btn-secondary profile-signin" disabled>
          Sign in (coming soon)
        </button>
      </footer>
    </main>
  );
}

function SettingsGroup() {
  const units = useUnits();
  const install = useInstallOffer();
  const [clearArmed, setClearArmed] = useState(false);

  return (
    <section className="settings-group" id="settings" aria-labelledby="profile-settings">
      <h2 id="profile-settings">Settings</h2>
      <div className="settings-list">
        <div className="settings-row settings-stack">
          <span className="settings-copy">
            <strong>Theme</strong>
            <small>Auto follows the time of day</small>
          </span>
          <ThemeChoiceControl />
        </div>
        <div className="settings-row settings-stack">
          <span className="settings-copy">
            <strong>Distance</strong>
          </span>
          <div className="segment" role="group" aria-label="Distance units">
            <button type="button" aria-pressed={units === "km"} onClick={() => writeUnits("km")}>
              Kilometres
            </button>
            <button type="button" aria-pressed={units === "mi"} onClick={() => writeUnits("mi")}>
              Miles
            </button>
          </div>
        </div>
        {install.mode === "prompt" ? (
          <button
            type="button"
            className="settings-row"
            onClick={() => {
              void install.install();
            }}
          >
            <Download size={20} strokeWidth={1.9} aria-hidden />
            <span className="settings-copy">
              <strong>Install app</strong>
              <small>Add Nearby to this device</small>
            </span>
          </button>
        ) : install.mode === "ios" ? (
          <p className="settings-row">
            <Share size={20} strokeWidth={1.9} aria-hidden />
            <span className="settings-copy">
              <strong>Install app</strong>
              <small>Use Share, then Add to Home Screen</small>
            </span>
          </p>
        ) : null}
        <button
          type="button"
          className="settings-row settings-danger"
          onClick={() => (clearArmed ? clearLocalData() : setClearArmed(true))}
        >
          <span className="settings-copy">
            <strong>{clearArmed ? "Confirm clear" : "Clear local data"}</strong>
            <small>
              {clearArmed
                ? "This removes the profile, saved items, theme, and recent places on this device"
                : "Profile, saved items, theme, and recent places on this device"}
            </small>
          </span>
        </button>
      </div>
    </section>
  );
}

function EditProfile({ profile }: { profile: Profile }) {
  return (
    <main className="page-wrap profile-page">
      <button type="button" className="text-btn profile-back" onClick={() => setHash("")}>
        <ChevronLeft size={18} aria-hidden />
        Profile
      </button>
      <h1 className="page-title">Edit profile</h1>

      <section className="settings-group" aria-labelledby="edit-you">
        <h2 id="edit-you">You</h2>
        <div className="settings-list">
          <label className="settings-row settings-stack">
            <span className="settings-copy">
              <strong>Name</strong>
            </span>
            <input
              className="inset-field"
              value={profile.name}
              placeholder="Optional"
              autoComplete="name"
              maxLength={80}
              onChange={(event) => patch(profile, { name: event.target.value })}
            />
          </label>
          <fieldset className="settings-row settings-stack">
            <legend>Avatar colour</legend>
            <div className="swatch-row" role="radiogroup" aria-label="Avatar colour">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={profile.color === color}
                  aria-label={color}
                  className={profile.color === color ? "swatch is-on" : "swatch"}
                  style={{ background: color }}
                  onClick={() => patch(profile, { color })}
                />
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <section className="settings-group" aria-labelledby="edit-city">
        <h2 id="edit-city">Home city</h2>
        <p className="group-note">Default place for Jobs, Events, and Nomad. Charge still opens on all chargers.</p>
        <div className="settings-list" role="radiogroup" aria-label="Home city">
          <button
            type="button"
            role="radio"
            className="settings-row"
            aria-checked={profile.homeCity == null}
            onClick={() => patch(profile, { homeCity: null })}
          >
            <span className="settings-copy">
              <strong>Not set</strong>
            </span>
            <span className="radio-mark" aria-hidden />
          </button>
          {HOME_CITY_OPTIONS.map((city) => (
            <button
              key={city}
              type="button"
              role="radio"
              className="settings-row"
              aria-checked={profile.homeCity === city}
              onClick={() => patch(profile, { homeCity: city })}
            >
              <span className="settings-copy">
                <strong>{city}</strong>
              </span>
              <span className="radio-mark" aria-hidden />
            </button>
          ))}
        </div>
      </section>

      <section className="settings-group" aria-labelledby="edit-ev">
        <h2 id="edit-ev">My EV</h2>
        <p className="group-note">Charge can filter to stations that fit, and mark them with a tick.</p>
        <div className="settings-list">
          <div className="settings-row">
            <span className="settings-copy">
              <strong>I charge an EV</strong>
            </span>
            <button
              type="button"
              className={profile.evOn ? "switch is-on" : "switch"}
              role="switch"
              aria-checked={profile.evOn}
              aria-label="I charge an EV"
              onClick={() => patch(profile, { evOn: !profile.evOn })}
            />
          </div>
          {profile.evOn ? (
            <>
              <fieldset className="settings-row settings-stack">
                <legend>Connectors</legend>
                <div className="chip-wrap">
                  {CONNECTOR_OPTIONS.map((item) => {
                    const on = profile.connectors.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={on ? "chip chip-on" : "chip"}
                        aria-pressed={on}
                        onClick={() =>
                          patch(profile, { connectors: toggleId(profile.connectors, item.id as ConnectorId) })
                        }
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <div className="settings-row">
                <span className="settings-copy">
                  <strong>Can fast-charge</strong>
                  <small>Off keeps DC-only stations out of “Fits my car”</small>
                </span>
                <button
                  type="button"
                  className={profile.fastCharge ? "switch is-on" : "switch"}
                  role="switch"
                  aria-checked={profile.fastCharge}
                  aria-label="Can fast-charge"
                  onClick={() => patch(profile, { fastCharge: !profile.fastCharge })}
                />
              </div>
            </>
          ) : null}
        </div>
      </section>

      <InterestGroup
        id="edit-jobs"
        title="Job interests"
        note="Jobs that match move to the top. Everything else stays in the list."
        options={JOB_INTERESTS}
        selected={profile.jobInterests}
        onToggle={(id) => patch(profile, { jobInterests: toggleId(profile.jobInterests, id) })}
      />
      <InterestGroup
        id="edit-events"
        title="Event interests"
        note="Events that match move to the top. The rest stay visible."
        options={EVENT_INTERESTS}
        selected={profile.eventInterests}
        onToggle={(id) => patch(profile, { eventInterests: toggleId(profile.eventInterests, id) })}
      />
    </main>
  );
}

function InterestGroup({
  id,
  title,
  note,
  options,
  selected,
  onToggle,
}: {
  id: string;
  title: string;
  note: string;
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <section className="settings-group" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      <p className="group-note">{note}</p>
      <div className="settings-list">
        <div className="settings-row">
          <div className="chip-wrap">
            {options.map((item) => {
              const on = selected.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={on ? "chip chip-on" : "chip"}
                  aria-pressed={on}
                  onClick={() => onToggle(item.id)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
