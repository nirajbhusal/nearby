/**
 * AD/BS pairs are the ones asserted in nepali-date-converter's own
 * test/nepali-date-converter.test.ts (constructor, getters, fromAD).
 */
import assert from "node:assert/strict";
import NepaliDate from "nepali-date-converter";
import { ktmDay, nptDateBucket } from "../src/lib/nepal/format";
import { formatBikram, formatNepalAd, nepalClockParts } from "../src/lib/nepal/npt";
import { currentPeriod, greetingFor, kathmanduHour } from "../src/lib/tod";

const falgun2054 = NepaliDate.fromAD(new Date(1998, 1, 22)).getBS();
assert.deepEqual(falgun2054, { year: 2054, month: 10, date: 10, day: 0 });

const falgun2077 = new NepaliDate(2077, 10, 10).getBS();
assert.deepEqual(falgun2077, { date: 10, day: 1, month: 10, year: 2077 });
assert.deepEqual(new NepaliDate(2077, 10, 10).getAD(), { date: 22, day: 1, month: 1, year: 2021 });

const jestha2081 = new NepaliDate(new Date(2024, 5, 14).getTime()).getBS();
assert.deepEqual(jestha2081, { date: 32, day: 5, month: 1, year: 2081 });

assert.equal(new NepaliDate(2054, 10, 10).format("ddd DD, MMMM YYYY"), "Sunday 10, Falgun 2054");
assert.equal(new NepaliDate(2054, 5, 24).toString(), "Friday 24, Aswin 2054");

const morning = new Date("2026-09-27T04:07:00.000Z");
const clock = nepalClockParts(morning);
assert.equal(clock.ad, "Sunday, 27 Sep · 9:52 AM");
assert.equal(clock.bs, "Asoj 11, 2083 BS");
assert.equal(formatNepalAd(morning).ad, clock.ad);
assert.equal(formatBikram(morning), clock.bs);
assert.equal(kathmanduHour(morning), 9);
assert.equal(greetingFor(currentPeriod(morning)), "Good morning");

const evening = new Date("2026-09-27T12:30:00.000Z");
assert.equal(formatNepalAd(evening).ad, "Sunday, 27 Sep · 6:15 PM");
assert.equal(greetingFor(currentPeriod(evening)), "Good evening");

const beforeMidnight = new Date("2026-09-26T18:14:59.000Z");
const atMidnight = new Date("2026-09-26T18:15:00.000Z");
assert.equal(ktmDay(beforeMidnight), "2026-09-26");
assert.equal(ktmDay(atMidnight), "2026-09-27");
assert.equal(formatNepalAd(atMidnight).ad, "Sunday, 27 Sep · 12:00 AM");
assert.equal(nptDateBucket("2026-09-27T03:15:00.000Z", beforeMidnight), "week");
assert.equal(nptDateBucket("2026-09-27T03:15:00.000Z", atMidnight), "today");
assert.equal(nptDateBucket("2026-10-04T03:15:00.000Z", atMidnight), "week");
assert.equal(nptDateBucket("2026-10-05T03:15:00.000Z", atMidnight), "later");
assert.equal(nptDateBucket(null, atMidnight), "later");

console.log("npt clock checks passed");
