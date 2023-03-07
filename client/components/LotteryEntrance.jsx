import { useEffect, useState } from "react"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { abi, contractAddresses } from "../constants/constants.js"
import { ethers } from "ethers"

export default function LotteryEntrance() {
  const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
  const chainId = parseInt(chainIdHex)
  const lotteryAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
  const [entranceFee, setEntranceFee] = useState("0")

  const { runContractFunction: enterLottery } = useWeb3Contract({
    abi: abi,
    contractAddress: lotteryAddress,
    functionName: "enterLottery",
    params: {},
    msgValue: entranceFee,
  })

  const { runContractFunction: getEntranceFee } = useWeb3Contract({
    abi: abi,
    contractAddress: lotteryAddress,
    functionName: "getEntranceFee",
    params: {},
  })

  const handleJoinLottery = async () => await enterLottery()

  useEffect(() => {
    if (isWeb3Enabled) {
      const updateUI = async () => {
        setEntranceFee((await getEntranceFee()).toString())
      }
      updateUI()
    }
  }, [isWeb3Enabled])

  return (
    <>
      <h2>Welcome to Lottery Entrance!</h2>
      {lotteryAddress && (
        <>
          <button onClick={handleJoinLottery}>Join Lottery</button>
          <p>Entrance Fee: {ethers.utils.formatUnits(entranceFee, "ether")} ETH</p>
        </>
      )}
    </>
  )
}
