import { useEffect, useState } from "react"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { abi, contractAddresses } from "../constants/constants.js"
import { ethers } from "ethers"
import { useNotification } from "web3uikit"
import { Bell } from "@web3uikit/icons"

export default function LotteryEntrance() {
  const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
  const chainId = parseInt(chainIdHex)
  const lotteryAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
  const [entranceFee, setEntranceFee] = useState("0")
  const [numPlayers, setNumPlayers] = useState("0")
  const [recentWinner, setRecentWinner] = useState("")

  const dispatch = useNotification()

  const {
    runContractFunction: enterLottery,
    isLoading,
    isFetching,
  } = useWeb3Contract({
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

  const { runContractFunction: getPlayersNumber } = useWeb3Contract({
    abi: abi,
    contractAddress: lotteryAddress,
    functionName: "getPlayersNumber",
    params: {},
  })

  const { runContractFunction: getRecentWinner } = useWeb3Contract({
    abi: abi,
    contractAddress: lotteryAddress,
    functionName: "getRecentWinner",
    params: {},
  })

  const updateUI = async () => {
    setEntranceFee((await getEntranceFee()).toString())
    setNumPlayers((await getPlayersNumber()).toString())
    setRecentWinner(await getRecentWinner())
  }

  const handleJoinLottery = async () => {
    await enterLottery({
      onSuccess: handleSuccess,
      onError: (err) => console.error(err),
    })
  }

  const handleSuccess = async (trx) => {
    await trx.wait(1)
    handleNotification(trx)
    updateUI()
  }

  const handleNotification = () => {
    dispatch({
      type: "info",
      message: "Transaction Completed Successfully!",
      title: "Transaction Notification",
      position: "topR",
      icon: <Bell fontSize="20px" />,
    })
  }

  useEffect(() => {
    if (isWeb3Enabled) updateUI()
  }, [isWeb3Enabled])

  return (
    <div className="p-5">
      <h2>Welcome to Lottery Entrance!</h2>
      {lotteryAddress && (
        <div>
          <p>Entrance Fee: {ethers.utils.formatUnits(entranceFee, "ether")} ETH</p>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto disabled:cursor-not-allowed"
            onClick={handleJoinLottery}
            disabled={isLoading || isFetching}
          >
            {isLoading || isFetching ? (
              <div className="animate-spin spinner-border h-5 w-5 border-b-2 rounded-full"></div>
            ) : (
              "Join Lottery"
            )}
          </button>
          <p>Number of players: {numPlayers}</p>
          <p>Last winner: {recentWinner}</p>
        </div>
      )}
    </div>
  )
}
