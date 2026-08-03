// Expo's default Metro config, plus a blockList entry so the app bundler never
// crawls the separate Sanity Studio package (studio/ has its own React/react-dom
// and is not imported by the app).
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const studioDir = path.resolve(__dirname, 'studio').replace(/[/\\]/g, '[/\\\\]');
const studioRe = new RegExp(`${studioDir}[/\\\\].*`);

// blockList may be a single RegExp, an array, or undefined — append, don't clobber.
const existing = config.resolver.blockList;
config.resolver.blockList = existing ? [].concat(existing, studioRe) : studioRe;

module.exports = config;
