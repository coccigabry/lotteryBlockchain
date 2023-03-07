const { ethers, network } = require("hardhat")
const fs = require("fs")

const FRONTEND_LOCATION_ADDRESSES_FILE = "../client/constants/contractAddresses.json"
const FRONTEND_ABI_FILE = "../client/constants/abi.json"

module.exports = async () => {
  if (process.env.UPDATE_FRONTEND) console.log("Updating Frontend...")
  updateContractAddresses()
  updateAbi()
}

const updateContractAddresses = async () => {
  const lottery = await ethers.getContract("Lottery")
  const chainId = network.config.chainId.toString()
  const currentAddresses = JSON.parse(fs.readFileSync(FRONTEND_LOCATION_ADDRESSES_FILE, "utf8"))
  if (chainId in currentAddresses) {
    if (!currentAddresses[chainId].includes(lottery.address)) {
      currentAddresses[chainId].push(lottery.address)
    }
  }
  {
    currentAddresses[chainId] = [lottery.address]
  }
  fs.writeFileSync(FRONTEND_LOCATION_ADDRESSES_FILE, JSON.stringify(currentAddresses))
}

const updateAbi = async () => {
  const lottery = await ethers.getContract("Lottery")
  fs.writeFileSync(FRONTEND_ABI_FILE, lottery.interface.format(ethers.utils.FormatTypes.json))
}

module.exports.tags = ["all", "frontend"]
