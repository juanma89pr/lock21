const dir = process.argv[2];
const names = ['lock','check','x','dumbbell','footprints','moon','person-standing','glass-water','monitor-off','bot','user-round','calendar-days','users','chart-spline','link-2','flame','message-circle','timer','brain','circle-help','hourglass','clipboard-list','minus','arrow-right','bed-double','smartphone','calendar-clock','sparkles','shield-check'];
const out = {};
for (const n of names) {
  let m = await import(dir + '/' + n + '.mjs'); if (!m.__iconData) { const fs = await import('fs'); const t = fs.readFileSync(dir + '/' + n + '.mjs', 'utf8'); const tgt = t.match(/from '\.\/(.*?)'/)[1]; m = await import(dir + '/' + tgt); }
  out[n] = m.__iconData.node.map(([tag, a]) => '<' + tag + ' ' + Object.entries(a).filter(([k]) => k !== 'key').map(([k, v]) => k + '="' + v + '"').join(' ') + '/>').join('');
}
console.log(JSON.stringify(out));
