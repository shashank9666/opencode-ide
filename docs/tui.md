# TUI

[Source](https://opencode.ai/docs/tui)

OpenCode provides an interactive terminal interface or TUI for working on your projects with an LLM.

Running OpenCode starts the TUI for the current directory.

```bash
opencode
```

Or you can start it for a specific working directory.

```bash
opencode /path/to/project
```

Once you’re in the TUI, you can prompt it with a message.

```text
Give me a quick summary of the codebase.
```

* * *

## [File references](#file-references)

You can reference files in your messages using `@`. This does a fuzzy file search in the current working directory.

Tip

You can also use `@` to reference files in your messages.

```text
How is auth handled in @packages/functions/src/api/index.ts?
```

The content of the file is added to the conversation automatically.

Configured [references](/docs/references) also appear in `@` autocomplete. Type `@alias` to add the reference root as context, or type `@alias/` to autocomplete files inside that reference.

```text
Compare our setup with @docs/README.md
```

* * *

## [Bash commands](#bash-commands)

Start a message with `!` to run a shell command.

```bash
!ls -la
```

The output of the command is added to the conversation as a tool result.

* * *

## [Commands](#commands)

When using the OpenCode TUI, you can type `/` followed by a command name to quickly execute actions. For example:

```bash
/help
```

Most commands also have keyboard shortcuts using `ctrl+x` as the default leader key. [Learn more](/docs/keybinds).

Here are all available slash commands:

* * *

### [connect](#connect)

Add a provider to OpenCode. Allows you to select from available providers and add their API keys.

```bash
/connect
```

* * *

### [compact](#compact)

Compact the current session. _Alias_: `/summarize`

```bash
/compact
```

**Keybind:** `ctrl+x c`

* * *

### [details](#details)

Toggle tool execution details.

```bash
/details
```

* * *

### [editor](#editor)

Open external editor for composing messages. Uses the editor set in your `EDITOR` environment variable. [Learn more](#editor-setup).

```bash
/editor
```

**Keybind:** `ctrl+x e`

* * *

### [exit](#exit)

Exit OpenCode. _Aliases_: `/quit`, `/q`

```bash
/exit
```

**Keybind:** `ctrl+x q`

* * *

### [export](#export)

Export current conversation to Markdown and open in your default editor. Uses the editor set in your `EDITOR` environment variable. [Learn more](#editor-setup).

```bash
/export
```

**Keybind:** `ctrl+x x`

* * *

### [help](#help)

Show the help dialog.

```bash
/help
```

* * *

### [init](#init)

Guided setup for creating or updating `AGENTS.md`. [Learn more](/docs/rules).

```bash
/init
```

* * *

### [models](#models)

List available models.

```bash
/models
```

**Keybind:** `ctrl+x m`

* * *

### [new](#new)

Start a new session. _Alias_: `/clear`

```bash
/new
```

**Keybind:** `ctrl+x n`

* * *

### [redo](#redo)

Redo a previously undone message. Only available after using `/undo`.

Tip

Any file changes will also be restored.

Internally, this uses Git to manage the file changes. So your project **needs to be a Git repository**.

```bash
/redo
```

**Keybind:** `ctrl+x r`

* * *

### [sessions](#sessions)

List and switch between sessions. _Aliases_: `/resume`, `/continue`

```bash
/sessions
```

**Keybind:** `ctrl+x l`

* * *

### [share](#share)

Share current session. [Learn more](/docs/share).

```bash
/share
```

* * *

### [themes](#themes)

List available themes.

```bash
/themes
```

**Keybind:** `ctrl+x t`

* * *

### [thinking](#thinking)

Toggle the visibility of thinking/reasoning blocks in the conversation. When enabled, you can see the model’s reasoning process for models that support extended thinking.

Note

This command only controls whether thinking blocks are **displayed** - it does not enable or disable the model’s reasoning capabilities. To toggle actual reasoning capabilities, use `ctrl+t` to cycle through model variants.

```bash
/thinking
```

* * *

### [undo](#undo)

Undo last message in the conversation. Removes the most recent user message, all subsequent responses, and any file changes.

Tip

Any file changes made will also be reverted.

Internally, this uses Git to manage the file changes. So your project **needs to be a Git repository**.

```bash
/undo
```

**Keybind:** `ctrl+x u`

* * *

### [unshare](#unshare)

Unshare current session. [Learn more](/docs/share#un-sharing).

```bash
/unshare
```

* * *

## [Editor setup](#editor-setup)

Both the `/editor` and `/export` commands use the editor specified in your `EDITOR` environment variable.

*   [Linux/macOS](#tab-panel-4)
*   [Windows (CMD)](#tab-panel-5)
*   [Windows (PowerShell)](#tab-panel-6)

```bash
# Example for nano or vimexport EDITOR=nanoexport EDITOR=vim
# For GUI editors, VS Code, Cursor, VSCodium, Windsurf, Zed, etc.# include --waitexport EDITOR="code --wait"
```

To make it permanent, add this to your shell profile; `~/.bashrc`, `~/.zshrc`, etc.

```bash
set EDITOR=notepad
# For GUI editors, VS Code, Cursor, VSCodium, Windsurf, Zed, etc.# include --waitset EDITOR=code --wait
```

To make it permanent, use **System Properties** > **Environment Variables**.

```powershell
$env:EDITOR = "notepad"
# For GUI editors, VS Code, Cursor, VSCodium, Windsurf, Zed, etc.# include --wait$env:EDITOR = "code --wait"
```

To make it permanent, add this to your PowerShell profile.

class r extends HTMLElement{static#e=new Map;#t;#n="starlight-synced-tabs\_\_";constructor(){super();const t=this.querySelector('\[role="tablist"\]');if(this.tabs=\[...t.querySelectorAll('\[role="tab"\]')\],this.panels=\[...this.querySelectorAll(':scope > \[role="tabpanel"\]')\],this.#t=this.dataset.syncKey,this.#t){const i=r.#e.get(this.#t)??\[\];i.push(this),r.#e.set(this.#t,i)}this.tabs.forEach((i,c)=>{i.addEventListener("click",e=>{e.preventDefault();const n=t.querySelector('\[aria-selected="true"\]');e.currentTarget!==n&&this.switchTab(e.currentTarget,c)}),i.addEventListener("keydown",e=>{const n=this.tabs.indexOf(e.currentTarget),s=e.key==="ArrowLeft"?n-1:e.key==="ArrowRight"?n+1:e.key==="Home"?0:e.key==="End"?this.tabs.length-1:null;s!==null&&this.tabs\[s\]&&(e.preventDefault(),this.switchTab(this.tabs\[s\],s))})})}switchTab(t,i,c=!0){if(!t)return;const e=c?this.getBoundingClientRect().top:0;this.tabs.forEach(s=>{s.setAttribute("aria-selected","false"),s.setAttribute("tabindex","-1")}),this.panels.forEach(s=>{s.hidden=!0});const n=this.panels\[i\];n&&(n.hidden=!1),t.removeAttribute("tabindex"),t.setAttribute("aria-selected","true"),c&&(t.focus(),r.#r(this,t),window.scrollTo({top:window.scrollY+(this.getBoundingClientRect().top-e),behavior:"instant"}))}#i(t){!this.#t||typeof localStorage>"u"||localStorage.setItem(this.#n+this.#t,t)}static#r(t,i){const c=t.#t,e=r.#s(i);if(!c||!e)return;const n=r.#e.get(c);if(n){for(const s of n){if(s===t)continue;const a=s.tabs.findIndex(o=>r.#s(o)===e);a!==-1&&s.switchTab(s.tabs\[a\],a,!1)}t.#i(e)}}static#s(t){return t.textContent?.trim()}}customElements.define("starlight-tabs",r);

Popular editor options include:

*   `code` - Visual Studio Code
*   `cursor` - Cursor
*   `windsurf` - Windsurf
*   `nvim` - Neovim editor
*   `vim` - Vim editor
*   `nano` - Nano editor
*   `notepad` - Windows Notepad
*   `subl` - Sublime Text

Note

Some editors like VS Code need to be started with the `--wait` flag.

Some editors need command-line arguments to run in blocking mode. The `--wait` flag makes the editor process block until closed.

* * *

## [Configure](#configure)

You can customize TUI behavior through `tui.json` (or `tui.jsonc`).

```json
{  "$schema": "https://opencode.ai/tui.json",  "theme": "opencode",  "leader_timeout": 2000,  "keybinds": {    "leader": "ctrl+x",    "command_list": "ctrl+p"  },  "scroll_speed": 3,  "scroll_acceleration": {    "enabled": false  },  "diff_style": "auto",  "mouse": true,  "attention": {    "enabled": true,    "notifications": true,    "sound": true,    "volume": 0.4,    "sound_pack": "opencode.default",    "sounds": {      "error": "./sounds/error.mp3"    }  }}
```

This is separate from `opencode.json`, which configures server/runtime behavior.

`keybinds` is merged with built-in defaults, so you only need to configure the shortcuts you want to change.

### [Options](#options)

*   `theme` - Sets your UI theme. [Learn more](/docs/themes).
*   `keybinds` - Customizes keyboard shortcuts. [Learn more](/docs/keybinds).
*   `leader_timeout` - Controls how long OpenCode waits after the leader key. Defaults to `2000`.
*   `scroll_acceleration.enabled` - Enable macOS-style scroll acceleration for smooth, natural scrolling. When enabled, scroll speed increases with rapid scrolling gestures and stays precise for slower movements. **This setting takes precedence over `scroll_speed` and overrides it when enabled.**
*   `scroll_speed` - Controls how fast the TUI scrolls when using scroll commands (minimum: `0.001`, supports decimal values). Defaults to `3`. **Note: This is ignored if `scroll_acceleration.enabled` is set to `true`.**
*   `diff_style` - Controls diff rendering. `"auto"` adapts to terminal width, `"stacked"` always shows a single-column layout.
*   `mouse` - Enable or disable mouse capture in the TUI (default: `true`). When disabled, the terminal’s native mouse selection/scrolling behavior is preserved.
*   `attention` - Configures TUI desktop notifications and sounds. Disabled by default.

Use `OPENCODE_TUI_CONFIG` to load a custom TUI config path.

### [Attention](#attention)

The TUI can request attention for questions, permissions, session errors, and completed sessions. Enable it with `attention.enabled`; built-in events play sounds when triggered, and non-subagent events request desktop notifications only when the terminal is blurred.

*   `enabled` - Enable all attention notifications and sounds. Defaults to `false`.
*   `notifications` - Allow terminal-mediated desktop notifications when attention is enabled. Defaults to `true`.
*   `sound` - Allow attention sounds when attention is enabled. Defaults to `true`.
*   `volume` - Default sound volume from `0` to `1`. Defaults to `0.4`.
*   `sound_pack` - Sound pack ID to use. Defaults to `opencode.default`.
*   `sounds` - Override sound files for `default`, `question`, `permission`, `error`, `done`, or `subagent_done`. Paths can be absolute, `file://` URLs, or relative to `tui.json`.

* * *

## [Customization](#customization)

You can customize various aspects of the TUI view using the command palette (`ctrl+p`). These settings persist across restarts.

* * *

#### [Username display](#username-display)

Toggle whether your username appears in chat messages. Access this through:

*   Command palette: Search for “username” or “hide username”
*   The setting persists automatically and will be remembered across TUI sessions