const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { devChains, networkConfig } = require("../../helper-hardhat-config")

!devChains.includes(network.name)
  ? describe.skip
  : describe("Lottery", () => {
      let lottery, vrfCoordinatorV2Mock, lotteryEntranceFee, deployer, interval
      const chainId = network.config.chainId

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        lottery = await ethers.getContract("Lottery", deployer)
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
        lotteryEntranceFee = await lottery.getEntranceFee()
        interval = await lottery.getInterval()
      })

      describe("constructor", () => {
        it("initializes the lottery correctly", async () => {
          const lotteryState = await lottery.getLotteryState()
          const interval = await lottery.getInterval()

          assert.equal(lotteryState.toString(), "0")
          assert.equal(interval.toString(), networkConfig[chainId]["interval"])
        })
      })

      describe("enterLottery", () => {
        it("reverts when payment is not enough", async () => {
          await expect(lottery.enterLottery()).to.be.revertedWithCustomError(
            lottery,
            "Lottery__NotEnoughEntered"
          )
        })

        it("records players when they enter", async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee })
          const playerFromContract = await lottery.getPlayer(0)

          assert.equal(playerFromContract, deployer)
        })

        it("emits event on enter", async () => {
          await expect(lottery.enterLottery({ value: lotteryEntranceFee })).to.emit(
            lottery,
            "LotteryEnter"
          )
        })

        it("doesn't allowed entrance when lottery is calculating", async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee })
          await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
          await network.provider.send("evm_mine", [])
          await lottery.performUpkeep([])

          await expect(
            lottery.enterLottery({ value: lotteryEntranceFee })
          ).to.be.revertedWithCustomError(lottery, "Lottery__NotOpen")
        })
      })

      describe("checkUpkeep", () => {
        it("returns false if people  haven't sent money", async () => {
          await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
          await network.provider.send("evm_mine", [])
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([])

          assert(!upkeepNeeded)
        })

        it("returns false if lottery isn't open", async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee })
          await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
          await network.provider.send("evm_mine", [])
          await lottery.performUpkeep([])
          const lotteryState = await lottery.getLotteryState()
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([])

          assert.equal(lotteryState.toString(), "1")
          assert.equal(upkeepNeeded, false)
        })

        it("returns false if enough time hasn't passed", async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee })
          await network.provider.send("evm_increaseTime", [interval.toNumber() - 5]) // use a higher number here if this test fails
          await network.provider.request({ method: "evm_mine", params: [] })
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)

          assert(!upkeepNeeded)
        })

        it("returns true if enough time has passed, has players, eth, and is open", async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee })
          await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
          await network.provider.request({ method: "evm_mine", params: [] })
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)

          assert(upkeepNeeded)
        })
      })

      describe("performUpkeep", () => {
        it("runs only if checkupkeep is true", async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee })
          await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
          await network.provider.send("evm_mine", [])
          const trx = await lottery.performUpkeep([])

          assert(trx)
        })

        it("reverts when checkupkeep is false", async () => {
          await expect(lottery.performUpkeep([])).to.be.revertedWithCustomError(
            lottery,
            "Lottery__UpkeepNotNeeded"
          )
        })

        it("updates lottery state, emits and event, and calls the vrf coordinator when checkupkeep is false", async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee })
          await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
          await network.provider.send("evm_mine", [])
          const trxRes = await lottery.performUpkeep([])
          const trxReceipt = await trxRes.wait(1)
          const requestId = trxReceipt.events[1].args.requestId
          const lotteryState = await lottery.getLotteryState()

          assert(requestId.toNumber() > 0)
          assert(lotteryState.toString() == "1")
        })
      })

      describe("fulfillRandomWords", () => {
        beforeEach(async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee })
          await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
          await network.provider.send("evm_mine", [])
        })

        it("can only be called after performUpkeep", async () => {
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(0, lottery.address)
          ).to.be.revertedWith("nonexistent request")
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(1, lottery.address)
          ).to.be.revertedWith("nonexistent request")
        })

        it("picks a winner, resets, and sends money", async () => {
          const additionalEntrants = 3
          const startingAccountIndex = 1 //deployer = 0
          const accounts = await ethers.getSigners()

          for (let i = startingAccountIndex; i < startingAccountIndex + additionalEntrants; i++) {
            const accountConnectedLottery = lottery.connect(accounts[i])
            await accountConnectedLottery.enterLottery({ value: lotteryEntranceFee })
          }
          const startingTimeStamp = await lottery.getLatestTimeStamp() // stores starting timestamp

          await new Promise(async (resolve, reject) => {
            lottery.once("WinnerPicked", async () => {
              console.log("Found event")
              try {
                const recentWinner = await lottery.getRecentWinner()
                const lotteryState = await lottery.getLotteryState()
                const endingTimeStamp = await lottery.getLatestTimeStamp()
                const numPlayers = await lottery.getPlayersNumber()
                const winnerEndingBalance = await accounts[1].getBalance()

                assert.equal(numPlayers.toString(), "0")
                assert.equal(lotteryState.toString(), "0")
                assert.equal(
                  winnerEndingBalance.toString(),
                  winnerStartingBalance.add(
                    lotteryEntranceFee.mul(additionalEntrants).add(lotteryEntranceFee).toString()
                  )
                )
                assert(endingTimeStamp > startingTimeStamp)
                resolve()
              } catch (err) {
                reject(err)
              }
            })

            const trx = await lottery.performUpkeep([])
            const trxReceipt = await trx.wait(1)
            const winnerStartingBalance = await accounts[1].getBalance()
            await vrfCoordinatorV2Mock.fulfillRandomWords(
              trxReceipt.events[1].args.requestId,
              lottery.address
            )
          })
        })
      })
    })
