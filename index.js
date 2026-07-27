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

async function getOnlinePlayerCount() {
    let p = 0
    await server.forEach("player", () => {
        p += 1
    })
    return p               
}

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
    console.log(peer.data)
    const isGuest = !data.has("tankIDName")
    const uid = isGuest ? data.get("rid"): data.get("tankIDName").toLowerCase()
    console.log(`${packet.readInt32LE()}: ${data.get("action")}`)
    console.log(data)
    switch (packet.readInt32LE()) {
        case 2: {
            if (data.has("requestedName")) {
                //await peer.fetch("db", {uid})
                if (!uid) return await peer.disconnect("later")
                if (isGuest) {
                    console.log(peer.data)
                    //if (!peer.hasPlayerData() || !peer.data.password) {
                    if (true) {
                        await peer.create({
                            isGuest: isGuest,
                            uid: uid ,
                            country:  data.get("country"),
                            skinColor: Pogtopia.Constants.DEFAULT_SKIN,
                            displayName: `\`8@${data.get("requestedName")}`,
                            userID: server.availableUserID++,
                            password: "",
                            clothes: {
                                ances: 0,
                                back: 0,
                                face: 0,
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
                                    {amount: 1, id: 32},
                                ]
                            }
                        }, true)
                    }
                    else {
                        peer.data.displayName = `\`8@${data.get("requestedName")}`
                        await peer.saveToCache()
                    }
                }
                else {}
                await peer.setOnline(true, true)
                const cdn = server.getCDN()
                let pSend = Pogtopia.Variant.from(
                    "OnSuperMainStartAcceptLogonHrdxs47254722215a",
                    server.items.hash,
                    "osgtcache.cernodile.com",
                    "cache/",
                    "cc.cz.madkite.freedom org.aqua.gg idv.aqua.bulldog com.cih.gamecih2 com.cih.gamecih com.cih.game_cih cn.maocai.gamekiller com.gmd.speedtime org.dax.attack com.x0.strai.frep com.x0.strai.free org.cheatengine.cegui org.sbtools.gamehack com.skgames.traffikrider org.sbtoods.gamehaca com.skype.ralder org.cheatengine.cegui.xx.multi1458919170111 com.prohiro.macro me.autotouch.autotouch com.cygery.repetitouch.free com.cygery.repetitouch.pro com.proziro.zacro com.slash.gamebuster",
                    "proto=216|choosemusic=audio/mp3/about_theme.mp3|active_holiday=6|wing_week_day=0|ubi_week_day=0|server_tick=638729041|clash_active=0|drop_lavacheck_faster=1|isPayingUser=0|usingStoreNavigation=1|enableInventoryTab=1|bigBackpack=1|",
                )
                peer.send(pSend)
            }
            await peer.fetch("cache")
            if (data.get("action") == "enter_game") {
                peer.send(Pogtopia.TextPacket.from(3, "action|log", "msg|Welcome to GTJS!"))
                peer.send(Pogtopia.Variant.from(
                    "OnRequestWorldSelectMenu",
                    `add_heading|Top Worlds|\nadd_floater|START|0|0.5|3529161471\nadd_floater|START1|0|0.5|3529161471\nadd_floater|BRBFR|0|0.5|3529161471`
                ))
                peer.send(Pogtopia.Variant.from(
                    "OnConsoleMessage",
                    `Welcome ${peer.data.displayName} \`w(${await getOnlinePlayerCount()} online)`
                ))
            }
            if (data.get("action") == "setSkin") {
                peer.data.skinColor = Number(data.get("color"))
                setTimeout(()=> {
                    server.forEach("player", async (p) => {
                        if (p.data.currentWorld == peer.data.currentWorld) {
                            await p.send(peer.cloth_packet())
                        }
                    })
                }, 250)
            }
            if (data.get("action") == "input") {
                server.forEach("player", async (c) => {
                    if (c.data.currentWorld != "EXIT") {
                        if (c.data.currentWorld == peer.data.currentWorld) {
                            c.send(Pogtopia.Variant.from("OnTalkBubble", peer.data.connectID, data.get("text"), 0))
                            c.send(Pogtopia.Variant.from("OnConsoleMessage", `CP:0_PL:0_OID:_CT:[W]_ \`9<\`w${peer.data.displayName}\`9> \`0${data.get("text")}`))
                        }
                    }
                })
            }
            if (data.get("action") == "quitd"){
                peer.leave()
                await peer.disconnect("later")
            }
            if (data.get("action") == "refresh_item_data") {
                peer.send(server.items.packet)
            }
            break
        }
        case 3: {
            await peer.fetch("cache")
            if (!peer.hasPlayerData()) break
            if(data.get("action") == "quit") {
                peer.leave()
                await peer.disconnect("later")
            }
            if(data.get("action") == "quit_to_exit") {
                peer.leave()
                peer.send(Pogtopia.Variant.from(
                    "OnRequestWorldSelectMenu",
                    `add_heading|Top Worlds|\nadd_floater|START|0|0.5|3529161471\nadd_floater|START1|0|0.5|3529161471\nadd_floater|BRBFR|0|0.5|3529161471`
                ))
                peer.send(Pogtopia.Variant.from(
                    "OnConsoleMessage",
                    `Welcome ${peer.data.displayName} \`w(${await getOnlinePlayerCount()} online)`
                ))
            }
            if (data.get("action") == "join_request") {
                // await Pogtopia.World.create(server, data.get("name").toUpperCase()).generate()   
                await peer.join(data.get("name"))
                // await peer.send(peer.cloth_packet())
                await peer.inventory()
                setTimeout(()=> {
                    server.forEach("player", async (p) => {
                        if (p.data.currentWorld == peer.data.currentWorld) {
                            await p.send(peer.cloth_packet())
                        }
                    })
                }, 60)
            }
        }
        case 4: {
            if (!packet) {break}
            if (packet.length < 60) {break}
            await peer.fetch("cache")
            const tank = Pogtopia.TankPacket.from(packet)
            console.log(tank)
            switch (tank.data.type) {
                case 7: {
                    await peer.leave()
                    peer.send(Pogtopia.Variant.from(
                        "OnRequestWorldSelectMenu",
                        `add_heading|Top Worlds|\nadd_floater|START|0|0.5|3529161471\nadd_floater|START1|0|0.5|3529161471\nadd_floater|BRBFR|0|0.5|3529161471`
                    ))
                    peer.send(Pogtopia.Variant.from(
                        "OnConsoleMessage",
                        `Welcome ${peer.data.displayName} \`w(${await getOnlinePlayerCount()} online)`
                    ))
                    peer.saveToCache()
                    break
                }
                case 0: {
                    tank.data.netID = peer.data.connectID
                    peer.data.x = tank.data.playerPosX
                    peer.data.y = tank.data.playerPosY
                    await peer.saveToCache()
                    server.forEach("player", async (c) => {
                        if (c.data.currentWorld != "EXIT" && c.data.connectID != peer.data.connectID) {
                            if (c.data.currentWorld == peer.data.currentWorld) {
                                c.send(tank)
                            }
                        }
                    })
                    break
                }
                case 17: {
                    server.forEach("player", async (c) => {
                        if (c.data.currentWorld != "EXIT" && c.data.connectID != peer.data.connectID) {
                            if (c.data.currentWorld == peer.data.currentWorld) {
                                c.send(Pogtopia.Variant.from("OnTalkBubble", peer.data.connectID, "<p>..."))
                            }
                        }
                    })
                }
                break
            }
            break
        }
    }
})
server.setHandler("connect", (peer) => {
    peer.requestLoginInformation()
})
server.setHandler("disconnect", (peer) => {
    peer.leave()
    peer.disconnect("later")
})
server.start()
