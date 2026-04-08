import type { RequestLogger } from "evlog"
import type { Auth } from "../auth"
import type { PlaceService } from "../services/place.service"
import type { VisitService } from "../services/visit.service"
import type { PinterestService } from "../services/pinterest.service"
import type { TikTokService } from "../services/tiktok.service"
import type { ExtractionService } from "../services/extraction.service"
import type { ImportService } from "../services/import.service"

export type Session = Awaited<ReturnType<Auth["api"]["getSession"]>>

export function createContext(props: {
  log: RequestLogger
  auth: Auth
  placeService: PlaceService
  visitService: VisitService
  pinterestService: PinterestService
  tiktokService: TikTokService
  extractionService: ExtractionService
  importService: ImportService
  session: Session
}) {
  return {
    log: props.log,
    auth: props.auth,
    placeService: props.placeService,
    visitService: props.visitService,
    pinterestService: props.pinterestService,
    tiktokService: props.tiktokService,
    extractionService: props.extractionService,
    importService: props.importService,
    session: props.session,
  }
}

export type Context = ReturnType<typeof createContext>
