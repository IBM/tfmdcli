#!/usr/bin/env node

// Add CLI
const tfmdcli = require("./lib/cli").main;
console.log(
  tfmdcli(process.argv)
)