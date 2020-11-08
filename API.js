let dp = require('despair')

function API (id, secret) {
  this.base = 'https://osu.ppy.sh/api/v2/'
  this.client = { id, secret }
  this._token = null
}

API.prototype.token = async function () {
  if (this._token) return this._token
  let body = await dp.post('oauth/token', {
    base: 'https://osu.ppy.sh',
    data: {
      client_id: this.client.id,
      client_secret: this.client.secret,
      grant_type: 'client_credentials',
      scope: 'public'
    },
    type: 'json'
  }).json()
  this._token = `${body.token_type} ${body.access_token}`
  setTimeout(() => { this._token = null }, body.expires * 1000)
  return this._token
}

API.prototype.scores = async function (type, id, opts = {}) {
  let body = await dp(`users/${id}/scores/${type}`, {
    base: this.base,
    query: opts,
    headers: { Authorization: await this.token() }
  }).json().catch(e => JSON.parse(e.body))
  return body
}

module.exports = API
