import { createMemo, createSignal, onMount } from "solid-js"
import { useSync } from "../../context/sync"
import { DialogSelect, type DialogSelectOption } from "../../ui/dialog-select"
import type { TextPart } from "@opencode-ai/sdk/v2"
import { Locale } from "../../util/locale"
import { useSDK } from "../../context/sdk"
import { useDialog, type DialogContext } from "../../ui/dialog"
import { DialogPrompt } from "../../ui/dialog-prompt"
import { useToast } from "../../ui/toast"

export function DialogForkFromTimeline(props: { sessionID: string; onMove: (messageID?: string) => void }) {
  const sync = useSync()
  const dialog = useDialog()

  onMount(() => {
    dialog.setSize("large")
  })

  const options = createMemo((): DialogSelectOption<string | undefined>[] => {
    const messages = sync.data.message[props.sessionID] ?? []
    const fullSession = {
      title: "Full session",
      value: undefined,
      onSelect: (dialog: DialogContext) => dialog.replace(() => <DialogForkCount sessionID={props.sessionID} />),
    } satisfies DialogSelectOption<string | undefined>
    const result = [] as DialogSelectOption<string | undefined>[]
    for (const message of messages) {
      if (message.role !== "user") continue
      const part = (sync.data.part[message.id] ?? []).find(
        (x) => x.type === "text" && !x.synthetic && !x.ignored,
      ) as TextPart
      if (!part) continue
      result.push({
        title: part.text.replace(/\n/g, " "),
        value: message.id,
        footer: Locale.time(message.time.created),
        onSelect: (dialog) =>
          dialog.replace(() => <DialogForkCount sessionID={props.sessionID} messageID={message.id} />),
      })
    }
    return [fullSession, ...result.reverse()]
  })

  return <DialogSelect onMove={(option) => props.onMove(option.value)} title="Fork session" options={options()} />
}

function DialogForkCount(props: { sessionID: string; messageID?: string }) {
  const dialog = useDialog()
  const sdk = useSDK()
  const sync = useSync()
  const toast = useToast()
  const [busy, setBusy] = createSignal(false)

  async function confirm(value: string) {
    const count = Number(value)
    if (!Number.isSafeInteger(count) || count < 1) {
      toast.show({ variant: "warning", message: "Enter a positive whole number" })
      return
    }

    setBusy(true)
    const forks = await Promise.allSettled(
      Array.from({ length: count }, () =>
        sdk.client.session.fork({ sessionID: props.sessionID, messageID: props.messageID }),
      ),
    )
    const created = forks.flatMap((result) =>
      result.status === "fulfilled" && result.value.data ? [result.value.data] : [],
    )
    setBusy(false)

    if (created.length === 0) {
      toast.show({ variant: "error", message: "Could not create any forks" })
      return
    }

    const parentTitle = sync.session.get(props.sessionID)?.title ?? "Untitled session"
    const match = parentTitle.match(/^(.+) \(fork #(\d+)\)$/)
    const baseTitle = match?.[1] ?? parentTitle
    const firstForkNumber = match ? Number(match[2]) + 1 : 1
    await Promise.all(
      created.map((fork, index) =>
        sdk.client.session.update({
          sessionID: fork.id,
          title: `${baseTitle} (fork #${firstForkNumber + index})`,
        }),
      ),
    )
    for (const fork of created) {
      Bun.spawn(["kitty", "--detach", "--directory", fork.directory, process.execPath, "--session", fork.id], {
        stdin: "ignore",
        stdout: "ignore",
        stderr: "ignore",
      })
      // Give Kitty time to register each window before dispatching the next.
      await Bun.sleep(100)
    }
    dialog.clear()
    if (created.length !== count) {
      toast.show({ variant: "warning", message: `Created ${created.length} of ${count} forks` })
    }
  }

  return (
    <DialogPrompt
      title="Fork session"
      placeholder="Number of forks"
      busy={busy()}
      busyText="Creating forks..."
      onConfirm={(value) => void confirm(value)}
      onCancel={() => dialog.clear()}
    />
  )
}
