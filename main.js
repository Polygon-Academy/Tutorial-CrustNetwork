const { ethers } = require('ethers')
const fs = require('fs');
const path = require('path');
const { create } = require('ipfs-http-client');
const request = require('request');

const gwEndpoint = 'https://crustipfs.xyz';
const psEndpoint = 'https://pin.crustcode.com'
const filePath = './test.txt';

async function main() {
    // 1. Upload the file through GW
    const authHeader = await getPolygonAuthHeader();
    //console.log(authHeader)
    const cid = await uploadToGW(authHeader);
    // console.log(cid);
    // 2. Pin to Crust through PS
    const rst = await pinToCrust(cid, authHeader);
    console.log(rst);
}

async function getPolygonAuthHeader() {
    const pair = ethers.Wallet.createRandom();
    const sig = await pair.signMessage(pair.address);
    const authHeaderRaw = `eth-${pair.address}:${sig}`;
    const authHeader = Buffer.from(authHeaderRaw).toString('base64')

    return authHeader;
}

async function uploadToGW(h) {
    // 1. Create IPFS instance
    const ipfs = create({
        url: `${gwEndpoint}/api/v0`,
        headers: {
            authorization: `Basic ${h}`
        }
    })

    // 2. Get file content
    const fileContent = await fs.readFileSync(path.resolve(__dirname, filePath));

    // 3. IPFS add through GW
    const { cid } = await ipfs.add(fileContent);

    return cid.toV0().toString();
}

async function pinToCrust(cid, h) {
    const { body } = request.post({
        url: `${psEndpoint}/psa/pins`,
        headers: {
            authorization: `Bearer ${h}`
        },
        json: {
            cid,
            name: 'test.txt'
        }
    });

    return body;
}

main()