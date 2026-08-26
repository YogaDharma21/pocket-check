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
      const qty =
        item.quantity && item.quantity > 1 ? ` (${item.quantity}x)` : ""
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
      <DialogContent className="border-border bg-card text-card-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Download className="h-4 w-4" />
            Export &amp; Backup {routineName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={format === "markdown" ? "default" : "outline"}
              className="flex h-8 cursor-pointer items-center gap-1.5 text-xs font-bold"
              onClick={() => setFormat("markdown")}
            >
              <FileText className="h-3.5 w-3.5" />
              Markdown (Notion / Obsidian)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={format === "json" ? "default" : "outline"}
              className="flex h-8 cursor-pointer items-center gap-1.5 text-xs font-bold"
              onClick={() => setFormat("json")}
            >
              <Code2 className="h-3.5 w-3.5" />
              JSON Data
            </Button>
          </div>

          <div className="relative">
            <pre className="max-h-48 overflow-y-auto rounded-lg border border-border bg-muted/60 p-3 font-mono text-xs whitespace-pre-wrap text-foreground">
              {content}
            </pre>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex h-8 cursor-pointer items-center gap-1.5 border-border text-xs font-bold text-foreground hover:bg-muted"
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
              className="flex h-8 cursor-pointer items-center gap-1.5 border-border text-xs font-bold text-foreground hover:bg-muted"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex h-8 cursor-pointer items-center gap-1.5 bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90"
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
