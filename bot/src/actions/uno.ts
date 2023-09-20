import { GroupContext } from "@typings/context"
import { InlineKeyboard } from "grammy"
import ShortUniqueId from "short-unique-id"

export default async function uno(ctx: GroupContext) {
  let id = ctx.session.group.gameId
  if (!id) {
    const uid = new ShortUniqueId({ length: 9 })

    id = uid.rnd()
  }

  ctx.session.group.gameId = id

  const keyboard = new InlineKeyboard().url(
    ctx.t("uno.key"),
    `https://t.me/${ctx.me.username}/game?startapp=${id}_private&startApp=${id}_private`
  )

  return ctx.reply(ctx.t("uno"), { reply_markup: keyboard })
}
