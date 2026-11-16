export interface ImportRoutineItem {
  name: string
  emoji?: string
  quantity?: number
  locationNote?: string
}

export interface ImportRoutineData {
  name: string
  icon?: string
  items: ImportRoutineItem[]
}

export function extractImportParam(
  url: string | null | undefined
): string | null {
  if (!url || typeof url !== "string") return null
  const queryIndex = url.indexOf("?")
  if (queryIndex === -1) return null
  const queryString = url.slice(queryIndex + 1)
  try {
    const searchParams = new URLSearchParams(queryString)
    return searchParams.get("import") || searchParams.get("data") || null
  } catch {
    return null
  }
}

export function decodeRoutinePayload(
  importParam: string | null | undefined
): ImportRoutineData | null {
  if (!importParam || typeof importParam !== "string") return null
  try {
    const rawParam = decodeURIComponent(importParam.trim())
    let json = ""
    if (typeof atob === "function") {
      try {
        json = decodeURIComponent(escape(atob(rawParam)))
      } catch {
        json = atob(rawParam)
      }
    } else {
      const maybeBuffer = (
        globalThis as unknown as {
          Buffer?: {
            from: (
              s: string,
              enc: string
            ) => { toString: (enc: string) => string }
          }
        }
      ).Buffer
      if (maybeBuffer) {
        json = maybeBuffer.from(rawParam, "base64").toString("utf-8")
      }
    }

    if (!json) return null

    const parsed = JSON.parse(json)
    if (!parsed || typeof parsed !== "object") return null
    if (typeof parsed.name !== "string" || !parsed.name.trim()) return null
    if (!Array.isArray(parsed.items)) return null

    const items: ImportRoutineItem[] = parsed.items
      .filter(
        (i: unknown) =>
          i &&
          typeof i === "object" &&
          typeof (i as { name?: unknown }).name === "string" &&
          Boolean((i as { name: string }).name.trim())
      )
      .map(
        (i: {
          name: string
          emoji?: unknown
          quantity?: unknown
          locationNote?: unknown
        }) => ({
          name: String(i.name).trim(),
          ...(typeof i.emoji === "string" && i.emoji.trim()
            ? { emoji: i.emoji.trim() }
            : {}),
          ...(typeof i.quantity === "number" &&
          !isNaN(i.quantity) &&
          i.quantity > 0
            ? { quantity: Math.floor(i.quantity) }
            : {}),
          ...(typeof i.locationNote === "string" && i.locationNote.trim()
            ? { locationNote: i.locationNote.trim() }
            : {}),
        })
      )

    return {
      name: parsed.name.trim(),
      icon:
        typeof parsed.icon === "string" && parsed.icon.trim()
          ? parsed.icon.trim()
          : "tag",
      items,
    }
  } catch {
    return null
  }
}

export function parseRoutineFromUrl(
  url: string | null | undefined
): ImportRoutineData | null {
  const param = extractImportParam(url)
  if (!param) return null
  return decodeRoutinePayload(param)
}
