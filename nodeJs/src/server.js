console.log('\n\n\n\n');
console.log('************************************************************');
console.log('*                    Server starting                       *');
console.log('************************************************************');

require('dotenv').config()
const port = process.env.NODE_API_SERVER_PORT || 3000
const config = {
  providerUrl: process.env.ETH_PROVIDER_URL || 'http://localhost:8545',
  ethNetworkName: process.env.ETH_NETWORK_NAME,
  gasPrice: process.env.GAS_PRICE || 1000,
  gasLimit: process.env.GAS_LIMIT || 21000,
  solContractAddress: process.env.SOL_CONTRACT_ADDRESS,
  solContractAbiJsonFileName: process.env.SOL_CONTRACT_ABI_JSON_FILE_NAME,
  fromWalletAddress: process.env.FROM_WALLET_ADDRESS,
  fromWalletPrivateKey: Buffer.from(process.env.FROM_WALLET_PRIVATE_KEY, 'hex'),
}
const configWithoutPrivateKey = {...config}
configWithoutPrivateKey.fromWalletPrivateKey = '[REDACTED]'
console.log('Configuration:', configWithoutPrivateKey)

const express = require('express')
const app = express()

const EthClient = require('./EthClient')
const ethClient = new EthClient(
  config.providerUrl,
  config.ethNetworkName,
  config.gasPrice,
  config.gasLimit,
  config.solContractAddress,
  config.solContractAbiJsonFileName,
  config.fromWalletAddress,
  config.fromWalletPrivateKey,
)
ethClient.init()

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/deploySolContract', (req, res) => {
  res.send('Hello World!')
})

app.post('/transferEth', async (req, res) => {
  const addressTo = req.query.addressTo
  const valueInEther = req.query.valueInEther
  if(!addressTo || !valueInEther) {
    res.status(400).json('Missing necessary parameters: addressTo or valueInEther')
    return
  }
  try {
    const responseObj = await ethClient.transferEth(addressTo, valueInEther)
    console.log('transferEth responseObj:', responseObj)
    res.send(responseObj)
  } catch(error) {
    console.error('transferEth error:', error)
    res.status(400).json(error)
    return
  }
})

app.post('/transferToken', async (req, res) => {
  const addressTo = req.query.addressTo
  const manyTokens = req.query.manyTokens
  if(!addressTo || !manyTokens) {
    res.status(400).json('Missing necessary parameters: addressTo or manyTokens')
    return
  }
  try {
    const responseObj = await ethClient.transferToken(addressTo, manyTokens)
    console.log('transferToken responseObj:', responseObj)
    res.send(responseObj)
  } catch(error) {
    console.error('transferToken error:', error)
    res.status(400).json(error)
    return
  }
})

app.get('/balanceOf', async (req, res) => {
  const walletAddress = req.query.walletAddress
  try {
    const responseObj = await ethClient.balanceOf(walletAddress)
    console.log('balanceOf responseObj:', responseObj)
    res.send(responseObj)
  } catch(error) {
    console.error('balanceOf error:', error)
    res.status(400).json(error)
    return
  }
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
