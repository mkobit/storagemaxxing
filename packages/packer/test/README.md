# Packer tests (`packages/packer/test`)

## Overview

Integration tests for `packSpace` golden-path packing contracts and throughput benchmarks for transferable `ArrayBuffer` worker messaging.

## Interface

- `golden-path.test.ts` — `bun:test` suite (`storage-layout: Golden-Path Packing`) with six packing contract tests and no module exports.
- `worker-messaging.benchmark.test.ts` — `bun:test` suite (`solver worker messaging overhead benchmark`) with three transferable vs cloned `ArrayBuffer` benchmark tests and no module exports.

## Invariants

- `golden-path.test.ts` enforces zero overlap and `±1e-3` bounds on starter bins and the `gridfinity-hook-1x1` accessory, valid empty results on empty constraints, explicit `hardMin`/`softMin` overflow failures with finite origins, exclusion of oversized footprints, and `heightOverflow` failure reporting for tall bins.
- `worker-messaging.benchmark.test.ts` enforces sender buffer detachment (`byteLength === 0`), full payload byte preservation, and `< 100.0 ms` average latency across `10 KB`, `50 KB`, `250 KB`, and `1000 KB` transferable payloads.

## Side effects

- `golden-path.test.ts` has no side effects.
- `worker-messaging.benchmark.test.ts` creates and closes `MessageChannel` pairs, allocates `ArrayBuffer` payloads up to `1000 KB`, registers message event handlers, and reads `performance.now()`.

## Verification

- Run: `bun test packages/packer/test`
