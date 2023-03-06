const { network } = require("hardhat")
const { devChains } = require("../helper-hardhat-config")

// comes from https://docs.chain.link/vrf/v2/subscription/supported-networks
// Goerli testnet - PREMIUM
// is the cost * request
const BASE_FEE = ethers.utils.parseEther("0.25")
// calculated value based on gas price of the chain
const GAS_PRICE_LINK = 1e9

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const args = [BASE_FEE, GAS_PRICE_LINK]

  if (devChains.includes(network.name)) {
    log("Local network detected! Deploying mocks...")
    // deploy a mock vrfcoordinator
    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      log: true,
      args: args,
    })
    log("Mocks Deployed!")
    log("-----------------------------------------------------")
  }
}

module.exports.tags = ["all", "mocks"]
