import { DialogBuilder } from "./DialogBuilder.js"
import { TankPacket } from "growtopia.js"
import Pogtopia from "pogtopia"
import * as fs from "fs"
import * as http from "node:http"
import { readFileSync } from "node:fs"

const IP = "100.80.80.65"
const server_data = `
server|${IP}
loginurl|youtube.com
port|17091
#maint|
meta|ignoremeta
RTENDMARKERBS1001
`
let file = readFileSync("./items.dat")
let items = [{
    "audioVolume": 400,
    "breakHits": 24,
    "canPlayerSit": false,
    "clothingType": 0,
    "collisionType": 0,
    "description": "No info.",
    "extraFieldUnk_4": "",
    "extraFile": "",
    "extraFileHash": 0,
    "extraOptions": "",
    "extraOptions2": "",
    "growTime": 0,
    "hitSoundType": 0,
    "isRayman": 0,
    "isStripeyWallpaper": 0,
    "itemCategory": 17,
    "itemID": 0,
    "itemKind": 0,
    "itemProps1": 20,
    "itemProps2": -123,
    "maxAmount": 200,
    "mods": 0,
    "name": "Blank",
    "newInt1": 0,
    "newInt2": 0,
    "newValue": 0,
    "newValue1": 9,
    "newValue2": 9,
    "newValue3": 9,
    "newValue4": 9,
    "newValue5": 9,
    "newValue6": 9,
    "newValue7": 9,
    "newValue8": 9,
    "newValue9": 9,
    "petAbility": "",
    "petName": "",
    "petPrefix": "",
    "petSuffix": "",
    "punchOptions": "",
    "rarity": 1,
    "restoreTime": 8,
    "seedBase": 0,
    "seedColor": -1,
    "seedOverlay": 0,
    "seedOverlayColor": -1,
    "sitOverlayOffsetX": 0,
    "sitOverlayOffsetY": 0,
    "sitOverlayTexture": "",
    "sitOverlayX": 0,
    "sitOverlayY": 0,
    "sitPlayerOffsetX": 0,
    "sitPlayerOffsetY": 0,
    "spreadType": 1,
    "texture": "tiles_page1.rttex",
    "texture2": "",
    "textureHash": 91467596,
    "textureX": 16,
    "textureY": 1,
    "treeBase": 0,
    "treeLeaves": 0,
    "unkValueShort1": 0,
    "unkValueShort2": 0,
    "val1": -1,
    "val2": 0,
    "value": 0,"value2": 0
}]
items = JSON.parse(fs.readFileSync("items.json", "utf-8")).items

async function getOnlinePlayerCount() {
    let p = 0
    await server.forEach("player", () => {
        p += 1
    })
    return p               
}

async function getRandomWorlds() {
    let worlds = new Map()
    server.forEach("player", async (p) => {
        if (p.data.currentWorld != "EXIT" && p.data.currentWorld != "") {
            let players = worlds.has(p.data.currentWorld) ? worlds.get(p.data.currentWorld) + 1 : 1
            worlds.set(p.data.currentWorld, players)
            console.log(worlds)
        }
    })
    let sorted = Array.from(worlds.entries()).sort((a, b) => b[1] - a[1])
    sorted.slice(0, 8)
    let str = ""
    sorted.forEach(([world, players]) => {
        str += `add_floater|${world} (${players})|0|0.5|3529161471\n`
    })
    return str
}

// Gem functions are taken from StileDevs/GrowServer; thanks <3
function splitGemsDrop(totalGems) {
    // List of gems limit. 1 for normal gems and 10 for red gems.
    const GEMS_LIMITS = [100, 50, 10, 5, 1];
    let ret = [];
    let currentGems = totalGems;

    for (const limit of GEMS_LIMITS) {
      // Create an array with the length of Math.floor(currentGems / limit)
      //  and fill it with limit the push it to ret
      ret = ret.concat(Array(Math.floor(currentGems / limit)).fill(limit));
      currentGems = currentGems % limit;
    }

    return ret;
  }
