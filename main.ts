import {createParentCollection, mintParentToken} from "./parent";
import {createChildCollection, mintChildToken} from "./child";
import {chainInfo, createApi} from "./api";





async function main(): Promise<void> {
    const [api, alice] = await createApi(chainInfo.unq);

    const parentCollectionId = await createParentCollection(api, alice);
    // const childCollectionId = await createChildCollection(api, alice);

    // const parentTokenId = await mintParentToken(api, alice, parentCollectionId, childCollectionId);
    // const childTokenId = await mintChildToken(api, alice, childCollectionId);
}

main()
