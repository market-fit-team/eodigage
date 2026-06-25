import {
  BarChart3,
  Code,
  FileCode2,
  FileText,
  FileType,
  Search,
} from "lucide-react"
import type {
  ArtifactResponse,
  DocumentResponse,
} from "@/shared/api/generated/agent/schemas"

export const getDocumentTitle = (document: DocumentResponse) => {
  return document.title?.trim() || `${document.type} 문서`
}

export const getArtifactTitle = (artifact: ArtifactResponse) => {
  return artifact.title?.trim() || `${artifact.type} 아티팩트`
}

export const getDocumentPreview = (document: DocumentResponse) => {
  return document.summary?.trim() || document.raw_text.trim().slice(0, 140)
}

export const getArtifactPreview = (artifact: ArtifactResponse) => {
  return artifact.summary?.trim() || artifact.raw_text.trim().slice(0, 140)
}

export const getDocumentIcon = (type: DocumentResponse["type"]) => {
  switch (type) {
    case "code":
      return <FileCode2 className="size-3.5 text-blue-500" />
    case "markdown":
      return <FileText className="size-3.5 text-foreground" />
    case "search_report":
      return <Search className="size-3.5 text-emerald-500" />
    case "commercial_report":
      return <BarChart3 className="size-3.5 text-amber-500" />
    case "research_report":
      return <FileType className="size-3.5 text-sky-500" />
    default:
      return <FileText className="size-3.5 text-muted-foreground" />
  }
}

export const getArtifactIcon = (type: ArtifactResponse["type"]) => {
  switch (type) {
    case "code":
      return <Code className="size-3.5 text-blue-500" />
    case "markdown":
      return <FileText className="size-3.5 text-foreground" />
    case "search_report":
      return <Search className="size-3.5 text-emerald-500" />
    case "commercial_report":
      return <BarChart3 className="size-3.5 text-amber-500" />
    case "research_report":
      return <FileType className="size-3.5 text-sky-500" />
    default:
      return <FileText className="size-3.5 text-muted-foreground" />
  }
}
