import { MoveContext } from "@actions/onMessage"
import { updateMetadata } from "@helpers/updateMetadata"
import { updateUser } from "@helpers/updateUser"
import { sendError } from "@helpers/send"

export async function surrender({
  client,
  player,
  room
}: MoveContext): Promise<void> {
  if (room.state.status !== "playing") return sendError(client, "notStarted")

  room.state.players.forEach((element) => {
    element.points = element.info.id === player.info.id ? 0 : 1
  })

  const playersArray = Array.from(room.state.players.values()).sort(
    (a, b) => b.points - a.points
  )

  playersArray.forEach((element) => {
    element.winAmount =
      element.info.id === player.info.id ? -room.state.bet : room.state.bet
  })

  room.state.status = "ended"
  await room.unlock()
  updateMetadata(room)
  room.state.currentPlayer = null

  await Promise.all(
    playersArray.map((player) =>
      updateUser(player.info.id, {
        $inc: {
          [`statistics.${player.winAmount > 0 ? "win" : "lose"}`]: 1,
          balance: player.winAmount
        }
      })
    )
  )
}