function randomizeGemsDrop(rarity) {
    const max = Math.random();
    let bonus = 0;
    const threshold = Math.min(0.1 + rarity / 100, 0.5); // Linear increase, caps on 0.5
    // How it works: For rarity 5, threshold = 0.15, For rarity 30, threshold = 0.2
    if (max <= threshold) {
      bonus = 1;
    }
    if (rarity >= 30 && max <= 0.5) {
      bonus = 5;
    } else if (rarity >= 60 && max <= 0.6) {
      bonus = 12;
    } else if (rarity >= 60 && max <= 0.3) {
      bonus = 5;
    }

    // Gem Calculation based on Rarity
    let gems = 0
    if (rarity < 30) {
      gems = rarity / 12;
    } else {
      gems = rarity / 8;
    }

    return Math.floor(gems + bonus);
  }


function isPlacementBlocked(playerX, playerY, placeX, placeY) {
    const minTileX = Math.floor(playerX / 32)
    const maxTileX = Math.floor((playerX + 19) / 32)
    const minTileY = Math.floor(playerY / 32)
    const maxTileY = Math.floor((playerY + 29) / 32)
    return (placeX >= minTileX && placeX <= maxTileX) && (placeY >= minTileY && placeY <= maxTileY)
}

const server = new Pogtopia.Server({
    db: {
        pass: "brbfr",
        user: "brbfr"
    },
    server: {
        port: 17091,
        itemsDatFile: "items.dat",
    },
    worldGenerator: async (world, width = 100, height = 60) => {
        const tileCount = width * height
        const tiles = []
        const mainDoorPosition = Math.floor(Math.random() * ((width-5) - 5 + 1)) + 5
        const BEDROCK_START_LEVEL = height - 5
        const LAVA_START_LEVEL = height - 9
        const DIRT_START_LEVEL = Number(height / 3)
        let x = 0;
        let y = 0;
        for (let i = 0; i < tileCount; i++) {
            if (x >= width) {
                x = 0
                y++
            }
            const tile = {
                fg: 0,
                bg: 0,
                x,
                y,
                hitsTaken: 0
            }
            if (Math.random() < 0.375 && y >= LAVA_START_LEVEL && y < BEDROCK_START_LEVEL) {
                tile.fg = 4
                tile.bg = 14;
            }
            if (y >= DIRT_START_LEVEL && y < BEDROCK_START_LEVEL) {
                tile.fg = 2;
                tile.bg = 14;
                if (Math.random() < 0.016 && y >= DIRT_START_LEVEL + 2) {
                    tile.fg = 10
                }
            } 
            if (y === DIRT_START_LEVEL - 1 && x === mainDoorPosition) {
                tile.fg = 6;
                tile.label = "EXIT";
                tile.doorDestination = "EXIT";
                tile.isDoor = true;
            }
            if (y >= BEDROCK_START_LEVEL || (y === DIRT_START_LEVEL && x === mainDoorPosition)) {
                tile.fg = 8;
                tile.bg = 14;
            }
            tiles.push(tile)
            x++
        }
        return {
            name: world.data.name,
            tiles,
            tileCount,
            width,
            height,
            playerCount: 0
        }
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
    switch (packet.readInt32LE()) {
        case 2: {
            if (data.has("requestedName")) {
                //await peer.fetch("db", {uid})
                if (!uid) return await peer.disconnect("later")
                if (isGuest) {
                    if (!peer.hasPlayerData()) {
                        await peer.create({
                            isGuest: isGuest,
                            uid: uid ,
                            country:  data.get("country"),
                            skinColor: Pogtopia.Constants.DEFAULT_SKIN,
                            displayName: data.get("requestedName"),
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
                                    {amount: 200, id: 8},
                                ]
                            }
                        }, true)
                    }
                    else {
                        peer.data.displayName = `\`8@${data.get("requestedName")}`
                        await peer.saveToCache() 
                    }
                }
                else {
                    let foundPeer = null
                    server.collections.players.find({uid: uid}).forEach((p) => {
                        if (p.password == data.get("tankIDPassword")) {
                            foundPeer = p
                        }
                    })
                    if (!foundPeer) {
                        await peer.send(Pogtopia.Variant.from(
                            "OnConsoleMessage",
                            "`4Error! `oThis account is not found or the password is incorrect. If you don't have a GrowID continue without it, and go to the options menu in-game to get one!"
                        ))
                        break
                    }
                    else {}
                }
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
                break
            }
            await peer.fetch("cache")
            if (data.get("action") == "growid") {

            }
            if (data.get("action") == "respawn" || data.get("action") == "respawn_spike") {
                let world = Pogtopia.World.create(server, peer.data.currentWorld)
                await world.fetch(false)
                let mainDoor = {x: 0, y: 0}
                world.data.tiles.forEach((tile) => {
                    if (tile.fg == 6) {
                        mainDoor.x = tile.x
                        mainDoor.y = tile.y
                    }
                })
                peer.send_multiple(Pogtopia.Variant.from({ netID: peer.data.connectID }, "OnSetFreezeState", 1), Pogtopia.Variant.from({ netID: peer.data.connectID }, "OnKilled"), Pogtopia.Variant.from({ netID: peer.data.connectID, delay: 2000 }, "OnSetPos", [
                    (mainDoor?.x || 0 % world.data.width) * 32,
                    (mainDoor?.y || 0 % world.data.width) * 32,
                    ]), Pogtopia.Variant.from({ netID: peer.data.connectID, delay: 2000 }, "OnSetFreezeState", 0));
                peer.audio("audio/teleport.wav", 2000);
            }
            if (data.get("action") == "enter_game") {
                peer.send(Pogtopia.TextPacket.from(3, "action|log", "msg|Welcome to GTJS!"))
                peer.send(Pogtopia.Variant.from(
                    "OnRequestWorldSelectMenu",
                    `add_heading|Top Worlds|\n${await getRandomWorlds()}`
                ))
                peer.send(Pogtopia.Variant.from(
                    "OnConsoleMessage",
                    `Where would you like to go? \`w(${await getOnlinePlayerCount()} online)`
                ))
                let dialog = new DialogBuilder()
                dialog.addLabelWithIcon("`wGTJS", 18, "big")
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
                            c.send(Pogtopia.Variant.from("OnConsoleMessage", `CP:0_PL:0_OID:_CT:[W]_ \`o<\`w${peer.data.displayName}\`o> ${data.get("text")}`))
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
            if (data.get("action") == "validate_world") {
                let w = Pogtopia.World.create(server, data.get("name")) 
                await w.fetch(false)
                await peer.send(Pogtopia.TextPacket.from("action|world_validated\navailable|" + w.hasData() ? 1 : 0))
            }
            if(data.get("action") == "quit_to_exit") {
                peer.leave()
                peer.send(Pogtopia.Variant.from(
                    "OnRequestWorldSelectMenu",
                    `add_heading|Top Worlds|\n${await getRandomWorlds()}`
                ))
                peer.send(Pogtopia.Variant.from(
                    "OnConsoleMessage", 
                    `Where would you like to go? \`w(${await getOnlinePlayerCount()} online)`
                ))
            }
            if (data.get("action") == "join_request") {
                if (peer.data.displayName.startsWith("@")) {
                    //peer.data.displayName = "`8" + peer.data.displayName // Dev player color => Soon
                }
                let name = [...data.get("name").split(" ")][0]
                await peer.join(name)
                await peer.inventory()
                let world = Pogtopia.World.create(server, data.get("name").toUpperCase())
                await world.fetch(false)
                let items = world.data.droppedItems || []
                items.forEach(async (item) => {
                    let tp = TankPacket.from({
                        type: 14,
                        netID: -1,
                        targetNetID: -1,
                        info: item.id,
                        xPos: item.x,
                        yPos: item.y
                    })
                    let buffer = tp.parse()
                    buffer.writeFloatLE(item.amount, 20)
                    await peer.send(buffer)
                })
            }
        }
        break
        case 4: {
            if (!packet) {break}
            if (packet.length < 60) {break}
            await peer.fetch("cache")
            const tank = Pogtopia.TankPacket.from(packet)
            //console.log(tank)
            switch (tank.data.type) {
                case 3: {
                    let world = Pogtopia.World.create(server, peer.data.currentWorld)
                    await world.fetch(false)
                    if (tank.data.itemInfo == 32) {break}
                    if (tank.data.itemInfo == 18) {
                        world.data.tiles.forEach(async (tile, index) => {
                            if (!(tile.fg == 0 && tile.bg == 0)) {
                                if (tile.x == tank.data.playerPunchX && tile.y == tank.data.playerPunchY) {
                                    if (!(tile.fg == 6 || tile.fg == 8) || peer.data.displayName=="brbfr") {
                                        let item = {}
                                        if (tile.fg == 0) {
                                            item = items[tile.bg]
                                        }
                                        else {
                                            item = items[tile.fg]  
                                        }
                                        tile.hitsTaken += 60
                                        let destroyedItemID = 0
                                        let t = TankPacket.from({
                                            xPunch: tank.data.playerPunchX,
                                            yPunch: tank.data.playerPunchY,
                                            info: tile.hitsTaken,
                                            type: 8,
                                            netID: peer.data.connectID,
                                        })
                                        clearTimeout(tile.resetAfterTimeout)
                                        let time = setTimeout(async (idx) => {
                                            await world.fetch(false)
                                            world.data.tiles[idx].hitsTaken = 0
                                            await world.saveToCache()
                                        }, item.restoreTime * 1000, index)
                                        tile.resetAfterTimeout = time[Symbol.toPrimitive]()
                                        await world.saveToCache()
                                        if (tile.hitsTaken >= (item.breakHits)) {
                                            t.data.type = 3
                                            t.data.info = 18
                                            tile.hitsTaken = 0
                                            clearTimeout(tile.resetAfterTimeout)
                                            if (tile.fg == 0) {
                                                destroyedItemID = tile.bg
                                                tile.bg = 0
                                            }
                                            else {
                                                destroyedItemID = tile.fg
                                                tile.fg = 0  
                                            }
                                        }
                                        await world.saveToCache()
                                        server.forEach("player", (c) => {
                                            if (c.data.currentWorld != "EXIT") {
                                                if (c.data.currentWorld == peer.data.currentWorld) {
                                                    c.send(t.parse())
                                                }
                                            }
                                        })
                                        const rand = Math.random()
                                        let dItems = world.data.droppedItems  || []
                                        const xPos = Math.floor((tank.data.playerPunchX * 32) + (Math.random() * 16))
                                        const yPos = Math.floor((tank.data.playerPunchY * 32) + (Math.random() * 16))
                                        let tpbs = TankPacket.from({
                                            type: 14,
                                            netID: -1,
                                            targetNetID: -1,
                                            info: 0,
                                            xPos,
                                            yPos
                                        })
                                        if (rand <= 0.11) {
                                            dItems.push({
                                                id: destroyedItemID,
                                                x: xPos,
                                                y: yPos,
                                                amount: 1,
                                                uid: world.data.droppedItems.length + 1
                                            })
                                            tpbs.data.info = destroyedItemID
                                        }
                                        else if (rand <= 0.33){
                                            dItems.push({
                                                id: destroyedItemID + 1,
                                                x: xPos,
                                                y: yPos,
                                                amount: 1,
                                                uid: world.data.droppedItems.length + 1
                                            })
                                            tpbs.data.info = destroyedItemID + 1
                                        }
                                        if (tpbs.data.info != 0){
                                            let buffer = tpbs.parse()
                                            buffer.writeFloatLE(1, 20)
                                            world.data.droppedItems = dItems
                                            await world.saveToCache()
					    server.forEach("player", async (c) => {
						if (c.data.currentWorld == peer.data.currentWorld) {
	                                            c.send(buffer)
						}
					    })
                                        }
                                    }
                                    else if (tile.fg == 6){
                                        peer.send(Pogtopia.Variant.from("OnTalkBubble", peer.data.connectID, "(stand over and punch to use)", 0, 1))
                                        peer.audio("audio/cant_place_tile.wav")
                                    }
                                    else if (tile.fg == 8){
                                        peer.send(Pogtopia.Variant.from("OnTalkBubble", peer.data.connectID, "It's too strong to break.", 0, 1))
                                        peer.audio("audio/cant_place_tile.wav")
                                    }
                                }
                            }
                        })
                    }
                    if (tank.data.itemInfo != 18) {
                        let notAllowed = false
                        await server.forEach("player", async (p) => {
                            if (peer.data.currentWorld == p.data.currentWorld && isPlacementBlocked(p.data.x, p.data.y, tank.data.playerPunchX, tank.data.playerPunchY)) {
                                notAllowed = true
                            }
                        })
                        if (notAllowed) {break}
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
                        peer.data.inventory.items.forEach(async (item) => {
                            if (item.id == tank.data.itemInfo) {
                                item.amount -= 1
                            }
                        })
                        await peer.saveToCache()
                        await world.saveToCache()
                        server.forEach("player", (c) => {
                            if (c.data.currentWorld != "EXIT") {
                                if (c.data.currentWorld == peer.data.currentWorld) {
                                    c.send(t.parse())
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
                        `add_heading|Top Worlds|\n${await getRandomWorlds()}`
                    ))
                    peer.send(Pogtopia.Variant.from(
                        "OnConsoleMessage",
                        `Where would you like to go? \`w(${await getOnlinePlayerCount()} online)`
                    ))
                    peer.saveToCache()
                    break
                }
                case 0: {
                    if (tank.data.state == 4) {
                        let pckt = peer.cloth_packet()
                        server.forEach("player", async (p) => {
                            if (p.data.currentWorld == peer.data.currentWorld) {
                                await peer.send(p.cloth_packet())
                                await p.send(pckt)
                            }
                        })
                    }
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
                case 18: {
                    server.forEach("player", async (c) => {
                        if (c.data.currentWorld != "EXIT" && c.data.connectID != peer.data.connectID) {
                            if (c.data.currentWorld == peer.data.currentWorld) {
                                c.send(tank)
                            }
                        }
                    })
                    break
                }
                case 26: {
                    await peer.leave(true)
                    peer.disconnect("now") 
                    break
                }
                case 11: {
                    let tank2 = TankPacket.fromBuffer(packet)
                    console.log("NEW ITEM ", tank2)
                    let world = Pogtopia.World.create(server, peer.data.currentWorld)
                    await world.fetch(false)
                    let item = world.data.droppedItems[0]
                    world.data.droppedItems.forEach(async (itemD, index) => {
                        if (itemD.uid == tank.data.itemInfo) {
                            item = itemD
                            itemD = {id: 0, amount: 0, uid: itemD.uid, x: -1, y: -1}
                            await world.saveToCache()
                        }
                    })
                    peer.add_item_to_inventory(item.id, item.amount)
                    const collectPkt = new TankPacket({
                        type: 14,
                        netID: peer.data.connectID,
                        targetNetID: -1,
                        info: tank.data.itemInfo,
                    })
                    await peer.saveToCache()
                    server.forEach("player", async (c) => {
                        if (c.data.currentWorld != "EXIT") {
                            if (c.data.currentWorld == peer.data.currentWorld) {
                                await c.send(collectPkt.parse())
                            }
                        }
                    })
                    break
                }
                
            }
            break
        }
    }
})

server.setHandler("connect", (peer) => {
    peer.requestLoginInformation()
})

server.setHandler("disconnect", async (peer) => {
    await peer.leave(true)
    peer.disconnect("now")
})
server.start()

