# Intro

[Source](https://opencode.ai/docs)

[**OpenCode**](/) is an open source AI coding agent. It’s available as a terminal-based interface, desktop app, or IDE extension.

![OpenCode TUI with the opencode theme](/docs/_astro/screenshot.CQjBbRyJ_1dLadc.webp)

Let’s get started.

* * *

#### [Prerequisites](#prerequisites)

To use OpenCode in your terminal, you’ll need:

1.  A modern terminal emulator like:
    
    *   [WezTerm](https://wezterm.org), cross-platform
    *   [Alacritty](https://alacritty.org), cross-platform
    *   [Ghostty](https://ghostty.org), Linux and macOS
    *   [Kitty](https://sw.kovidgoyal.net/kitty/), Linux and macOS
2.  API keys for the LLM providers you want to use.
    

* * *

## [Install](#install)

The easiest way to install OpenCode is through the install script.

```bash
curl -fsSL https://opencode.ai/install | bash
```

You can also install it with the following commands:

*   **Using Node.js**
    
    *   [npm](#tab-panel-0)
    *   [Bun](#tab-panel-1)
    *   [pnpm](#tab-panel-2)
    *   [Yarn](#tab-panel-3)
    
    ```bash
    npm install -g opencode-ai
    ```
    
    ```bash
    bun install -g opencode-ai
    ```
    
    ```bash
    pnpm install -g opencode-ai
    ```
    
    ```bash
    yarn global add opencode-ai
    ```
    
    class r extends HTMLElement{static#e=new Map;#t;#n="starlight-synced-tabs\_\_";constructor(){super();const t=this.querySelector('\[role="tablist"\]');if(this.tabs=\[...t.querySelectorAll('\[role="tab"\]')\],this.panels=\[...this.querySelectorAll(':scope > \[role="tabpanel"\]')\],this.#t=this.dataset.syncKey,this.#t){const i=r.#e.get(this.#t)??\[\];i.push(this),r.#e.set(this.#t,i)}this.tabs.forEach((i,c)=>{i.addEventListener("click",e=>{e.preventDefault();const n=t.querySelector('\[aria-selected="true"\]');e.currentTarget!==n&&this.switchTab(e.currentTarget,c)}),i.addEventListener("keydown",e=>{const n=this.tabs.indexOf(e.currentTarget),s=e.key==="ArrowLeft"?n-1:e.key==="ArrowRight"?n+1:e.key==="Home"?0:e.key==="End"?this.tabs.length-1:null;s!==null&&this.tabs\[s\]&&(e.preventDefault(),this.switchTab(this.tabs\[s\],s))})})}switchTab(t,i,c=!0){if(!t)return;const e=c?this.getBoundingClientRect().top:0;this.tabs.forEach(s=>{s.setAttribute("aria-selected","false"),s.setAttribute("tabindex","-1")}),this.panels.forEach(s=>{s.hidden=!0});const n=this.panels\[i\];n&&(n.hidden=!1),t.removeAttribute("tabindex"),t.setAttribute("aria-selected","true"),c&&(t.focus(),r.#r(this,t),window.scrollTo({top:window.scrollY+(this.getBoundingClientRect().top-e),behavior:"instant"}))}#i(t){!this.#t||typeof localStorage>"u"||localStorage.setItem(this.#n+this.#t,t)}static#r(t,i){const c=t.#t,e=r.#s(i);if(!c||!e)return;const n=r.#e.get(c);if(n){for(const s of n){if(s===t)continue;const a=s.tabs.findIndex(o=>r.#s(o)===e);a!==-1&&s.switchTab(s.tabs\[a\],a,!1)}t.#i(e)}}static#s(t){return t.textContent?.trim()}}customElements.define("starlight-tabs",r);
*   **Using Homebrew on macOS and Linux**
    
    ```bash
    brew install anomalyco/tap/opencode
    ```
    
    > We recommend using the OpenCode tap for the most up to date releases. The official `brew install opencode` formula is maintained by the Homebrew team and is updated less frequently.
    
*   **Installing on Arch Linux**
    
    ```bash
    sudo pacman -S opencode           # Arch Linux (Stable)paru -S opencode-bin              # Arch Linux (Latest from AUR)
    ```
    

#### [Windows](#windows)

Recommended: Use WSL

For the best experience on Windows, we recommend using [Windows Subsystem for Linux (WSL)](/docs/windows-wsl). It provides better performance and full compatibility with OpenCode’s features.

*   **Using Chocolatey**
    
    ```bash
    choco install opencode
    ```
    
*   **Using Scoop**
    
    ```bash
    scoop install opencode
    ```
    
*   **Using NPM**
    
    ```bash
    npm install -g opencode-ai
    ```
    
*   **Using Mise**
    
    ```bash
    mise use -g github:anomalyco/opencode
    ```
    
*   **Using Docker**
    
    ```bash
    docker run -it --rm ghcr.io/anomalyco/opencode
    ```
    

Support for installing OpenCode on Windows using Bun is currently in progress.

You can also grab the binary from the [Releases](https://github.com/anomalyco/opencode/releases).

* * *

## [Configure](#configure)

With OpenCode you can use any LLM provider by configuring their API keys.

If you are new to using LLM providers, we recommend using [OpenCode Zen](/docs/zen). It’s a curated list of models that have been tested and verified by the OpenCode team.

1.  Run the `/connect` command in the TUI, select opencode, and head to [opencode.ai/auth](https://opencode.ai/auth).
    
    ```txt
    /connect
    ```
    
2.  Sign in, add your billing details, and copy your API key.
    
3.  Paste your API key.
    
    ```txt
    ┌ API key││└ enter
    ```
    

Alternatively, you can select one of the other providers. [Learn more](/docs/providers#directory).

* * *

## [Initialize](#initialize)

Now that you’ve configured a provider, you can navigate to a project that you want to work on.

```bash
cd /path/to/project
```

And run OpenCode.

```bash
opencode
```

Next, initialize OpenCode for the project by running the following command.

```bash
/init
```

This will get OpenCode to analyze your project and create an `AGENTS.md` file in the project root.

Tip

You should commit your project’s `AGENTS.md` file to Git.

This helps OpenCode understand the project structure and the coding patterns used.

* * *

## [Usage](#usage)

You are now ready to use OpenCode to work on your project. Feel free to ask it anything!

If you are new to using an AI coding agent, here are some examples that might help.

* * *

### [Ask questions](#ask-questions)

You can ask OpenCode to explain the codebase to you.

Tip

Use the `@` key to fuzzy search for files in the project.

```txt
How is authentication handled in @packages/functions/src/api/index.ts
```

This is helpful if there’s a part of the codebase that you didn’t work on.

* * *

### [Add features](#add-features)

You can ask OpenCode to add new features to your project. Though we first recommend asking it to create a plan.

1.  **Create a plan**
    
    OpenCode has a _Plan mode_ that disables its ability to make changes and instead suggest _how_ it’ll implement the feature.
    
    Switch to it using the **Tab** key. You’ll see an indicator for this in the lower right corner.
    
    ```bash
    <TAB>
    ```
    
    Now let’s describe what we want it to do.
    
    ```txt
    When a user deletes a note, we'd like to flag it as deleted in the database.Then create a screen that shows all the recently deleted notes.From this screen, the user can undelete a note or permanently delete it.
    ```
    
    You want to give OpenCode enough details to understand what you want. It helps to talk to it like you are talking to a junior developer on your team.
    
    Tip
    
    Give OpenCode plenty of context and examples to help it understand what you want.
    
2.  **Iterate on the plan**
    
    Once it gives you a plan, you can give it feedback or add more details.
    
    ```txt
    We'd like to design this new screen using a design I've used before.[Image #1] Take a look at this image and use it as a reference.
    ```
    
    Tip
    
    Drag and drop images into the terminal to add them to the prompt.
    
    OpenCode can scan any images you give it and add them to the prompt. You can do this by dragging and dropping an image into the terminal.
    
3.  **Build the feature**
    
    Once you feel comfortable with the plan, switch back to _Build mode_ by hitting the **Tab** key again.
    
    ```bash
    <TAB>
    ```
    
    And asking it to make the changes.
    
    ```bash
    Sounds good! Go ahead and make the changes.
    ```
    

* * *

### [Make changes](#make-changes)

For more straightforward changes, you can ask OpenCode to directly build it without having to review the plan first.

```txt
We need to add authentication to the /settings route. Take a look at how this ishandled in the /notes route in @packages/functions/src/notes.ts and implementthe same logic in @packages/functions/src/settings.ts
```

You want to make sure you provide a good amount of detail so OpenCode makes the right changes.

* * *

### [Undo changes](#undo-changes)

Let’s say you ask OpenCode to make some changes.

```txt
Can you refactor the function in @packages/functions/src/api/index.ts?
```

But you realize that it is not what you wanted. You **can undo** the changes using the `/undo` command.

```bash
/undo
```

OpenCode will now revert the changes you made and show your original message again.

```txt
Can you refactor the function in @packages/functions/src/api/index.ts?
```

From here you can tweak the prompt and ask OpenCode to try again.

Tip

You can run `/undo` multiple times to undo multiple changes.

Or you **can redo** the changes using the `/redo` command.

```bash
/redo
```

* * *

## [Share](#share)

The conversations that you have with OpenCode can be [shared with your team](/docs/share).

```bash
/share
```

This will create a link to the current conversation and copy it to your clipboard.

Note

Conversations are not shared by default.

Here’s an [example conversation](https://opencode.ai/s/4XP1fce5) with OpenCode.

* * *

## [Customize](#customize)

And that’s it! You are now a pro at using OpenCode.

To make it your own, we recommend [picking a theme](/docs/themes), [customizing the keybinds](/docs/keybinds), [configuring code formatters](/docs/formatters), [creating custom commands](/docs/commands), or playing around with the [OpenCode config](/docs/config).