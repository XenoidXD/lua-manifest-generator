const express = require('express');
const bodyParser = require('body-parser');
const archiver = require('archiver');
const { exec } = require('child_process');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Utility to sanitize filenames
function sanitize(name) {
  return name.replace(/[\\/:*?"<>|]+/g, '_').substring(0, 50);
}

app.post('/download', async (req, res) => {
  const appidStr = req.body.appid.trim();
  if (!/^\d+$/.test(appidStr)) return res.status(400).send('AppID invalid');

  const appid = Number(appidStr);
  const nextId = appid + 1;

  // Fetch game name from Steam Store API
  let gameName = `game_${appid}`;
  try {
    const info = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appid}`);
    if (info.data[appid] && info.data[appid].success) {
      gameName = sanitize(info.data[appid].data.name);
    }
  } catch (e) {
    console.warn('Failed to fetch game name, using default', e.message);
  }

  // Fetch raw manifest via SteamCMD
  const cmd = `steamcmd +login anonymous +app_info_print ${appid} +quit`;
  exec(cmd, { maxBuffer: 50 * 1024 * 1024 }, (err, stdout) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Failed to fetch manifest via SteamCMD');
    }
    const raw = stdout.trim();

    // Compute SHA256 of raw manifest for signature
    const sha256 = crypto.createHash('sha256').update(raw).digest('hex');
    // Parse buildid for setManifestid
    const match = raw.match(/"buildid"\s*"(\d+)"/);
    const buildid = match ? match[1] : '';

    // Generate Lua script
    const luaLines = [];
    luaLines.push(`addappid(${appid})`);
    luaLines.push(`addappid(${nextId},0,"${sha256}")`);
    if (buildid) luaLines.push(`setManifestid(${nextId},"${buildid}")`);
    luaLines.push('');
    luaLines.push('--[[');
    luaLines.push('This file Generated using XenoidXD Generator');
    luaLines.push('Powered by github.com/XenoidXD');
    luaLines.push('--]]');
    const lua = luaLines.join('\n');

    // Send ZIP containing .manifest and .lua, with game name in filename
    const zipName = `${gameName}.zip`;
    res.attachment(zipName);

    const archive = archiver('zip');
    archive.pipe(res);
    archive.append(raw + '\n', { name: `${appid}.manifest` });
    archive.append(lua + '\n', { name: `${appid}.lua` });
    archive.finalize();
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));