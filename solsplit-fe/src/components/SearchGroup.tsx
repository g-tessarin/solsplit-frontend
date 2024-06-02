// TODO: SignMessage
import { verify } from '@noble/ed25519';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { FC, useCallback, useState } from 'react';
import { notify } from "../utils/notifications";
import { Program, AnchorProvider, utils, BN, setProvider, Wallet, AccountClient } from '@coral-xyz/anchor';
import { Solsplit } from 'generated/solsplit';
import idl from "../generated/solsplit.json";
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { getGroupAddress, getExpenseOnGroup } from './functions/utils';
import { group } from 'console';

const idlString = JSON.stringify(idl);
const idlObject = JSON.parse(idlString);
const programId = new PublicKey(idl.metadata.address);

class ExpenseData {
    name: string;
    amount: number;
    lamports_per_sol: number;
    index: string;
    payer: PublicKey;
    constructor(name: string, amount: number, lamports_per_sol: number, index: string, payer: PublicKey) {
        this.name = name;
        this.amount = amount;
        this.lamports_per_sol = lamports_per_sol;
        this.index = index;
        this.payer = payer;
    }
}

const ExpenseList: FC = (list: Array<ExpenseData>) => {
    const listItems = list.map((exp, ind) =>
        <div className='mb2 expense-div' key={ind}>
            <div>
                {exp.index + ' Name: ' + exp.name}
            </div>
            <div>
                {'Amount: ' + exp.amount.toString() + ' lamports'}
            </div>

            <div>
                {'paid by: ' + exp.payer.toBase58()}
            </div>
        </div>
    );

    return (<div>{listItems}</div>);
}
const LAMPORTS_PER_SOL: number = 1000000000;

