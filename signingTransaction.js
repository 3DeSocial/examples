import {NextRequest, NextResponse } from 'next/server';

import DesoServices from '../../services/DesoServices.mjs';   // DesoServices is a class that contains all the API calls to the DeSo node
import { signTx } from '../../services/identity/crypto-utils.js';
import { submitPost } from 'deso-protocol';

/*
 Backend API endpoints
 */
 const api = process.env.DESO_API_BASE_URL;
 const apiAuthorize = "/authorize-derived-key";
 const apiSubmit = "/submit-transaction";
 

 export async function GET(request) {
  const content = request.nextUrl.searchParams.get("content");
  let text = await content;
    let response = submitTestPostIdentity(text);
    return submitTestPostIdentity(response);
  }

const submitTestPostIdentity = async (content) => {
    let postBody = 'test post: '+Date.now().toString()+'\n'+content;
    const params = {
			UpdaterPublicKeyBase58Check: publicKey,
			BodyObj: {
        IsHidden: true,
				Body: postBody,
				ImageURLs: [],
				VideoURLs: [],
			}
		};

   let res = await DesoServices.submitPost(params);
      // console.log('submitPost: ', res);
       const txnHex = res.data.TransactionHex;
       const derivedTxnHex = await appendDerivedKey(txnHex,derivedPublicKey);
       const signedTransaction = await signTx(derivedTxnHex, derivedSeedHex);
     
      return submitTransaction(signedTransaction);
   
  }

  async function appendDerivedKey(transactionHex,derivedPublicKey){

    if(transactionHex){
        //prep transaction
        //const payload = getUserPayLoad();

       // const hexKey = stringToHex(payload.derivedPublicKey);

        //console.log(hexKey);

        const extraData ={
            "TransactionHex":transactionHex,
            "ExtraData":{
                "DerivedPublicKey":derivedPublicKey
            }
        }

        const reqExtra= await fetch('https://node.deso.org/api/v0/append-extra-data',{
            method:'POST',
            headers: { 'Content-Type': 'application/json' },
            body:JSON.stringify(extraData)
        })

        if(reqExtra){
            const resExtra = await reqExtra.json();

            if(resExtra.TransactionHex){
                return resExtra.TransactionHex;
            }
        }
    }
    return null;
}

const submitTransaction = async (signedTransaction) => {
  const submitTransactionPayload = {
    TransactionHex : signedTransaction
  }

  try {
    const res = await fetch("https://node.deso.org/api/v0/submit-transaction", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
    },
      body: JSON.stringify(submitTransactionPayload)
    })    
    const json = await res.json();
    // Handle successful response here
    console.log('successfull response');
    console.log(json);
    console.log(submitTransactionPayload);
    return NextResponse.json(
  
      {
        body: 'success',
        submitTransactionPayload: submitTransactionPayload,
        res: json
      },
      {
        status: 200,
      },
    );    
  } catch (error) {
    // Handle error here
    console.log('Error HERe ');
    console.error(error);
    console.log('FULL RESPONSE');

   // console.log(res);
  return NextResponse.json(

    {
      body: 'error'
    },
    {
      status: 200,
    },
  );
  }  
}