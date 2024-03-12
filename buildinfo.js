const commit = (process.env.GITHUB_SHA || 'dev').slice(0, 7);
const branch = process.env.GITHUB_REF
    ? process.env.GITHUB_REF.split('/').pop()
    : 'dev';

require('fs').writeFileSync(
    'buildinfo.json',
    JSON.stringify({ commit, branch }, null, 4),
    'utf8'
);
