import React, { useState } from 'react';
//import React, { Component, useEffect,useMemo, } from "react";
import "./components/Storage.sol";
import Worker from './worker';
//export type { Compile } from './compile';
//import solcjs from "solc-js";
//const solcjs = require('solc-js');
const solc = require("solc");
const source = Storage;
//const worker = Worker;
//const worker = useMemo(() =>  new Worker(), [])

const input = {
    language: 'Solidity',
    sources: {
       'Storage.sol': {
          content: source,
       },
    },
    settings: {
       outputSelection: {
          '*': {
             '*': ['*'],
          },
       },
    },
};

/*
worker.SCcompile = async () => {
   //alert("compile");
   const tempFile = JSON.parse(solc.compile(JSON.stringify(input)));
   const contractFile = tempFile.contracts['Storage.sol']['Storage'];
   alert("ABI:"+ contractFile.abi);
   return(contractFile);
};
*/

const Compile: React.FC = () => {
   const [compileResult, setCompileResult] = useState<string>('');
   const [compiling, setCompiling] = useState(false);

   const compileWithWorker = async (data: any) => {
   return new Promise((resolve, reject) => {
   //    const worker = new Worker('../../SolcJs.worker.ts', {type: 'module'});
         const worker = new Worker;

      worker.postMessage(data);
      worker.onmessage = function (event: any) {
         resolve(event.data);
      };
      worker.onerror = reject;
   });
   };

   const handleCompile = async () => {
      setCompiling(true);
      const result = await compileWithWorker({
   //     content: SimpleStorageContact,
         content: JSON.stringify(input)
      });
      setCompileResult(result as string);
      setCompiling(false);
   };


   return (
      <div className="Compile">
   
         

            <h2>Compiling Solidity Contract with WebWorker</h2>
      <div
      style={{
         display: 'flex',
         justifyContent: 'space-between',
         alignItems: 'center',
      }}
      >
      <div>
         <h3>SmartContract</h3>
         <div>
            <textarea
            // defaultValue={SimpleStorageContact}
            defaultValue={JSON.stringify(input)}
            style={{
               width: '400px',
               height: '300px',
            }}
            ></textarea>
         </div>
      </div>
      <div
         style={{
            padding: '1em',
         }}
      >
         <button
            className="resource flex"
            onClick={handleCompile}
            disabled={compiling}
         >
            {compiling ? 'Compiling' : 'Compile'}
         </button>
      </div>
      <div>
         <h3>Compiled Result</h3>
         <div>
            <textarea
            defaultValue={compileResult}
            style={{
               width: '400px',
               height: '300px',
            }}
            ></textarea>
         </div>
      </div>
      </div>

      </div>
   );
};

export default Compile;
