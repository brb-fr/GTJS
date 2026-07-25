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
        cdn: {
            host: "192.168.0.100",
            url: "cache/"
        },
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
        if (req.url.startsWith("/")) {
            fs.readFile("." + req.url, (err, cont) => {
                if (err) {
                    res.writeHead(404, {"Content-Type": "text/plain"})
                    return res.end("Not found")
                } 
                else {
                    res.writeHead(200, {"Content-Type": "application/octet-stream", "Connection": "close"})
                    return res.end(cont.buffer)
                }
            })
        }
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
                    //await peer.fetch("db", {uid})
                    if (!peer.hasPlayerData()) {
                        await peer.create({
                            isGuest: isGuest,
                            uid: uid,
                            country: "LB",
                            skinColor: Pogtopia.Constants.DEFAULT_SKIN,
                            displayName: `${data.get("requestedName")}_67`,
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
                                    {amount: 1, id: 0},
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
                const cdn = server.getCDN()
                const pSend = Pogtopia.Variant.from(
                    "OnSuperMainStartAcceptLogonHrdxs47254722215a",
                    server.items.hash,
                    cdn.host + "/" + cdn.url,
                    Pogtopia.Constants.OnSuperMainArgs.arg3,
                    Pogtopia.Constants.OnSuperMainArgs.arg4,
                    0
                )
                peer.send(pSend)
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
            if(data.get("action") == "join_request") {
                console.log(peer.data.inventory)
                let world = await Pogtopia.World.create(server, data.get("name").toUpperCase())
                await peer.send(await world.serialize())
                await peer.send(Pogtopia.TextPacket.from(3, "action|log", "msg|Opening world..."))
                await peer.send(Pogtopia.Variant.from("OnSetCurrentWeather", 4));
                await peer.send(Pogtopia.Variant.from(
                    "OnSpawn",
                    `spawn|avatar\nnetID|${peer.data.userID}\nuserID|${peer.data.userID}\ncolrect|0|0|20|30\nposXY|1600|500\nname|\`w${peer.data.displayName}\`\`\ncountry|${peer.data.country}\ninvis|0\nmstate|0\nsmstate|0\nonlineID|\ntype|local`
                ))
                peer.inventory()
                peer.send(await peer.cloth_packet())
            }
            break
        }
        case 4: {
            if (packet.length < 50) {break}
            //console.log(Pogtopia.TankPacket.from(packet))
            break
        }
    }
})
server.setHandler("connect", (peer) => {
    peer.requestLoginInformation()
})
server.start()
