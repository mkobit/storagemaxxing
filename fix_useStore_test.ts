import { SpaceConstraintSchema } from "@storagemaxxing/assembly/SpaceConstraint.js";
const testConstraints = [
  { mode: "hard", binId: "test-1", lo: 1, hi: null, hard: true, color: "red" },
  { mode: "soft", binId: "test-2", lo: 1, hi: null, hard: false, color: "blue" },
  { mode: "auto", binId: "test-3", lo: 0, hi: null, hard: false, color: "green" },
  { mode: "off", binId: "test-4", lo: 0, hi: 0, hard: true, color: "black" }
];
console.log(testConstraints.map(c => SpaceConstraintSchema.parse(c)));
