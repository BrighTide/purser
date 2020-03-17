import metamaskWallet from '../modules/node_modules/@colony/purser-metamask'


window.executeOpen = () => {
  metamaskWallet.open().then(console.log.bind(console), console.log.bind(console))
}

