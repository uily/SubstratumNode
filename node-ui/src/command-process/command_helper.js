// Copyright (c) 2017-2019, Substratum LLC (https://substratum.net) and/or its affiliates. All rights reserved.

module.exports = (() => {
  const path = require('../wrappers/path_wrapper')
  const process = require('../wrappers/process_wrapper')
  const consoleWrapper = require('../wrappers/console_wrapper')
  const cmd = require('node-cmd')
  const sudoPrompt = require('sudo-prompt')
  const treeKill = require('tree-kill')

  const binaryBasePath = '../static/binaries/'
  const scriptBasePath = '../static/scripts/'
  const binaryFilename = 'SubstratumNode'
  const runtimeArgs = ['--dns_servers', '1.0.0.1,1.1.1.1,9.9.9.9,8.8.8.8']

  let startSubstratumNode, stopSubstratumNode, binaryPath, scriptPath

  function getBinaryPath () {
    return path.resolveQuoted(__dirname, binaryBasePath + binaryFilename)
  }

  function getScriptPath (scriptFilenameExtension) {
    return path.resolveQuoted(__dirname, scriptBasePath + 'substratum_node.' + scriptFilenameExtension)
  }

  function getCommand () {
    let command = scriptPath + ' ' + binaryPath + ' '
    runtimeArgs.forEach(function (value) {
      command += value + ' '
    })
    consoleWrapper.log('getCommand(): ' + command)
    return command
  }

  function startNodeWindows (callback) {
    cmd.get(getCommand(), callback)
  }

  function startNodeUnix (callback) {
    consoleWrapper.log('command_helper: invoking startNodeUnix')
    sudoPrompt.exec(getCommand(), { name: 'Substratum Node' }, callback)
  }

  function stopNodeWindows (callback) {
    treeKill(process.pid, callback)
  }

  function stopNodeUnix (callback) {
    let error
    try {
      process.kill(-process.pid)
    } catch (err) {
      error = err.message
    }
    callback(error)
  }

  if (process.platform === 'win32') {
    binaryPath = getBinaryPath()
    scriptPath = getScriptPath('cmd')
    startSubstratumNode = startNodeWindows
    stopSubstratumNode = stopNodeWindows
  } else {
    consoleWrapper.log('command_helper: configuring startNodeUnix')
    let sudoUid, sudoGid
    if (process.env.SUDO_UID) {
      sudoUid = process.env.SUDO_UID
    } else {
      sudoUid = process.getuid()
    }
    if (process.env.SUDO_GID) {
      sudoGid = process.env.SUDO_GID
    } else {
      sudoGid = process.getgid()
    }
    binaryPath = getBinaryPath()
    scriptPath = getScriptPath('sh') + ' ' + sudoUid + ' ' + sudoGid
    startSubstratumNode = startNodeUnix
    stopSubstratumNode = stopNodeUnix
  }

  return {
    startSubstratumNode: startSubstratumNode,
    stopSubstratumNode: stopSubstratumNode
  }
})()
