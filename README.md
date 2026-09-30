<p align="center">
  <a href="https://opencode.ai">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="OpenCode logo">
    </picture>
  </a>
</p>

# OpenCode: Pietro's custom TUI fork

This is my personal fork of [OpenCode](https://github.com/anomalyco/opencode), the open source AI coding agent.
I use it to customize the terminal UI for my session workflow, including branching conversations into separate
terminal windows and managing multiple sessions. The custom work lives on [`custom-tui`](https://github.com/pietrovos/opencode/tree/custom-tui),
with updates merged from upstream's `dev` branch.

This fork is maintained by [Pietro Adamvoski](https://github.com/pietrovos) and is not affiliated with the OpenCode team.

## Custom session workflow

### Open multiple forks in Kitty

Choose "Fork session" from the command palette, then select the full session or a point in its message timeline.
The fork dialog asks how many copies to create. Each copy gets a numbered title such as `My session (fork #1)`
and opens in a separate Kitty window in that session's directory. The original session stays open.

This lets me explore different approaches from the same conversation history in parallel. Kitty must be available
on `PATH`. The window launcher uses the running executable, so use a compiled OpenCode binary for this workflow.

### Delete a range of sessions

In the session list, use `Shift+Up` or `Shift+Down` to select a contiguous range. Press the delete shortcut once
to mark the selected sessions for deletion, then again to confirm. With no range selected, it applies to the
focused session.

The default session-list shortcut is `Ctrl+X`, then `L`; deletion is `Ctrl+D` inside that dialog.

### Start a fresh session with a prompt

From an existing session, enter `/new <prompt>` to create a session with the current agent, model, variant,
and workspace selection. The new session opens with the text after `/new` loaded into its prompt editor,
ready to review and submit.

```text
/new investigate the failing integration tests
```

### Local additions in progress

These features are currently in the local working tree and are not yet committed to the published branch:

- `Ctrl+Alt+R`, or "Restart OpenCode in this session" in the command palette, restarts the local TUI and reopens
  the current session. The command is disabled on Windows.
- The session sidebar shows a collapsed preview of the latest user message. Click it to expand or collapse
  the full text. The preview follows the active history when messages are reverted.

## Run this fork

The installer at `opencode.ai`, package-manager releases, and upstream desktop downloads install upstream
OpenCode. To use these customizations, build or run the `custom-tui` branch from this repository.

Use the Bun version pinned in [`package.json`](package.json) (currently `1.3.14`).

```bash
git clone --branch custom-tui https://github.com/pietrovos/opencode.git opencode-custom
cd opencode-custom
bun install

# Run the local source against a project directory
bun dev /path/to/project
```

Running `bun dev .` opens OpenCode against this repository. Source mode is useful for TUI development;
the Kitty multi-fork launcher expects the compiled executable.

### Build a standalone binary

From the repository root:

```bash
bun run packages/opencode/script/build.ts --single
```

The executable is written to `packages/opencode/dist/opencode-<platform>/bin/opencode`.
For example, on Linux x64:

```bash
./packages/opencode/dist/opencode-linux-x64/bin/opencode /path/to/project
```

For a terminal-only build that skips bundling the web UI:

```bash
bun run packages/opencode/script/build.ts --single --skip-embed-web-ui
```

Rebuild after changing source code to use those changes in the standalone binary.

## Working on the fork

The fork-specific code is concentrated in:

| Path                                                                | Purpose                                        |
| ------------------------------------------------------------------- | ---------------------------------------------- |
| `packages/tui/src/component/dialog-session-list.tsx`                | Session selection and bulk deletion            |
| `packages/tui/src/ui/dialog-select.tsx`                             | Range-selection support in list dialogs        |
| `packages/tui/src/routes/session/dialog-fork-from-timeline.tsx`     | Fork count, naming, and Kitty window launching |
| `packages/tui/src/component/prompt/index.tsx`                       | `/new <prompt>` handoff                        |
| `packages/tui/src/routes/session/sidebar.tsx`                       | Latest-message preview                         |
| `packages/tui/src/app.tsx` and `packages/tui/src/config/keybind.ts` | Restart command and shortcut                   |
| `packages/opencode/src/cli/cmd/tui.ts`                              | Process restart and session reopening          |

The rest of the monorepo includes the upstream server, providers, web and desktop apps, SDKs, and documentation.
See [`AGENTS.md`](AGENTS.md) for repository conventions and [`CONTRIBUTING.md`](CONTRIBUTING.md) for upstream
development guidance. Run checks from the affected package directory, for example:

```bash
bun run --cwd packages/tui typecheck
bun run --cwd packages/opencode typecheck
```

## Upstream documentation and license

- [OpenCode documentation](https://opencode.ai/docs) covers configuration, providers, agents, and standard usage.
- [Upstream repository](https://github.com/anomalyco/opencode) contains the original project and release history.
- The other language READMEs in this repository retain the upstream documentation.

OpenCode and this fork are licensed under the [MIT license](LICENSE).