export const SearchGroup: FC = () => {

    const browserWallet = useWallet();
    const { connection } = useConnection();

    const [groupName, setGroupName] = useState('');
    const [adminKey, setAdminKey] = useState('');

    const [userIsAdmin, setUserIsAdmin] = useState<boolean>(false);
    const [groupAddress, setGroupAddress] = useState<PublicKey>();
    const [currentExpenseCount, setCurrentExpenseCount] = useState(0);
    const [enableNewExpenseForm, setEnableNewExpenseForm] = useState(false);
    const [isMember, setIsMember] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    const [newExpenseName, setNewExpenseName] = useState<string>();
    const [newExpenseAmount, setNewExpenseAmount] = useState<number>();
    const [expenses, setExpenses] = useState<Array<ExpenseData>>([]);

    const [settlingAmount, setSettlingAmount] = useState<number>(0);
    const [isSettled, setIsSettled] = useState(false);
    const getProvider = () => {
        const provider = new AnchorProvider(connection, browserWallet, AnchorProvider.defaultOptions());
        setProvider(provider);
        return provider;
    }

    const searchGroup = async () => {
        console.log('Searching  group');
        try {
            const provider = getProvider();
            const program = new Program<Solsplit>(idlObject, programId, provider);
            let searchKey: PublicKey = adminKey ? new PublicKey(adminKey) : provider.publicKey
            console.log('looking for group ' + groupName + 'of admin: ' + searchKey);
            const [groupAddress, bump] = getGroupAddress(groupName, searchKey, programId)
            const groupAccount = await program.account.group.fetch(groupAddress);

            console.log("found, group with  " + groupAccount.membersCount + " members and " + groupAccount.expensesCount + " expenses");
            setGroupAddress(groupAddress);

            setCurrentExpenseCount(groupAccount.expensesCount);
            if (groupAccount) {
                setUserIsAdmin(provider.publicKey.equals(groupAccount.admin));
                setEnableNewExpenseForm(true);
                loadExpenses(groupAddress, groupAccount.expensesCount, program);
                refreshGroupInfo(groupAccount, provider);

            }
        } catch (e) {
            console.error(e);
        }
    }

    const refreshGroupInfo = (groupAccount, provider) => {
        let memberIndex = groupAccount.members.findIndex(member => member.equals(provider.publicKey));
        if (memberIndex >= 0) {
            setIsMember(true);
            setSettlingAmount(groupAccount.settlingRequest.toNumber() - groupAccount.expensePerUser[memberIndex].toNumber());
            setIsSettled(groupAccount.settledUsers[memberIndex]);
        } else {
            setIsMember(false);
        }
        setIsLocked(groupAccount.lockedForSettling);
    }

    const loadExpenses = async (groupKey: PublicKey, count: number, program: Program<Solsplit>) => {
        console.log('loading expenses list');
        let groupExpenses = []
        for (let i = 0; i < count; i++) {
            const [expKey, bump] = getExpenseOnGroup(groupKey, i, programId);
            const expenseAccount = await program.account.expense.fetch(expKey);
            groupExpenses.push(
                new ExpenseData(utils.bytes.utf8.decode(new Uint8Array(expenseAccount.description)),
                    expenseAccount.lamportsAmount,
                    expenseAccount.lamportsPerSol,
                    utils.bytes.utf8.decode(new Uint8Array(expenseAccount.index)),
                    expenseAccount.payer),
            )
            console.log(expenseAccount);
        }
        setExpenses(groupExpenses);
    }

    const joinGroup = async () => {
        console.log('joining group');
        const provider = getProvider();
        const program = new Program<Solsplit>(idlObject, programId, provider);

        program.methods.joinGroup().accounts({
            group: groupAddress,
            user: provider.publicKey
        }).rpc({ commitment: "confirmed" }).then(() => {
            program.account.group.fetch(groupAddress).then((groupAccount) => {
                console.log('current user is a member');
                refreshGroupInfo(groupAccount, provider);
            });
        });
    }

    const addExpense = async () => {
        console.log('adding expense number' + currentExpenseCount);
        if (newExpenseAmount && newExpenseName && currentExpenseCount != null) {
            const provider = getProvider();
            const program = new Program<Solsplit>(idlObject, programId, provider);
            const [expKey, bump] = getExpenseOnGroup(groupAddress, currentExpenseCount, programId);
            program.methods.addExpense(new BN(newExpenseAmount), new BN(LAMPORTS_PER_SOL), currentExpenseCount.toString(), newExpenseName).accounts({
                expenseAuthority: provider.publicKey,
                group: groupAddress,
                expense: expKey
            }).rpc({ commitment: "confirmed" }).then(() => {
                setTimeout(() => {
                    program.account.group.fetch(groupAddress).then((groupAccount) => {
                        console.log('current expenses on group: ' + currentExpenseCount);
                        setCurrentExpenseCount(groupAccount.expensesCount);
                        loadExpenses(groupAddress, currentExpenseCount, program);
                    });
                }, 3000)

            });
        }
    }

    const requestSettling = async () => {
        console.log('requesting settling');
        const provider = getProvider();
        const program = new Program<Solsplit>(idlObject, programId, provider);
        program.methods.requestSettling().accounts({
            group: groupAddress,
            user: provider.publicKey
        }).rpc({ commitment: "confirmed" }).then(() => {
            program.account.group.fetch(groupAddress).then(
                (groupAccount) => {
                    refreshGroupInfo(groupAccount, provider);
                }
            );
            console.log('settling requested');
        });

    }
    const authorizeSettling = async () => {
        console.log('accepting settling');
        const provider = getProvider();
        const program = new Program<Solsplit>(idlObject, programId, provider);
        program.methods.authorizeSettling().accounts({
            group: groupAddress,
            userAuthority: provider.publicKey
        }).rpc({ commitment: "confirmed" }).then(() => {
            program.account.group.fetch(groupAddress).then(
                (groupAccount) => {
                    refreshGroupInfo(groupAccount, provider);
                }
            );
            console.log('settling accepted');
        });
    }

    const getSettlingMessage = () => {
        if (isSettled) {
            return "You are already settled for this group";
        }
        if (settlingAmount === 0) {
            return "Please accept the current settling, no deposit is required"
        } else if (settlingAmount > 0) {
            return "You will deposit " + settlingAmount + " lamports";
        } else if (settlingAmount < 0) {
            return "You will receive " + Math.abs(settlingAmount) + " lamports";
        }
    }

    const deleteGroup = async () => {
        console.log('deleting group');
        const provider = getProvider();
        const program = new Program<Solsplit>(idlObject, programId, provider);
        program.methods.deleteGroup().accounts({
            group: groupAddress,
            groupAdmin: provider.publicKey
        }).rpc({ commitment: "confirmed" }).then(() => {
            console.log('group deleted');
            setGroupAddress(null);
            setUserIsAdmin(false);
            setEnableNewExpenseForm(false);
            setExpenses([]);
            setCurrentExpenseCount(null);
            setIsMember(false);
            setIsSettled(false);
            setIsLocked(false);
            setSettlingAmount(0);
        });
    }
    return (
        <div>

            <div className="flex flex-row justify-center ">

                <div className='border-div flex-col'>
                    <div className='flex-row'>
                        <div className='flex-col'>
                            <div className="flex flex-row justify-center m-1">
                                <input type="text" className="text-input m-1" placeholder='Admin PubKey' value={adminKey} onChange={(event) => setAdminKey(event.target.value)} />
                            </div>
                            <div className="flex flex-row justify-center">
                                <input type="text" className="text-input" placeholder='Group Name' value={groupName} onChange={(event) => setGroupName(event.target.value)} />
                            </div>
                        </div>
                        <div className="relative group items-center flex-col">
                            <button
                                className="group w-60 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                                onClick={() => searchGroup()} disabled={!browserWallet}
                            >
                                <div className="hidden group-disabled:block">
                                    Wallet not connected
                                </div>
                                <span className="block group-disabled:hidden" >
                                    SEARCH Group
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex-col  border-div" hidden={!groupAddress}>
                    <div className="flex-row justify-center mb-2" hidden={!groupAddress}>Group name:</div>
                    <div className="flex-row justify-center mb-2" hidden={!groupAddress}>{groupName}</div>
                    <div className='flex-row'>
                        <button
                            className="group w-60 m-2 btn  bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={() => deleteGroup()} disabled={!browserWallet || !groupAddress || isLocked || !userIsAdmin}

                        >Delete Group
                        </button>

                    </div>
                </div>
                <div className='flex-col'>
                    <div className="flex flex-row justify-center" hidden={!enableNewExpenseForm} >
                        <div className="flex-col border-div" hidden={isMember || !groupAddress} >
                            <button
                                className="flex-col group w-60 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                                onClick={() => joinGroup()} disabled={!browserWallet || !groupAddress || isMember}

                            >Join group</button>
                        </div>
                        <div className="flex-col border-div" hidden={!browserWallet || !groupAddress || !isMember}>
                            <div className="flex flex-row justify-center">
                                <input hidden={!enableNewExpenseForm} type="text" className="text-input m-1" placeholder='Expense name' value={newExpenseName} onChange={(event) => setNewExpenseName(event.target.value)} />
                            </div>
                            <div className="flex flex-row justify-center">
                                <input hidden={!enableNewExpenseForm} type="text" className="text-input m-1" placeholder='Lamports' value={newExpenseAmount} onChange={(event) => setNewExpenseAmount(Number.parseInt(event.target.value))} />
                            </div>
                            <button

                                className="flex-row group w-60 m-2 btn  bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                                onClick={() => addExpense()} disabled={!browserWallet || !groupAddress || !newExpenseName || !newExpenseAmount || isLocked}

                            >Add expense
                            </button>
                        </div>
                        <div className="flex-col border-div" hidden={!browserWallet || !groupAddress || !isMember}>

                            <div className='flex-row'>
                                <button
                                    className="group w-60 m-2 btn  bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                                    onClick={() => requestSettling()} disabled={!browserWallet || !groupAddress || !isMember || isLocked}

                                >Request Settling
                                </button>
                            </div>
                            <div hidden={!browserWallet || !groupAddress || !isMember || !isLocked}> {getSettlingMessage()}</div>
                            <div className='flex-row' >
                                <button
                                    className="group w-60 m-2 btn  bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                                    onClick={() => authorizeSettling()} disabled={!browserWallet || !groupAddress || !isMember || !isLocked || isSettled}

                                >Authorize Settling
                                </button>
                            </div>
                        </div>
                    </div>
                </div>



            </div>
            <div className="flex-row justify-center mb-2" hidden={!groupAddress}>{isLocked ? ", The group is locked by a settling request" : ""}</div>
            <div className='flex-row' hidden={!groupAddress}>
                <div className="flex flex-row justify-center">
                    Expenses list:
                </div>
                <div className="flex flex-row justify-center">
                    {ExpenseList(expenses)}
                </div>
            </div>
        </div>
    );
};
