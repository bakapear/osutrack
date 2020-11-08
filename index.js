let dp = require('despair')
let oj = require('ojsama')
let Corrin = require('corrin')
let API = require('./API')

let interval = 5000 // increase this if you have many users to track

let id = process.env.CLIENT_ID
let secret = process.env.CLIENT_SECRET
let hook = process.env.HOOK
let track = process.env.TRACK

if (!id || !secret || !hook || !track) throw new Error('One or more required environment variables are not set!')

track = track.split(',')
let api = new API(process.env.CLIENT_ID, process.env.CLIENT_SECRET)

let feed = new Corrin(track.map(x => [async () => api.scores('recent', x), x => x.id]), interval)
console.log(`Tracking: (${track.join(', ')})`)

feed.on('new', async items => {
  for (let prop in items) {
    let embeds = []
    let user = null
    for (let i = 0; i < items[prop].length; i++) {
      let item = items[prop][i]
      if (!user) user = { name: item.user.username, avatar: item.user.avatar_url }
      embeds.push(await embed(item))
      log(item)
    }
    send({
      username: user.name,
      avatar_url: user.avatar,
      embeds: embeds
    })
  }
})

async function embed (item) {
  let rank = RANK[item.rank]
  let stats = item.statistics
  let map = item.beatmap
  let accuracy = (item.accuracy * 100).toFixed(2)
  let data = await calc(map.id, parseFloat(accuracy), item.max_combo, stats.count_miss, item.mods.join(''))
  let cover = item.beatmapset.covers.slimcover
  if (!await dp.head(cover).catch(e => false)) cover = 'https://i.imgur.com/DNZTUG0.png'
  return {
    color: rank.color,
    title: `${item.beatmapset.title} [${map.version} ★ ${map.difficulty_rating}]` +
      (item.mods.length ? ` +${item.mods.join('')}` : ''),
    url: map.url,
    description: [
      [
        `[${item.pp ? `**${data.pp.gain}**` : `~~**${data.pp.gain}**~~`}/${data.pp.total}pp](https://osu.ppy.sh/u/${item.user_id})`,
        `${item.max_combo}/${data.max_combo}x`,
        accuracy + '%'
      ],
      [
        '[ ' + [
          '**300** x' + stats.count_300,
          '**100** x' + stats.count_100,
          '**50** x' + stats.count_50
        ].join(' • ') + ' ]',
        item.perfect ? '**FC**' : `${stats.count_miss} ${stats.count_miss === 1 ? 'Miss' : 'Misses'}`
      ]
    ].map(x => x.join(' • ')).join('\n'),
    thumbnail: { url: rank.img },
    image: { url: cover },
    footer: {
      text: [
        new Date(map.last_updated).getFullYear() + ' ' + map.status[0].toUpperCase() + map.status.substr(1),
        map.bpm + ' BPM',
        time(map.hit_length * 1000),
        [
          `${map.cs} CS`,
          `${map.ar} AR`,
          `${map.accuracy} OD`,
          `${map.drain} HP`
        ].join(' | ')
      ].join(' • ')
    }
  }
}

async function calc (id, acc, combo, miss, mods) {
  let { body } = await dp('https://osu.ppy.sh/osu/' + id)
  let Parser = oj.parser
  const { map } = new Parser().feed(body)
  map.mode = Number(map.mode || 0)
  return {
    max_combo: map.max_combo(),
    pp: {
      gain: parseInt(oj.ppv2({ map, acc_percent: parseFloat(acc), combo: combo, nmiss: miss, mods: oj.modbits.from_string(mods) }).total),
      total: parseInt(oj.ppv2({ map, mods: oj.modbits.from_string(mods) }).total)
    }
  }
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

function send (obj) {
  dp.post(hook, {
    data: obj,
    type: 'json'
  })
}

function log (item) {
  console.log([
    `${item.user.username} (${item.rank}) >`,
    `${item.beatmapset.title} [${item.beatmap.difficulty_rating} ★ ${item.beatmap.version}]`
  ].join(' '))
}

let RANK = {
  F: { img: '', color: 0 },
  D: { img: 'https://i.imgur.com/qiI2lGV.png', color: 9967895 },
  C: { img: 'https://i.imgur.com/kkvExOR.png', color: 14377691 },
  B: { img: 'https://i.imgur.com/njIcLQV.png', color: 3492295 },
  A: { img: 'https://i.imgur.com/RGOohGm.png', color: 6795600 },
  S: { img: 'https://i.imgur.com/UcekL5e.png', color: 14598211 },
  SH: { img: 'https://i.imgur.com/cvTSy9Q.png', color: 12308694 },
  X: { img: 'https://i.imgur.com/w8uxl3o.png', color: 14598211 },
  XH: { img: 'https://i.imgur.com/LEJgPJs.png', color: 12308694 }
}
