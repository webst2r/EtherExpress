/*========TRANSACTION CONTEXT======== */
import React, { useEffect, useState } from "react";
import { ethers } from 'ethers';
import { contractABI, contractAddress } from '../utils/constants'


export const TransactionContext = React.createContext();


const { ethereum } = window; // <=> const ethereum = window.ethereum;

const getEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const transactionContract = new ethers.Contract(contractAddress, contractABI, signer);

    // console.log({provider,signer,transactionContract});

    return transactionContract;
}


/*========Componente: TransactionsProvider======== */
export const TransactionsProvider = ({ children }) => {
    
    const [currentAccount, setCurrentAccount] = useState("");
    const [formData, setFormData] = useState({
        addressTo: '',
        amount: '',
        keyword: '',
        message: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'));
    const [transactions, setTransactions] = useState([]);

    /**
     * Esta função atualiza o estado formData.
     * 1. Cria um novo objeto que é uma cópia do estado anterior de formData, usando o `spread operator` (...prevState)
     * 2. Depois atualiza a propriedade `name` do novo objeto para o valor do elemento target que desencadeou o evento.
     */

    const handleChange = (e, name) => {
        setFormData((prevState) => ({...prevState, [name]: e.target.value}));
    }

    const getAllTransactions = async () => {
        try {
            if(!ethereum) return alert("Please install metamask");
            const transactionContract = getEthereumContract();
            
            // invocar a função `getAllTransactions` que criamos no nosso smart contract
            const availableTransactions = await transactionContract.getAllTransactions();
            
            // basicamente criar um array de objetos. cada objeto contem a informação de uma transacao
            const structuredTransactions = availableTransactions.map((transaction) => ({
                addressTo: transaction.receiver,
                addressFrom: transaction.sender,
                timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
                message: transaction.message,
                keyword: transaction.keyword,
                amount: parseInt(transaction.amount._hex) / (10 ** 18)

            }))
            console.log(structuredTransactions);
            setTransactions(structuredTransactions);
        } catch (error) {
            console.log(error);
        }
    }

    /* Função para checkar se a wallet está conectada. */
    const checkIfWalletIsConnected = async () => {
        try {
            if(!ethereum) return alert("Please install MetaMask");

            const accounts = await ethereum.request({ method: 'eth_accounts' });
            if(accounts.length) {
                // se existir alguma conta no array de contas, a que está no primeiro indice vai ficar conectada
                setCurrentAccount(accounts[0]);
                
                getAllTransactions();
            } else {
                console.log("No accounts found");
            }

            console.log(accounts);
                
        } catch (error) {
            console.log(error);
            throw new Error("No ethereum object.");
        }
    }

    /* Função para verificar se existem transações*/

    const checkIfTransactionsExist = async () => {
        try {
          if (ethereum) {
            const transactionsContract = getEthereumContract();
            const currentTransactionCount = await transactionsContract.getTransactionCount();
    
            window.localStorage.setItem("transactionCount", currentTransactionCount);
          }
        } catch (error) {
          console.log(error);
          throw new Error("No ethereum object");
        }
      };

    /* Função para conectar a wallet. */
    const connectWallet = async () => {
        try {
            if(!ethereum) return alert("Please install MetaMask");
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' }); // get all the accounts, & the user can choose one
            
            setCurrentAccount(accounts[0]);
        } catch (error) {
            console.log(error);
            throw new Error("No ethereum object.")
        }
    }

    const sendTransaction = async () => {
        try {
            if(!ethereum) return alert("Please install MetaMask");
            
            const { addressTo, amount, keyword, message } = formData;
            const transactionContract = getEthereumContract();
            const parsedAmount = ethers.utils.parseEther(amount);
            
            // Enviar a transacao
            await ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: currentAccount,
                    to: addressTo,
                    gas: '0x5208', // 21000 GWEI
                    value: parsedAmount._hex, // 0.00001
                }]
            });

            // Adicionar transacao à Blockchain
            const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword);
            setIsLoading(true);
            console.log(`Loading - ${transactionHash.hash}`);
            await transactionHash.wait();
            setIsLoading(false);
            console.log(`Success - ${transactionHash.hash}`);

            const transactionCount = await transactionContract.getTransactionCount();
            setTransactionCount(transactionCount.toNumber());
            window.location.reload(); 
        } catch (error) {
            console.log(error);
            throw new Error("No ethereum object.")
        }
    }

    /* Corre apenas no início do programa.*/
    useEffect(() => {
        checkIfWalletIsConnected();
        checkIfTransactionsExist();
    }, [transactionCount]);

    return (
        <TransactionContext.Provider value={{ connectWallet, currentAccount, formData, setFormData, handleChange, sendTransaction, transactions, isLoading }}>
            {children}
        </TransactionContext.Provider>
    );
}