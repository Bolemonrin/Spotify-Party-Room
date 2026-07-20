export interface CreateRoomProps {
  update?: boolean
  updateCallback?: () => void
  roomCode?: string
  guestCont?: boolean
  skipVotes?: number
}

export type MusicPlayerProps = {
  artist: string
  title: string
  duration: number
  time: number
  image_url: string
  is_playing: boolean
  vote_count: number
  votes_required: number
  song_id: string | number
}

export type RoomProps = {
  leaveRoomCallback: () => void
}
