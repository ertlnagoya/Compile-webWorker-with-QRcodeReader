//import React, { Component, useEffect,useMemo, } from "react";
import "./components/Storage.sol";
import Worker from './worker';
//export type { Compile } from './compile';
//import solcjs from "solc-js";
//const solcjs = require('solc-js');
const solc = require("solc");
const source = Storage;
const worker = Worker;
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

worker.SCcompile = async () => {
   //alert("compile");
   const tempFile = JSON.parse(solc.compile(JSON.stringify(input)));
   const contractFile = tempFile.contracts['Storage.sol']['Storage'];
   alert("ABI:"+ contractFile.abi);
   return(contractFile);
};

function Compile() {
	return (
		<div className="Compile">
			<h1>Compile機能</h1>
            <button onClick={worker.SCcompile}>SCcompile</button><br />
		</div>
	);
};

export default Compile;