import React, { useMemo, useState, useEffect } from 'react';

const MiningDemo: React.FC = () => {
  const [mintResult, setMintResult] = useState({
    nonce: 0,
    hash: '',
  });

  const mintWorker = useMemo(() => {
    return new Worker('../../mint.worker.ts', {
      name: 'Mint',
      type: 'module',
    });
  }, []);

  const handleWebWorkerTask = () => {
    const currentHash = Date.now();
    console.log('Sending : ', currentHash);
    mintWorker.postMessage({
      difficulty: Math.floor(Math.random() * 15),
      transactionHash: Date.now(),
    });
  };

  useEffect(() => {
    mintWorker.onmessage = (event: any) => {
      console.log('from worker event:', event.data);
      setMintResult(event.data);
    };
    return () => {
      mintWorker.terminate();
    };
  }, [mintWorker]);
  return (
    <div>
      <h2>Mining with WebWorker</h2>
      <button className="resource flex" onClick={handleWebWorkerTask}>
        Mint with WebWorker
      </button>
      <div>
        <h4>Mint result:</h4>
        <textarea
          value={JSON.stringify(mintResult, null, 4)}
          onChange={() => null}
          style={{
            width: '600px',
            height: '60px',
          }}
        ></textarea>
      </div>
    </div>
  );
};

export default MiningDemo;
