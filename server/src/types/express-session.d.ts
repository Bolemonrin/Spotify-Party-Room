import "express-session";

declare module "express-session" {
  interface SessionData {
    roomCode?: string;
    guestCanPause?: boolean
    votesToSkip?: number
    
  }
}
