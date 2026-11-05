#!/usr/bin/env node
// Generated output is checked against its authoritative source, not an accepted diff.
require('./build').build({check:!process.argv.includes('--update')});
