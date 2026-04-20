export interface InstallationRequirement {
  readonly type: "drill" | "rail" | "adhesive" | "freestanding" | "stack-only";
  readonly description: string;
}
