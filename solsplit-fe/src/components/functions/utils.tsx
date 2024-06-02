import { PublicKey } from "@solana/web3.js";
import { utils } from "@coral-xyz/anchor";
import { EXPENSE_SEED, GROUP_SEED } from "./constants";

export function getGroupAddress(groupName: string, admin: PublicKey, programId: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [
            utils.bytes.utf8.encode(groupName),
            utils.bytes.utf8.encode(GROUP_SEED),
            admin.toBuffer()
        ],
        programId,
    );
}

export function getExpenseOnGroup(groupKey: PublicKey, index: number, programId: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [
            utils.bytes.utf8.encode(EXPENSE_SEED),
            groupKey.toBuffer(),
            utils.bytes.utf8.encode(index.toString()),
        ],
        programId,
    );
}