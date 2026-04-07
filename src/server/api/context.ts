import type { RequestLogger } from "evlog"
import type { Auth } from "../auth"
import type { PlaceService } from "../services/place.service"
import type { VisitService } from "../services/visit.service"

export type Session = Awaited<ReturnType<Auth["api"]["getSession"]>>

export function createContext(props: {
  log: RequestLogger
  auth: Auth
  placeService: PlaceService
  visitService: VisitService
  session: Session
}) {
  return {
    log: props.log,
    auth: props.auth,
    placeService: props.placeService,
    visitService: props.visitService,
    session: props.session,
  }
}

export type Context = ReturnType<typeof createContext>
