# osu!track
Posts your recent osu! scores to a Discord webhook

### Requirements
- [NodeJS](https://nodejs.org/)
- [osu! oAuth client credentials](https://osu.ppy.sh/docs/#registering-an-oauth-application)

### Installation
1. [Download this repository](https://github.com/bakapear/osutrack/archive/master.zip) and extract it
2. Run `npm install` inside the directory

### Usage
1. Set the required environment variables
2. Run `npm start`
3. Play a submitted osu! map and the results should appear in the Discord channel your webhook points to

### Environment Variables
```env
CLIENT_ID = "osu! oauth client id"
CLIENT_SECRET = "osu! oauth client secret"
HOOK = "discord webhook url"
TRACK = "comma separated list of osu! user ids to keep track of"
```

### Preview
![Preview](https://i.imgur.com/Smju89c.png)
