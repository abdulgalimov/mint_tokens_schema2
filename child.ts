import {ApiPromise} from "@polkadot/api";
import {KeyringPair} from "@polkadot/keyring/types";
import {SchemaTools} from "@unique-nft/schemas";
import {signAndSend, stringToBytes} from "./utils";

export async function createChildCollection(api: ApiPromise, account: KeyringPair) {
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
        name: stringToBytes('Customizable Puppies - Wearables'),
        description: stringToBytes('Customizable Puppies - Wearables'),
        tokenPrefix: stringToBytes('PUPW'),
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
    console.log(`child collection created: ${collectionId}`);

    return collectionId
}

export async function mintChildToken(api: ApiPromise, account: KeyringPair, collectionId: number) {
    const owner = {Substrate: account.address}

    const encoded = SchemaTools.encode.token({
        schemaName: 'unique',
        schemaVersion: '2.0.0',
        image: 'https://ipfs.unique.network/ipfs/QmSgRndoveoJC4a3gmzfGTJJovk2Wmv8eWhP5JfKce1SWZ/hat2_9.png',
        attributes: [{
            trait_type: 'Color',
            value: 'red'
        },],
        customizing: {
            self: {
                name: 'Main Hat',
                tag: 'hat',
                type: 'image',
                url: 'https://ipfs.unique.network/ipfs/QmSgRndoveoJC4a3gmzfGTJJovk2Wmv8eWhP5JfKce1SWZ/hat2_9.png',
            },
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
    console.log(`child token created: ${tokenId}`);

    return tokenId;
}
