const { ethers, network } = require("hardhat")
const fs = require("fs")

const FRONTEND_LOCATION_ADDRESSES_FILE = "../frontend/constants/contractAddresses.json"
const FRONTEND_ABI_FILE = "../frontend/constants/abi.json"

module.exports = async () => {
  if (process.env.UPDATE_FRONTEND) console.log("Updating Frontend...")
  await updateContractAddresses()
  await updateAbi()
  console.log("Frontend written!")
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
  console.log(`Contract Address updated: ${JSON.stringify(currentAddresses)}`)
  console.log(`---------------------------------------------------------------------------------`)
}

const updateAbi = async () => {
  const lottery = await ethers.getContract("Lottery")
  fs.writeFileSync(FRONTEND_ABI_FILE, lottery.interface.format(ethers.utils.FormatTypes.json))
  console.log(`abi updated: ${lottery.interface.format(ethers.utils.FormatTypes.json)}`)
  console.log(`---------------------------------------------------------------------------------`)
}

module.exports.tags = ["all", "frontend"]
