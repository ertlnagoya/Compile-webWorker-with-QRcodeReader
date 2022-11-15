/* ./worker/worker.ts */
import jsqr, { QRCode } from 'jsqr';

export function processData(data: ImageData): QRCode | null {
  // Process the data without stalling the UI
  const qr = jsqr(data.data, data.width, data.height);
  return qr;
}

/*
import "./components/Storage.sol";
import jsqr, { QRCode } from 'jsqr';

const solc = require('solc');
const source = Storage;
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

export function processData(data: ImageData): QRCode {
  // Process the data without stalling the UI
  const qr = jsqr(data.data, data.width, data.height);
  return qr;
}

export function SCcompile():void{
  alert("compile");
  const tempFile = JSON.parse(solc.compile(JSON.stringify(input)));
  const contractFile = tempFile.contracts['Storage.sol']['Storage'];
  alert("ABI:"+ contractFile.abi);
  return(contractFile);
}
*/