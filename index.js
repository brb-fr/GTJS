const Pogtopia = require("pogtopia")
const fs = require("fs")
const http = require("node:http")
const server_data = `
server|192.168.0.100
loginurl|youtube.com
port|17901
#maint|
meta|ignoremeta
RTENDMARKERBS1001
`
const server = new Pogtopia.Server({
    db: {
        pass: "brbfr",
        user: "brbfr"
    },
    server: {
        port: 17901,
        itemsDatFile: "items.dat",
    }
})
let httpserver = http.createServer((req, res) => {
    console.log(req.url)
    if (req.method == "GET" || req.method == "POST") {
        if (req.url == "/growtopia/server_data.php") {
            res.writeHead(200, {"Content-Type": "text/plain"})
            return res.end(server_data)
        }
        const file = fs.readFile(req.url.substring(1), (err, cont) => {
            if (err) {
                res.writeHead(404, {"Content-Type": "text/plain"})
                return res.end("Not found")
            } 
            else {
                res.writeHead(200, {"Content-Type": "application/octet-stream", "Content-Length": cont.length, "Location": `http://ubistatic-a.akamaihd.net/0098/5611842${req.url}`, "Server": "Caddy"})
                return res.end(cont)
            }
        })
    }
})
httpserver.listen(80)
server.setHandler("receive", async (peer, packet) => {
    let data = server.stringPacketToMap(packet)
    const isGuest = !data.has("tankIDName")
    const uid = isGuest ? data.get("rid"): data.get("tankIDName").toLowerCase()
    console.log(`${packet.readInt32LE()}: ${data.get("action")}`)
    console.log(data)
    switch (packet.readInt32LE()) {
        case 2: {
            if (data.has("requestedName")) {
                if (!uid) return await peer.disconnect("later")
                if (isGuest) {
                    await peer.fetch("db", {uid})
                    if (!peer.hasPlayerData()) {
                        await peer.create({
                            isGuest: isGuest,
                            uid: uid,
                            country: "LB",
                            skinColor: Pogtopia.Constants.DEFAULT_SKIN,
                            displayName: `${data.get("requestedName")}_67 \`2(ou shii)`,
                            userID: server.availableUserID++,
                            password: "",
                            clothes: {
                                ances: 0,
                                back: 0,
                                face: 1204,
                                hair: 0,
                                hand: 0,
                                mask: 0,
                                necklace: 0,
                                pants: 0,
                                shirt: 0,
                                shoes: 0
                            },
                            connectID: peer.data.connectID,
                            inventory: {
                                maxSize: 18,
                                items: [
                                    {amount: 1, id: 18},
                                    {amount: 1, id: 32}
                                ]
                            }
                        }, true)
                    }
                    else {
                        peer.data.displayName = `${data.get("requestedName")}_67`
                        await peer.saveToCache()
                    }
                }
                else {}
                await peer.setOnline(true, true)
                const cdn = server.getCDN()
                const pSend = Pogtopia.Variant.from(
                    "OnSuperMainStartAcceptLogonHrdxs47254722215a",
                    server.items.hash,
                    "growtopia1.com",
                    "cache/",
                    "cc.cz.madkite.freedom org.aqua.gg idv.aqua.bulldog com.cih.gamecih2 com.cih.gamecih com.cih.game_cih cn.maocai.gamekiller com.gmd.speedtime org.dax.attack com.x0.strai.frep com.x0.strai.free org.cheatengine.cegui org.sbtools.gamehack com.skgames.traffikrider org.sbtoods.gamehaca com.skype.ralder org.cheatengine.cegui.xx.multi1458919170111 com.prohiro.macro me.autotouch.autotouch com.cygery.repetitouch.free com.cygery.repetitouch.pro com.proziro.zacro com.slash.gamebuster",
                    "proto=216|choosemusic=audio/mp3/about_theme.mp3|active_holiday=6|wing_week_day=0|ubi_week_day=0|server_tick=638729041|clash_active=0|drop_lavacheck_faster=1|isPayingUser=0|usingStoreNavigation=1|enableInventoryTab=1|bigBackpack=1|",
                )
                peer.send(pSend)
                    peer.send(Pogtopia.TextPacket.from(3, "action|log", "msg|hi"))
                    peer.send(Pogtopia.Variant.from(
                        "OnRequestWorldSelectMenu",
                        `add_heading|Top Worlds|\nadd_floater|START|0|0.5|3529161471\nadd_floater|START1|0|0.5|3529161471\nadd_floater|BRBFR|0|0.5|3529161471`
                    ))
                    peer.send(Pogtopia.Variant.from(
                        "OnConsoleMessage",
                        `Welcome ${peer.data.displayName}`
                    ))
            }
            await peer.fetch("cache")
            if (data.get("action") == "enter_game") {
                peer.send(Pogtopia.TextPacket.from(3, "action|log", "msg|hi"))
                peer.send(Pogtopia.Variant.from(
                    "OnRequestWorldSelectMenu",
                    `add_heading|Top Worlds|\nadd_floater|START|0|0.5|3529161471\nadd_floater|START1|0|0.5|3529161471\nadd_floater|BRBFR|0|0.5|3529161471`
                ))
                peer.send(Pogtopia.Variant.from(
                    "OnConsoleMessage",
                    `Welcome ${peer.data.displayName}`
                ))

            }
            if (data.get("action") == "quitd"){
                await peer.disconnect("later")
            }
            if (data.get("action") == "refresh_item_data") {
                peer.send(server.items.packet)
            }
            break
        }
        case 3: {
            await peer.fetch("cache")
            //if (!peer.data || !peer.hasPlayerData()) break
            if(data.get("action") == "quit") {
                await peer.disconnect("later")
            }
            if(data.get("action") == "quit_to_exit") {
                peer.leave()
                peer.send(Pogtopia.TextPacket.from(3, "action|log", "msg|hi"))
                peer.send(Pogtopia.Variant.from(
                    "OnRequestWorldSelectMenu",
                    `add_heading|Top Worlds|\nadd_floater|START|0|0.5|3529161471\nadd_floater|START1|0|0.5|3529161471\nadd_floater|BRBFR|0|0.5|3529161471`
                ))
                peer.send(Pogtopia.Variant.from(
                    "OnConsoleMessage",
                    `Welcome ${peer.data.displayName}`
                ))
            }
            if (data.get("action") == "join_request") {
                // await Pogtopia.World.create(server, data.get("name").toUpperCase()).generate()   
                await peer.join(data.get("name"))
                await peer.inventory()
            }
        }
        case 4: {
            if (!packet) {break}
            if (packet.length < 60) {break}
            const tank = Pogtopia.TankPacket.from(packet)
            switch (tank.data.type) {
                case 7: {
                    peer.leave()
                    peer.send(Pogtopia.TextPacket.from(3, "action|log", "msg|hi"))
                    peer.send(Pogtopia.Variant.from(
                        "OnRequestWorldSelectMenu",
                        `add_heading|Top Worlds|\nadd_floater|START|0|0.5|3529161471\nadd_floater|START1|0|0.5|3529161471\nadd_floater|BRBFR|0|0.5|3529161471`
                    ))
                    peer.send(Pogtopia.Variant.from(
                        "OnConsoleMessage",
                        `Welcome ${peer.data.displayName}`
                    ))
                    break
                }
                case 0: {
                    server.forEach("player", (c) => {
                        if (c.data.currentWorld != "EXIT") {
                            if (c.data.currentWorld == peer.data.currentWorld) {
                                let t = [...tank]
                                t.data.targetNetID = c.data.connectID
                                t.data.netID = peer.data.connectID
                                c.send(t)
                            }
                        }
                    })
                }
            }
            break
        }
    }
})
server.setHandler("connect", (peer) => {
    peer.requestLoginInformation()
})
server.start()
