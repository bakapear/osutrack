let dp = require('despair')

let { ScoreCalculator } = require('@kionell/osu-pp-calculator')
let ppcalc = new ScoreCalculator()

let Corrin = require('corrin')
let API = require('./API')

let interval = 15000 // increase this if you have many users to track

let id = process.env.CLIENT_ID
let secret = process.env.CLIENT_SECRET
let hook = process.env.HOOK
let track = process.env.TRACK

if (!id || !secret || !hook || !track) throw new Error('One or more required environment variables are not set!')

track = track.split(',')
let api = new API(id, secret)

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
    await send({
      username: user.name,
      avatar_url: user.avatar,
      embeds
    })
  }
})

async function embed (item) {
  let rank = RANK[item.rank]
  let stats = item.statistics
  let map = item.beatmap
  let accuracy = (item.accuracy * 100).toFixed(2)
  let data = await calc(item)
  let cover = item.beatmapset.covers.slimcover
  if (!await dp.head(cover).catch(e => false)) cover = COVER
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

let RULESETS = ['osu', 'taiko', 'fruits', 'mania']

async function calc (item) {
  let MAP = {
    beatmapId: item.beatmap.id,
    rulesetId: RULESETS.indexOf(item.type.slice(6)),
    mods: item.mods.join('')
  }

  if (MAP.rulesetId === -1) MAP.rulesetId = 0 // default to standard

  let a = await ppcalc.calculate({ ...MAP, accuracy: [100] })
  let b = await ppcalc.calculate({
    ...MAP,
    accuracy: item.accuracy * 100,
    totalScore: item.score,
    maxCombo: item.max_combo,
    count50: item.statistics.count_50,
    count100: item.statistics.count_100,
    count300: item.statistics.count_300,
    countGeki: item.statistics.count_geki,
    countKatu: item.statistics.count_katu,
    countMiss: item.statistics.count_miss
  })

  return {
    pp: { gain: b.scoreInfo.totalPerformance.toFixed(0), total: a.scoreInfo.totalPerformance.toFixed(0) },
    max_combo: a.scoreInfo.maxCombo
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

async function send (obj) {
  try {
    await dp.post(hook, {
      data: obj,
      type: 'json'
    })
  } catch (e) { console.log('HOOK ERROR:', e) }
}

function log (item) {
  console.log([
    `${item.user.username} (${item.rank}) >`,
    `${item.beatmapset.title} [${item.beatmap.difficulty_rating} ★ ${item.beatmap.version}]`
  ].join(' '))
}

let BASE = 'https://raw.githubusercontent.com/bakapear/osutrack/master/files/'

let RANK = {
  F: { img: '', color: 0 },
  D: { img: BASE + 'ranks/D.png', color: 9967895 },
  C: { img: BASE + 'ranks/C.png', color: 14377691 },
  B: { img: BASE + 'ranks/B.png', color: 3492295 },
  A: { img: BASE + 'ranks/A.png', color: 6795600 },
  S: { img: BASE + 'ranks/S.png', color: 14598211 },
  SH: { img: BASE + 'ranks/SH.png', color: 12308694 },
  X: { img: BASE + 'ranks/X.png', color: 14598211 },
  XH: { img: BASE + 'ranks/XH.png', color: 12308694 }
}

let COVER = BASE + 'slimcover.png'
