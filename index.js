require("dotenv").config()
const { Telegraf } = require("telegraf")
const fetchP2PData = require("./binanceData")
const { BINANCE } = require("./platforms.js")
const { BOT_TOKEN } = process.env
const PORT = process.env.PORT || 5000

const PAGE = 1
const FIAT = "CZK"
const TRADE_TYPE = "SELL"
const CRYPTO_ASSET = "USDT"
const PAY_TYPES = ["Ceskasporitelna", "Revolut"]

const bot = new Telegraf(BOT_TOKEN)
bot.start((ctx) => ctx.reply("Hello!"))

const getBinanceData = (ctx, amount) => {
	if (!amount) {
		return ctx.reply("Enter value")
	}

	let msg = `
		<b>${FIAT} / ${CRYPTO_ASSET}</b>
	`

	fetchP2PData(PAGE, FIAT, TRADE_TYPE, CRYPTO_ASSET, PAY_TYPES)
		.then((data) => {
			data.data.forEach((item) => {
				const adv = item.adv
				const minVal = adv.minSingleTransAmount
				const maxVal = adv.maxSingleTransAmount
				const methods = adv.tradeMethods
					.map((item) => item.identifier)
					.join(", ")

				console.log("===")
				console.log(minVal)
				console.log(maxVal)
				console.log(amount)
				console.log("===")
				if (+minVal <= +amount && +maxVal >= +amount) {
					const row = `
						<b>Price</b>: ${adv.price}
						<b>Banks</b>: ${methods}
						<b>min-max</b>: ${minVal}-${maxVal} ${FIAT.toLowerCase()}
					`
					msg += row
				}
			})
		})
		.then(() => {
			ctx.replyWithHTML(msg)
		})
}

bot
	.on("text", (ctx) => {
		const msg = ctx.update.message.text.split(" ")
		const platform = msg[0]
		const amount = msg[1]

		if (platform == BINANCE) {
			getBinanceData(ctx, amount)
		} else {
			ctx.reply("Platform was not added :(")
		}
	})
	.catch((err) => {
		ctx.reply("error")
		console.log(err)
	})

if (process.env.NODE_ENV === "production") {
	bot.telegram.setWebhook(
		`https://p2p-bot.herokuapp.com/bot${BOT_TOKEN}`
	)
	bot.startWebhook(`/bot${BOT_TOKEN}`, null, PORT)
} else {
	bot
		.launch()
		.then(() => {
			console.log("Bot started")
		})
		.catch((err) => console.log(err))
}
