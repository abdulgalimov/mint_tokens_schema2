import {ApiPromise} from "@polkadot/api";
import {KeyringPair} from "@polkadot/keyring/types";
import {SchemaTools} from "@unique-nft/schemas";
import {signAndSend, stringToBytes} from "./utils";

export async function createParentCollection(api: ApiPromise, account: KeyringPair) {
    const collectionData = SchemaTools.encode.collection({
        schemaName: 'unique',
        schemaVersion: '2.0.0',
        cover_image: {
            url: 'https://ipfs.unique.network/ipfs/QmTudjdHYuvFPQGdmVSZAnU5sgvdmRKNAtRM6Z7Uzr5SBW/collection_cover-min.png'
        },
    }, {
        overwriteProperties: []
    })

    const result = await signAndSend(api.tx.unique.createCollectionEx({
        name: stringToBytes('Customizable Puppies'),
        description: stringToBytes('Customizable Puppies'),
        tokenPrefix: stringToBytes('PUPP'),
        permission: {
            nesting: {
                tokenOwner: true,
                collectionAdmin: true,
            }
        },
        properties: collectionData.collectionProperties.map(({key, valueHex}) => ({key, value: valueHex})),
        tokenPropertyPermissions: collectionData.tokenPropertyPermissions,
    }), account)

    const event = result.events.find(e => e.event.data.method === 'CollectionCreated')?.event;
    const collectionIdStr = event.data[0].toJSON()

    const collectionId = parseInt(collectionIdStr as string || '');
    console.log(`parent collection created: ${collectionId}`);

    return collectionId
}

export async function mintParentToken(
    api: ApiPromise,
    account: KeyringPair,
    collectionId: number,
    hatCollectionId: number
) {
    const owner = {Substrate: account.address}

    const encoded = SchemaTools.encode.token({
        schemaName: 'unique',
        schemaVersion: '2.0.0',
        image: 'https://ipfs.unique.network/ipfs/QmZ1JjPzuyjJuggu34xNvL1X6kp17ArYAhrVxnDJD253i2/B9_E9_Y3_YB9_YF3_I2_T1_MM9.png',
        attributes: [{
            trait_type: 'Color',
            value: 'red'
        },],
        customizing: {
            self: {
                name: 'Main Character',
                tag: 'character',
                type: 'image',
                url: 'https://ipfs.unique.network/ipfs/QmZ1JjPzuyjJuggu34xNvL1X6kp17ArYAhrVxnDJD253i2/B9_E9_Y3_YB9_YF3_I2_T1_MM9.png',
            },
            slots: {
                hat: {
                    collections: [hatCollectionId],
                    type: 'image',
                    image_overlay_specs: {
                        parent_mount_point: {
                            x: 0,
                            y: 0,
                        },
                    },
                }
            }
        }
    }, {
        overwriteProperties: []
    })

    const tokenData = {
        NFT: {
            properties: encoded.map(v => ({
                key: v.key,
                value: v.valueHex
            }))
        }
    };

    const result = await signAndSend(api.tx.unique.createItem(collectionId, owner, tokenData), account)

    const tokenId = result.events.find(e => e.event.data.method === 'ItemCreated')?.event.data[1].toPrimitive()
    console.log(`parent token created: ${tokenId}`);

    return tokenId;
}
