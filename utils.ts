import {SubmittableResult} from "@polkadot/api";
import {SubmittableExtrinsic} from "@polkadot/api/promise/types";
import {KeyringPair} from "@polkadot/keyring/types";
import {ISubmittableResult} from "@polkadot/types/types";

export enum TransactionStatus {
    NOT_READY = 'NOT_READY',
    FAIL = 'FAIL',
    SUCCESS = 'SUCCESS'
}

export const getTransactionStatus = ({events, status}: SubmittableResult): TransactionStatus => {
    if (status.isReady || status.isBroadcast) {
        return TransactionStatus.NOT_READY
    }

    if (status.isInBlock || status.isFinalized) {
        if (events.find(e => e.event.data.method === 'ExtrinsicFailed')) {
            return TransactionStatus.FAIL
        }
        if (events.find(e => e.event.data.method === 'ExtrinsicSuccess')) {
            return TransactionStatus.SUCCESS
        }
    }

    return TransactionStatus.FAIL
}

export const signAndSend = async <T extends SubmittableExtrinsic>(tx: T, account: KeyringPair) => {
    return new Promise<ISubmittableResult>(async (resolve, reject) => {
        let unsub = await tx.signAndSend(account, txResult => {
            const status = getTransactionStatus(txResult)

            if (status === TransactionStatus.SUCCESS) {
                unsub()
                resolve(txResult)
            } else if (status === TransactionStatus.FAIL) {
                let errMessage = ''

                if (txResult.dispatchError?.isModule) {
                    // for module errors, we have the section indexed, lookup
                    const decoded = tx.registry.findMetaError(txResult.dispatchError.asModule)
                    const {docs, name, section} = decoded
                    errMessage = `${section}.${name}: ${docs.join(' ')}`
                } else {
                    // Other, CannotLookup, BadOrigin, no extra info
                    errMessage = txResult.dispatchError?.toString() || 'Unknown error'
                }

                unsub()
                reject(new Error(errMessage))
            }
        })
    })
}

export const stringToBytes = (str: string): number[] => {
    return str.split('').map(char => char.charCodeAt(0))
}
