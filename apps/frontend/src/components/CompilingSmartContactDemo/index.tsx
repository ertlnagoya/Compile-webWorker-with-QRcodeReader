import React, { useState } from 'react';
import { SimpleStorageContact } from './contract';

const CompilingSmartContractDemo: React.FC = () => {
  const [compileResult, setCompileResult] = useState<string>('');
  const [compiling, setCompiling] = useState(false);

  const compileWithWorker = async (data: any) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker('../../SolcJs.worker.ts', {
        type: 'module',
      });
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
      content: SimpleStorageContact,
    });
    setCompileResult(result as string);
    setCompiling(false);
  };

  return (
    <div>
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
              defaultValue={SimpleStorageContact}
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

export default CompilingSmartContractDemo;
