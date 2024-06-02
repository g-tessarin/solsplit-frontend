// TODO: SignMessage
import { verify } from '@noble/ed25519';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { FC, useCallback, useState } from 'react';
import { notify } from "../utils/notifications";
import { Program, AnchorProvider, utils, BN, setProvider, Wallet } from '@coral-xyz/anchor';
import { Solsplit } from 'generated/solsplit';
import idl from "../generated/solsplit.json";
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { getGroupAddress } from './functions/utils';

const idlString = JSON.stringify(idl);
const idlObject = JSON.parse(idlString);
const programId = new PublicKey(idl.metadata.address);


export const NewGroup: FC = () => {
    const browserWallet = useWallet();
    const { connection } = useConnection();

    const [newGroupName, setNewGroupName] = useState('');
    const [status, setStatus] = useState('');

    const getProvider = () => {
        const provider = new AnchorProvider(connection, browserWallet, AnchorProvider.defaultOptions());
        setProvider(provider);
        return provider;
    }

    const createGroup = async () => {
        const provider = getProvider();
        try {
            console.log('Creating group ' + newGroupName);
            const program = new Program<Solsplit>(idlObject, programId, provider);
            const [groupAddress, bump] = getGroupAddress(newGroupName, provider.publicKey, programId)
            program.methods.createGroup(newGroupName).accounts({
                groupAdmin: provider.publicKey,
                group: groupAddress,
                systemProgram: SystemProgram.programId
            }).rpc({ commitment: "confirmed" });
            setStatus('Group ' + newGroupName + ' Created, address: ' + groupAddress.toString());
        } catch (e) {
            console.error(e);
            setStatus('Error in group creation');
        }
    }

    return (
        <div>
            <div className="flex flex-row justify-center">
                <input type="text" placeholder='Group Name' className="text-input" value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} />
            </div>
            <div className="flex flex-row justify-center">

                <div className="relative group items-center">

                    <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>

                    <button
                        className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                        onClick={() => createGroup()} disabled={!browserWallet}
                    >
                        <div className="hidden group-disabled:block">
                            Wallet not connected
                        </div>
                        <span className="block group-disabled:hidden" >
                            Create Group
                        </span>
                    </button>
                </div>
            </div>

            <div className="flex flex-row justify-center">
                <label >{status}</label>
            </div>

        </div>
    );
};
