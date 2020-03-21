let dp = require('despair')
let Corrin = require('corrin')
let hook = process.env.HOOK

let track = ['4949888', '7230263', '14552691', '13833303', '10870965'] // osu! user_id's to track

let feed = new Corrin(track.map(x => [() => osuRecent(x), x => x.id]))
console.log(`Tracking: (${track.join(', ')})`)

feed.on('new', items => {
  for (let prop in items) {
    let embeds = []
    let user = null
    for (let i = 0; i < items[prop].length; i++) {
      let item = items[prop][i]
      if (!user) user = { name: item.user.username, avatar: item.user.avatar_url }
      let rank = RANK[item.rank]
      embeds.push({
        title: `${item.beatmapset.title} - ${item.beatmapset.artist} [${item.beatmap.difficulty_rating} ☆ ${item.beatmap.version}]`,
        color: rank.color,
        url: item.beatmap.url,
        description: [
          item.mods.length ? `**Mods** ${item.mods.join('')} ` : '',
          `**Accuracy** ${(item.accuracy * 100).toFixed(2)}% `,
          `**Combo** ${item.max_combo} `,
          item.pp ? `**PP** ${parseInt(item.pp)}\n` : '\n',
          item.statistics ? [
            `**300** ${item.statistics.count_300} `,
            `**100** ${item.statistics.count_100} `,
            `**50** ${item.statistics.count_50} `,
            `**Miss** ${item.statistics.count_miss}`
          ].join('') : ''
        ].join(''),
        timestamp: item.created_at,
        footer: {
          text: item.user.username
        },
        thumbnail: {
          url: rank.img
        }
      })
      log(item)
    }
    send({
      username: user.name,
      avatar_url: user.avatar,
      embeds: embeds
    })
  }
})

function log (obj) {
  console.log([
    `${obj.user.username} (${obj.rank}) >`,
    `${obj.beatmapset.title} - ${obj.beatmapset.artist}`,
    `[${obj.beatmap.difficulty_rating} ☆ ${obj.beatmap.version}]`
  ].join(' '))
}

function send (obj) {
  dp.post(hook, {
    data: obj,
    type: 'json'
  })
}

async function osuRecent (id) {
  try {
    let { body } = await dp('https://osu.ppy.sh/users/' + id)
    let pointer = body.indexOf('json-extras') + 37
    let json = JSON.parse(body.substring(pointer, body.indexOf('</script>', pointer)))
    let recent = json.scoresRecent
    return recent
  } catch (e) {
    console.error(e)
    return []
  }
}

let RANK = {
  D: { img: 'https://i.imgur.com/qiI2lGV.png', color: 9967895 },
  C: { img: 'https://i.imgur.com/kkvExOR.png', color: 14377691 },
  B: { img: 'https://i.imgur.com/njIcLQV.png', color: 3492295 },
  A: { img: 'https://i.imgur.com/RGOohGm.png', color: 6795600 },
  S: { img: 'https://i.imgur.com/UcekL5e.png', color: 14598211 },
  SH: { img: 'https://i.imgur.com/cvTSy9Q.png', color: 12308694 },
  X: { img: 'https://i.imgur.com/w8uxl3o.png', color: 14598211 },
  XH: { img: 'https://i.imgur.com/LEJgPJs.png', color: 12308694 }
}
