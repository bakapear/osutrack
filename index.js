let dp = require('despair')
let Corrin = require('corrin')
let hook = process.env.HOOK

let track = ['4949888', '7230263', '14552691', '13833303'] // osu! user_id's to track

let feed = new Corrin(track.map(x => [async () => recent(x), x => x.id]))
console.log(`Tracking: (${track.join(', ')})`)

feed.on('new', items => {
  for (let prop in items) {
    let embeds = []
    let user = null
    for (let i = 0; i < items[prop].length; i++) {
      let item = items[prop][i]
      if (!user) user = { name: item.user.username, avatar: item.user.avatar_url }
      embeds.push(embed(item))
      log(item)
    }
    send({
      username: user.name,
      avatar_url: user.avatar,
      embeds: embeds
    })
  }
})

function embed (item) {
  let mods = item.mods.length ? `+${item.mods.join('')}` : ''
  let rank = RANK[item.rank]
  let stats = item.statistics
  let map = item.beatmap
  return {
    title: `${item.beatmapset.title} [${map.version} ★ ${map.difficulty_rating}] ${mods}`,
    url: map.url,
    description: [
      [
        rank.emote,
        `**${parseInt(item.pp) || 0} PP**`,
        `${(item.accuracy * 100).toFixed(2)}%`,
        item.score
      ],
      [
        `**${item.max_combo}x**`,
        `{ ${stats.count_300} / ${stats.count_100} / ${stats.count_50} }`,
        item.perfect ? 'PERFECT' : `${stats.count_miss} ${stats.count_miss === 1 ? 'Miss' : 'Misses'}`
      ], [],
      [
        `**${map.status[0].toUpperCase() + map.status.substr(1)}** ${new Date(map.last_updated).getFullYear()}`,
        `${map.bpm} BPM`,
        `${time(map.hit_length * 1000)}`
      ],
      [
        `${map.cs} CS`,
        `${map.ar} AR`,
        `${map.accuracy} OD`,
        `${map.drain} HP`
      ]
    ].map(x => x.join(' ▸ ')).join('\n'),
    color: rank.color,
    timestamp: item.created_at,
    thumbnail: { url: item.beatmapset.covers['list@2x'] }
  }
}

function log (item) {
  console.log([
      `${item.user.username} (${item.rank}) >`,
      `${item.beatmapset.title} [${item.beatmap.difficulty_rating} ★ ${item.beatmap.version}]`
  ].join(' '))
}

function send (obj) {
  dp.post(hook, {
    data: obj,
    type: 'json'
  })
}

async function recent (id, retries = 5) {
  if (retries <= 0) throw new Error('Could not fetch site')
  try {
    let { body } = await dp('https://osu.ppy.sh/users/' + id)
    let pointer = body.indexOf('json-extras') + 37
    let json = JSON.parse(body.substring(pointer, body.indexOf('</script>', pointer)))
    return json.scoresRecent
  } catch (e) { return recent(id, --retries) }
}

function time (ms) {
  let t = new Date(ms).toISOString().substr(11, 8).split(':')
  let h = Math.floor(ms / 1000 / 60 / 60).toString()
  if (h > 23) t[0] = h
  while (t.length > 2 && t[0] === '00' && t[1].startsWith('0')) {
    t.shift()
  }
  if (t.length > 2 && t[0] === '00') t.shift()
  if (t[0].startsWith('0')) t[0] = t[0].substr(1)
  return t.join(':')
}

let RANK = {
  D: { emote: '<:D:365509580651757568>', color: 9967895 },
  C: { emote: '<:C:365509580517801995>', color: 14377691 },
  B: { emote: '<:B:365509580664602625>', color: 3492295 },
  A: { emote: '<:A:365509580593299466>', color: 6795600 },
  S: { emote: '<:S:365509580731449354>', color: 14598211 },
  SH: { emote: '<:SH:365509580681248768>', color: 12308694 },
  X: { emote: '<:X:365509580622659585>', color: 14598211 },
  XH: { emote: '<XH:365509580718997504>', color: 12308694 }
}
