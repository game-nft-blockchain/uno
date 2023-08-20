import { MessageInput } from "common"
import { MoveContext } from "@actions/onMessage"
import { sortCards } from "@utils/sortCards"
import { gameEnd } from "@helpers/gameEnd"
import { cardCanBeUsed } from "common/utils"

export function playerPutCard({
  client,
  message,
  player,
  playerID,
  room
}: MoveContext): void {
  if (room.state.currentPlayer !== player.info.id || !message.card)
    return client.send("game", {
      type: "notYourMove"
    } as MessageInput)

  const cardIndex = player.cards.findIndex(
    (e) =>
      e.cardType === message.card.cardType &&
      e.cardColor === message.card.cardColor
  )
  if (
    cardIndex === -1 ||
    !cardCanBeUsed(
      room.state.currentCardParams,
      room.state.chosenColor,
      message.card,
      player.cards
    )
  )
    return client.send("game", {
      type: "cardCantBeUsed"
    } as MessageInput)

  const card = player.cards.splice(cardIndex, 1)[0]
  room.state.usedCards.push(card)
  room.state.currentCardParams = card
  room.state.chosenColor = null
  player.playerState = null

  let newCurrentPlayer = room.state.getNextPlayer().info.id

  switch (message.card.cardType) {
    case "block":
      {
        const blockedPlayer = room.state.getNextPlayer()

        room.broadcast("game", {
          playerFrom: playerID,
          playerTo: String(blockedPlayer.info.id),
          type: "playerBlocked"
        } as MessageInput)

        newCurrentPlayer = room.state.getPostNextPlayer().info.id
      }
      break
    case "reverse":
      {
        room.state.isDirectionClockwise = !room.state.isDirectionClockwise

        newCurrentPlayer = room.state.getNextPlayer().info.id
      }
      break
    case "take-2":
      {
        const playerThatTakeCards = room.state.getNextPlayer()

        const cards = room.state.getAvailableCards(2)
        cards.forEach((card) => playerThatTakeCards.cards.push(card))
        playerThatTakeCards.cards = sortCards(playerThatTakeCards.cards)

        newCurrentPlayer = room.state.getPostNextPlayer().info.id
      }
      break
    case "take-4":
      {
        const playerThatTakeCards = room.state.getNextPlayer()

        const cards = room.state.getAvailableCards(4)
        cards.forEach((card) => playerThatTakeCards.cards.push(card))
        playerThatTakeCards.cards = sortCards(playerThatTakeCards.cards)

        player.playerState = "chooseColor"

        newCurrentPlayer = room.state.currentPlayer
      }
      break
    case "change-color":
      {
        player.playerState = "chooseColor"

        newCurrentPlayer = room.state.currentPlayer
      }
      break
    default: {
      room.broadcast("game", {
        playerFrom: playerID,
        playerTo: String(newCurrentPlayer),
        type: "playerPutCard"
      } as MessageInput)
    }
  }

  room.state.players.forEach((player) => {
    if (player.cards.length <= 0) return gameEnd(room)
  })

  room.state.currentPlayer = newCurrentPlayer
}
