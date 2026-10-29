import { afterEach, expect, test } from "bun:test";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

const root = process.cwd();
const scratch = resolve(".sbx-task");
mkdirSync(scratch, { recursive: true });
const dirs: string[] = [];
afterEach(() =>
  dirs
    .splice(0)
    .forEach((dir) => rmSync(dir, { recursive: true, force: true })),
);

function fixture() {
  const dir = mkdtempSync(join(scratch, "sbx-check-test-"));
  dirs.push(dir);
  mkdirSync(join(dir, ".sbx/kit"), { recursive: true });
  writeFileSync(join(dir, "sbx"), "#!/bin/sh\nexit 0\n");
  chmodSync(join(dir, "sbx"), 0o755);
  for (const file of ["sbxenv.yaml", "sbxenv.agy.yaml", "sbxenv.claude.yaml"]) {
    writeFileSync(
      join(dir, ".sbx", file),
      readFileSync(join(root, ".sbx", file)),
    );
  }
  writeFileSync(
    join(dir, "mise.toml"),
    '[tools]\nbun = "9.8.7"\n"github:gastownhall/beads" = "7.8.9"\n',
  );
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ packageManager: "bun@9.8.7", engines: { bun: "9.8.7" } }),
  );
  return dir;
}

function check(dir: string, command: string) {
  writeFileSync(
    join(dir, ".sbx/kit/spec.yaml"),
    `schemaVersion: "2"\nname: test\nsetup:\n  install:\n    - command: ${JSON.stringify(command)}\n`,
  );
  return Bun.spawnSync(
    [process.execPath, join(root, "scripts/check-sbx-env.ts")],
    { cwd: dir, env: { ...process.env, PATH: `${dir}:${process.env.PATH}` } },
  );
}

test("repository tool pins can change without a second pin in the kit", () => {
  expect(
    check(
      fixture(),
      'set -eu\ncd "$workdir"\nmise trust mise.toml\nmise install\nmise reshim',
    ).exitCode,
  ).toBe(0);
});

test("the kit must install repository tools and reject separate global pins", () => {
  expect(
    check(
      fixture(),
      "mise use -g bun@9.8.7 && mise use -g github:gastownhall/beads@7.8.9",
    ).exitCode,
  ).toBe(1);
  expect(check(fixture(), "mise install\nmise use -g bun@9.8.7").exitCode).toBe(
    1,
  );
});

test("mise download failures stop bootstrap before the installer runs", () => {
  const kit = Bun.YAML.parse(readFileSync(".sbx/kit/spec.yaml", "utf8")) as {
    setup: { install: { command: string }[] };
  };
  const dir = fixture();
  writeFileSync(join(dir, "curl"), "#!/bin/sh\nexit 22\n");
  chmodSync(join(dir, "curl"), 0o755);
  const command = kit.setup.install[0]!.command.replaceAll(
    "/usr/local/bin/mise",
    join(dir, "mise"),
  )
    .replaceAll("/etc/profile.d/mise.sh", join(dir, "profile.sh"))
    .replaceAll("/etc/sandbox-persistent.sh", join(dir, "persistent.sh"));
  const result = Bun.spawnSync(["sh", "-c", command], {
    env: { ...process.env, TMPDIR: dir, PATH: `${dir}:${process.env.PATH}` },
  });
  expect(result.exitCode).not.toBe(0);
});

test("bootstrap rejects an installer that succeeds without installing mise", () => {
  const kit = Bun.YAML.parse(readFileSync(".sbx/kit/spec.yaml", "utf8")) as {
    setup: { install: { command: string }[] };
  };
  const dir = fixture();
  writeFileSync(
    join(dir, "curl"),
    '#!/bin/sh\nfor arg do output="$arg"; done\nprintf "exit 0\\n" > "$output"\n',
  );
  chmodSync(join(dir, "curl"), 0o755);
  const command = kit.setup.install[0]!.command.replaceAll(
    "/usr/local/bin/mise",
    join(dir, "missing-mise"),
  )
    .replaceAll("/etc/profile.d/mise.sh", join(dir, "profile.sh"))
    .replaceAll("/etc/sandbox-persistent.sh", join(dir, "persistent.sh"));
  const result = Bun.spawnSync(["sh", "-c", command], {
    env: { ...process.env, TMPDIR: dir, PATH: `${dir}:${process.env.PATH}` },
  });
  expect(result.exitCode).not.toBe(0);
  expect(result.stderr.toString()).toContain("mise installer did not create");
});

test("the tool install step runs mise install in the assigned repository", () => {
  const kit = Bun.YAML.parse(readFileSync(".sbx/kit/spec.yaml", "utf8")) as {
    setup: { install: { command: string }[] };
  };
  const dir = fixture();
  writeFileSync(
    join(dir, "mise"),
    '#!/bin/sh\nprintf "%s %s\\n" "$PWD" "$*" >> "$WORKSPACE_DIR/mise-calls"\n',
  );
  chmodSync(join(dir, "mise"), 0o755);
  const result = Bun.spawnSync(["sh", "-c", kit.setup.install[2]!.command], {
    env: {
      ...process.env,
      WORKSPACE_DIR: dir,
      PATH: `${dir}:${process.env.PATH}`,
    },
  });
  expect(result.exitCode).toBe(0);
  expect(readFileSync(join(dir, "mise-calls"), "utf8")).toContain(
    `${dir} install\n`,
  );
  rmSync(join(dir, "mise.toml"));
  expect(
    Bun.spawnSync(["sh", "-c", kit.setup.install[2]!.command], {
      env: {
        ...process.env,
        WORKSPACE_DIR: dir,
        PATH: `${dir}:${process.env.PATH}`,
      },
    }).exitCode,
  ).not.toBe(0);
});
