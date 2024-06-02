import { PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, utils } from "@coral-xyz/anchor";
import { Solsplit } from "generated/solsplit";

export async function createGroup( provider:AnchorProvider, program:Program<Solsplit>, name:string, admin:PublicKey){
    
}
/*
   await program.methods.createGroup(group1Name).accounts({
        groupAdmin: alice.publicKey,
        group: group1AccountKey,
        systemProgram: anchor.web3.SystemProgram.programId
      }).signers([alice]).rpc({ commitment: "confirmed" });
*/