const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { devChains, networkConfig } = require("../../helper-hardhat-config")

devChains.includes(network.name)
  ? describe.skip
  : describe("Lottery", () => {
      let lottery, lotteryEntranceFee, deployer

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        lottery = await ethers.getContract("Lottery", deployer)
        lotteryEntranceFee = await lottery.getEntranceFee()
      })

      describe("fulfillRandomWords", () => {
        it("works with live Chainlink VRF and Automation, we get a random winner", async () => {
          const startingTimeStamp = await lottery.getLatestTimeStamp()
          const accounts = await ethers.getSigners()

          await new Promise(async (resolve, reject) => {
            lottery.once("WinnerPicked", async () => {
              console.log("WinnerPicked event fired")

              try {
                const recentWinner = await lottery.getRecentWinner()
                const lotteryState = await lottery.getLotteryState()
                const winnerEndingBalance = await accounts[0].getBalance()
                const endingTimeStamp = await lottery.getLatestTimeStamp()

                await expect(lottery.getPlayer(0)).to.be.reverted
                assert.equal(recentWinner.toString(), accounts[0].address)
                assert.equal(lotteryState.toString(), "0")
                assert.equal(
                  winnerEndingBalance.toString(),
                  winnerStartingBalance.add(lotteryEntranceFee).toString()
                )
                assert(endingTimeStamp > startingTimeStamp)

                resolve()
              } catch (err) {
                reject(err)
              }
            })
            await lottery.enterLottery({ value: lotteryEntranceFee })
            const winnerStartingBalance = await accounts[0].getBalance()
          })
        })
      })
    })
