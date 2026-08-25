"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Copy, Check, Printer, FileText, Code2 } from "lucide-react"

interface ExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  routineName: string
  items: Array<{
    name: string
    isPacked: boolean
    emoji?: string
    quantity?: number
    locationNote?: string
  }>
}

export function ExportModal({
  open,
  onOpenChange,
  routineName,
  items,
}: ExportModalProps) {
  const [format, setFormat] = React.useState<"markdown" | "json">("markdown")
  const [copied, setCopied] = React.useState(false)

  const generateMarkdown = () => {
    let md = `# PocketChecker — ${routineName} Checklist\n\n`
    md += `*Exported on ${new Date().toLocaleDateString()}*\n\n`
    items.forEach((item) => {
      const check = item.isPacked ? "[x]" : "[ ]"
      const qty = item.quantity && item.quantity > 1 ? ` (${item.quantity}x)` : ""
      const note = item.locationNote ? ` — *${item.locationNote}*` : ""
      md += `- ${check} ${item.name}${qty}${note}\n`
    })
    return md
  }

  const generateJSON = () => {
    return JSON.stringify(
      {
        routine: routineName,
        exportedAt: new Date().toISOString(),
        items: items.map((i) => ({
          name: i.name,
          isPacked: i.isPacked,
          emoji: i.emoji,
          quantity: i.quantity,
          locationNote: i.locationNote,
        })),
      },
      null,
      2
    )
  }

  const content = format === "markdown" ? generateMarkdown() : generateJSON()

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([content], {
      type: format === "markdown" ? "text/markdown" : "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pocketcheck-${routineName.toLowerCase()}.${
      format === "markdown" ? "md" : "json"
    }`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PocketCheck — ${routineName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; }
          h1 { font-size: 24px; margin-bottom: 4px; }
          p.subtitle { color: #666; font-size: 13px; margin-bottom: 24px; }
          ul { list-style: none; padding: 0; margin: 0; }
          li { font-size: 15px; padding: 8px 0; border-bottom: 1px solid #eee; display: flex; align-items: center; }
          .checkbox { width: 16px; height: 16px; border: 1.5px solid #444; border-radius: 3px; display: inline-block; margin-right: 12px; }
          .qty { color: #666; font-size: 13px; margin-left: 6px; }
          .note { color: #888; font-size: 12px; margin-left: auto; font-style: italic; }
        </style>
      </head>
      <body>
        <h1>PocketCheck — ${routineName}</h1>
        <p class="subtitle">Printed on ${new Date().toLocaleDateString()}</p>
        <ul>
          ${items
            .map(
              (i) => `
            <li>
              <span class="checkbox"></span>
              <span>${i.name}</span>
              ${i.quantity && i.quantity > 1 ? `<span class="qty">(${i.quantity}x)</span>` : ""}
              ${i.locationNote ? `<span class="note">${i.locationNote}</span>` : ""}
            </li>
          `
            )
            .join("")}
        </ul>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
            <Download className="h-4 w-4 text-emerald-400" />
            Export &amp; Backup {routineName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={format === "markdown" ? "default" : "outline"}
              className="text-xs h-8 flex items-center gap-1.5"
              onClick={() => setFormat("markdown")}
            >
              <FileText className="h-3.5 w-3.5" />
              Markdown (Notion / Obsidian)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={format === "json" ? "default" : "outline"}
              className="text-xs h-8 flex items-center gap-1.5"
              onClick={() => setFormat("json")}
            >
              <Code2 className="h-3.5 w-3.5" />
              JSON Data
            </Button>
          </div>

          <div className="relative">
            <pre className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
              {content}
            </pre>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-8 text-zinc-300 border-zinc-800 hover:bg-zinc-900 flex items-center gap-1.5"
            onClick={handlePrint}
          >
            <Printer className="h-3.5 w-3.5" />
            Print / PDF
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-8 text-zinc-300 border-zinc-800 hover:bg-zinc-900 flex items-center gap-1.5"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              type="button"
              size="sm"
              className="text-xs h-8 bg-zinc-100 text-zinc-900 hover:bg-white flex items-center gap-1.5"
              onClick={handleDownload}
            >
              <Download className="h-3.5 w-3.5" />
              Download File
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
