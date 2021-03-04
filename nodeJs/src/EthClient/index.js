const Web3 = require('web3')
const ethTx = require('ethereumjs-tx').Transaction
const fs = require('fs')

const PENDING = 'pending'
const HEX = 'hex'
const ZEROX = '0x'
const ETHER = 'ether'

module.exports = class EthClient {

  constructor(
    providerUrl,
    ethNetworkName,
    gasPrice,
    gasLimit,
    solContractAddress,
    solContractAbiJsonFileName,
    fromWalletAddress,
    fromWalletPrivateKey
  ) {
    this.providerUrl = providerUrl
    this.ethNetworkName = ethNetworkName
    this.gasPrice = gasPrice
    this.gasLimit = gasLimit
    this.solContractAddress = solContractAddress
    this.solContractAbiJsonFileName = solContractAbiJsonFileName
    this.fromWalletAddress = fromWalletAddress
    this.fromWalletPrivateKey = fromWalletPrivateKey
  }

  init = () => {
    const provider = new Web3.providers.HttpProvider(this.providerUrl)
    this.web3 = new Web3(provider)
    const contractAbiStr = fs.readFileSync(this.solContractAbiJsonFileName)
    const contractAbi = JSON.parse(contractAbiStr);
    this.contract = new this.web3.eth.Contract(contractAbi, this.solContractAddress)
  }

  getNonceForAddress = async address => {
    const txnCount = await this.web3.eth.getTransactionCount(address, PENDING)
    return this.web3.utils.numberToHex(txnCount)
  }

  transferEth = async (addressTo, valueInEther) => {
    const txObject = {
      nonce: await this.getNonceForAddress(this.fromWalletAddress),
      gasPrice: this.web3.utils.numberToHex(this.gasPrice),
      gasLimit: this.web3.utils.numberToHex(this.gasLimit),
      to: addressTo,
      value: this.web3.utils.numberToHex(this.web3.utils.toWei(valueInEther.toString(), ETHER))
    }
    return this.sendTx(txObject)
  }

  transferToken = async (addressTo, manyTokens) => {
    let data =  await this.contract.methods.transfer(addressTo, manyTokens).encodeABI()

    const txObject = {
      nonce: await this.getNonceForAddress(this.fromWalletAddress),
      gasPrice: this.web3.utils.numberToHex(this.gasPrice),
      gasLimit: this.web3.utils.numberToHex(this.gasLimit),
      to: this.solContractAddress,
      value: "0x00",
      data: data,
    }
    return this.sendTx(txObject)
  }

  // walletAddress is optional - else use fromWalletAddress
  balanceOf = async (walletAddress) => {
    return this.contract.methods.balanceOf(walletAddress || this.fromWalletAddress).call()
  }

  sendTx = async txObject => {
    console.log('txObject:', txObject)

    // Sign the transaction with the private key
    const tx = new ethTx(txObject, {chain:this.ethNetworkName})
    tx.sign(this.fromWalletPrivateKey)

    //Convert to raw transaction string
    const serializedTx = tx.serialize()
    const rawTxHex = ZEROX + serializedTx.toString(HEX)
    console.log("Raw transaction data: " + rawTxHex)

    return new Promise((resolve, reject) => {
      return this.web3.eth.sendSignedTransaction(rawTxHex)
        .on('receipt', resolve)
        .catch(reject)
    })
  }
}
