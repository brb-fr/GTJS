import { DialogBuilder } from "./DialogBuilder.ts"
import { TankPacket } from "growtopia.js"
import Pogtopia from "pogtopia"
import * as fs from "fs"
import * as http from "node:http"
const server_data = `
server|192.168.0.100
loginurl|youtube.com
port|17091
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
        port: 17091,
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
                            displayName: "`8@" + data.get("requestedName"),
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
                                    {amount: 200, id: 2},
                                    {amount: 200, id: 8}
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
            if (data.get("action") == "growid") {

            }
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
                let dialog = new DialogBuilder()
                dialog.addLabelWithIcon("GTJS", 18, "big")
                dialog.addSpacer("small")
                dialog.addTextBox("Welcome to GTJS, thank you for using this open-source service!")
                dialog.addTextBox("Github: `2https://github.com/brb-fr/GTJS")
                dialog.addSpacer("small")
                dialog.addSpacer("small")
                dialog.endDialog("popup", "", "Okay")
                peer.send(Pogtopia.Variant.from("OnDialogRequest", dialog.str()))
            }
            if (data.get("action") == "setSkin") {
                peer.data.skinColor = Number(data.get("color"))
                await peer.saveToCache()
                setTimeout(async () => {
                    let pckt = peer.cloth_packet()
                    server.forEach("player", async (p) => {
                        if (p.data.currentWorld == peer.data.currentWorld) {
                            await p.send(pckt)
                        }
                    })
                }, 30)
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
                if (peer.data.displayName.startsWith("@")) {
                    console.log(peer.data.displayName)
                    peer.data.displayName = "`8" + peer.data.displayName
                }
                // await Pogtopia.World.create(server, data.get("name").toUpperCase()).generate()   
                await peer.join(data.get("name"))
                // await peer.send(peer.cloth_packet())
                await peer.inventory()
                setTimeout(async () => {
                    let pckt = peer.cloth_packet()
                    server.forEach("player", async (p) => {
                        if (p.data.currentWorld == peer.data.currentWorld) {
                            await p.send(pckt)
                        }
                    })
                }, 160)
            }
        }
        case 4: {
            if (!packet) {break}
            if (packet.length < 60) {break}
            await peer.fetch("cache")
            const tank = Pogtopia.TankPacket.from(packet)
            console.log(tank)
            switch (tank.data.type) {
                case 3: {
                    let world = Pogtopia.World.create(server, peer.data.currentWorld)
                    await world.fetch(false)
                    if (tank.data.itemInfo == 32) {break}
                    if (tank.data.itemInfo == 18) {
                        world.data.tiles.forEach(async (tile) => {
                            if (!(tile.fg == 0 && tile.bg == 0)) {
                                if (tile.x == tank.data.playerPunchX && tile.y == tank.data.playerPunchY) {
                                    tile.hitsTaken += 4
                                    let t = TankPacket.from({
                                        xPunch: tank.data.playerPunchX,
                                        yPunch: tank.data.playerPunchY,
                                        info: tile.hitsTaken,
                                        type: 8,
                                        netID: peer.data.connectID
                                    })
                                    if (tile.hitsTaken >= 12) {
                                        t.data.type = 3
                                        t.data.info = 18
                                        tile.hitsTaken = 0
                                        tile.resetAfter = 0
                                        if (tile.fg == 0) {
                                            tile.bg = 0
                                        }
                                        else {
                                            tile.fg = 0
                                        }
                                    }
                                    await world.saveToCache()
                                    server.forEach("player", (c) => {
                                        if (c.data.currentWorld != "EXIT") {
                                            if (c.data.currentWorld == peer.data.currentWorld) {
                                                peer.send(t.parse())
                                            }
                                        }
                                    })
                                }
                            }
                        })
                    }
                    if (tank.data.itemInfo != 18) {
                        let t = TankPacket.from({
                            xPunch: tank.data.playerPunchX,
                            yPunch: tank.data.playerPunchY,
                            info: tank.data.itemInfo,
                            type: 3,
                            state: tank.data.state,
                        })
                        world.data.tiles.forEach((tile) => {
                            if (tile.x == tank.data.playerPunchX && tile.y == tank.data.playerPunchY) {
                                if (tile.fg == 0) {
                                    tile.fg = tank.data.itemInfo
                                    tile.hitsTaken = 0
                                }
                            }
                        })
                        peer.data.inventory.items.forEach((item) => {
                            if (item.id == tank.data.itemInfo) {
                                item.amount -= 1
                            }
                        })
                        await peer.saveToCache()
                        await world.saveToCache()
                        server.forEach("player", (c) => {
                            if (c.data.currentWorld != "EXIT") {
                                if (c.data.currentWorld == peer.data.currentWorld) {
                                    peer.send(t.parse())
                                }
                            }
                        })

                    }
                    break
                }
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
server.setHandler("disconnect", async (peer) => {
    peer.data.currentWorld = "EXIT"
    peer.data.x = -1
    peer.data.y = -1
    server.forEach(
        'player',
        async (eachPeer) => {
        if (eachPeer.data.currentWorld === peer.data.currentWorld &&
            eachPeer.data.connectID !== peer.data.connectID)
            await eachPeer.send(
            Pogtopia.Variant.from(
                'OnRemove',
                `netID|${peer.data.connectID}`
            )
          )
      }
    )
    peer.disconnect("now")
})
server.start()
