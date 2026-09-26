"use client";

import Link from "next/link";
import { useState } from "react";
import { User } from "lucide-react";
import {
  AVATAR_COLORS,
  CONNECTOR_OPTIONS,
  EVENT_INTERESTS,
  HOME_CITY_OPTIONS,
  JOB_INTERESTS,
  profileInitial,
  type ConnectorId,
  type Profile,
  type SavedKind,
} from "@/lib/local-profile";
import { clearLocalData, toggleSaved, useProfile, useSaved, writeProfile, writeUnits, useUnits } from "@/lib/profile-store";
import { ThemeChoiceControl } from "@/components/ThemeToggle";

const SAVED_LABEL: Record<SavedKind, string> = {
  charger: "Chargers",
  job: "Jobs",
  event: "Events",
  stay: "Stays",
  cowork: "Coworking",
};

const SAVED_ORDER: SavedKind[] = ["charger", "job", "event", "stay", "cowork"];

function patch(profile: Profile, partial: Partial<Profile>) {
  writeProfile({ ...profile, ...partial });
}

function toggleId<T extends string>(list: T[], id: T): T[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function ProfileScreen() {
  const profile = useProfile();
  const saved = useSaved();
  const units = useUnits();
  const [clearArmed, setClearArmed] = useState(false);
  const initial = profileInitial(profile.name);

  return (
    <main className="page-wrap profile-page">
      <header className="page-hero">
        <p className="eyebrow">Profile</p>
        <h1 className="page-title">On this device</h1>
        <p className="lede">Saved on this device. Sign-in and sync coming soon.</p>
        <button type="button" className="btn-secondary profile-signin" disabled>
          Sign in (coming soon)
        </button>
      </header>

      <section className="settings-group" aria-labelledby="profile-you">
        <h2 id="profile-you">You</h2>
        <div className="settings-list">
          <div className="settings-row profile-identity">
            <span className="avatar-face avatar-lg" style={{ background: profile.color }} aria-hidden>
              {initial || <User size={22} strokeWidth={2.2} />}
            </span>
            <label className="settings-copy">
              <strong>Name</strong>
              <input
                className="inset-field"
                value={profile.name}
                placeholder="Optional"
                autoComplete="name"
                maxLength={80}
                onChange={(event) => patch(profile, { name: event.target.value })}
              />
            </label>
          </div>
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

      <section className="settings-group" aria-labelledby="profile-city">
        <h2 id="profile-city">Home city</h2>
        <p className="group-note">Default place for Jobs, Events, and Nomad. Charge still opens on Nepal.</p>
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
              <small>Jobs and events stay on Kathmandu</small>
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

      <section className="settings-group" aria-labelledby="profile-ev">
        <h2 id="profile-ev">My EV</h2>
        <p className="group-note">Optional. Charge can filter to stations that fit, and mark them with a tick.</p>
        <div className="settings-list">
          <div className="settings-row">
            <span className="settings-copy">
              <strong>I charge an EV</strong>
              <small>Leave off if you only browse</small>
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
        id="profile-jobs"
        title="Job interests"
        note="Jobs that match move to the top. Everything else stays in the list."
        options={JOB_INTERESTS}
        selected={profile.jobInterests}
        onToggle={(id) => patch(profile, { jobInterests: toggleId(profile.jobInterests, id) })}
      />
      <InterestGroup
        id="profile-events"
        title="Event interests"
        note="Events that match move to the top. The rest stay visible."
        options={EVENT_INTERESTS}
        selected={profile.eventInterests}
        onToggle={(id) => patch(profile, { eventInterests: toggleId(profile.eventInterests, id) })}
      />

      <section className="settings-group" id="saved" aria-labelledby="profile-saved">
        <h2 id="profile-saved">Saved</h2>
        {saved.length === 0 ? (
          <p className="group-note">Hearts on chargers, jobs, events, stays, and coworking places land here.</p>
        ) : (
          SAVED_ORDER.map((kind) => {
            const rows = saved.filter((item) => item.kind === kind);
            if (rows.length === 0) return null;
            return (
              <div key={kind} className="saved-block">
                <h3>{SAVED_LABEL[kind]}</h3>
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
              </div>
            );
          })
        )}
      </section>

      <section className="settings-group" id="settings" aria-labelledby="profile-settings">
        <h2 id="profile-settings">Settings</h2>
        <div className="settings-list">
          <div className="settings-row settings-stack">
            <span className="settings-copy">
              <strong>Theme</strong>
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
          <button
            type="button"
            className="settings-row settings-danger"
            onClick={() => (clearArmed ? clearLocalData() : setClearArmed(true))}
          >
            <span className="settings-copy">
              <strong>{clearArmed ? "Confirm clear all local data" : "Clear all local data"}</strong>
              <small>Profile, saved items, theme, units, and recent places on this device</small>
            </span>
          </button>
        </div>
      </section>
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
