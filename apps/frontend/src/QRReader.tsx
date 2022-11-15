import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled, { keyframes} from 'styled-components';
import Worker from './worker';
import { QRCode } from 'jsqr';
export type { QRCode } from 'jsqr';


export type QRReaderProps = {
  width?: number,
  height?: number,
  pause?: boolean,
  showQRFrame?: boolean,
  timerInterval?: number,
  scanAreaRatio?: number, // カメラ領域に対するスキャン領域の割合(0-100) 
  gecognizeCallback?: (e: QRCode) => void,
}

type Point = {
  x: number;
  y: number;
}

type OverlayPosition = {
  top: number,
  left: number,
  width: number,
  height: number,
}

// 外枠。カメラ領域と、スキャン中を示すバーを重ねて表示するためrelative指定
const RelativeWrapperDiv = styled.div<QRReaderProps>`
  position: relative;
  width : ${(props) => props.width}px;
  height: ${(props) => props.height}px;
`;

// カメラ表示領域
const VideoArea = styled.video`
  position: absolute; 
  z-index : -100;
`;

// 認識したQRコードを囲う赤枠
const OverlayDiv = styled.div<OverlayPosition>`
  position: absolute; 
  border: 1px solid #F00;
  top   : ${(props) => props.top}px;
  left  : ${(props) => props.left}px;
  width : ${(props) => props.width}px;
  height: ${(props) => props.height}px;
`;

// スキャン可能エリア表示
//  ・borderを半透明(灰色)にして、中央部だけスキャンができることを目立たせる
const QRScanArea = styled.div<QRReaderProps>`
  position: absolute;
  box-sizing: border-box;
  height:  ${(props) => props.height}px;
  width :  ${(props) => props.width}px;
  border-left:   ${(props) => (props!.width as number)  * ((100 - (props!.scanAreaRatio as number)) / 2) / 100 }px solid rgb(0,0,0,0.3);
  border-right:  ${(props) => (props!.width as number)  * ((100 - (props!.scanAreaRatio as number)) / 2) / 100 }px solid rgb(0,0,0,0.3);
  border-top:    ${(props) => (props!.height as number) * ((100 - (props!.scanAreaRatio as number)) / 2) / 100 }px solid rgb(0,0,0,0.3);
  border-bottom: ${(props) => (props!.height as number) * ((100 - (props!.scanAreaRatio as number)) / 2) / 100 }px solid rgb(0,0,0,0.3);
`;

// 緑色のバーを上下させるためのkeyframe(cssアニメーション)
// keyframesに引数を渡すため、keyframeを返すアロー関数として定義する
const QRScanerFrames = (ratio: number) => keyframes`
  from {
    height: ${(100 - ratio) / 2}%;
  }
  to {
    height: ${ratio + (100 - ratio) / 2}%;
  }
`;

// スキャン可能領域を上下する緑色のバー(スキャン中であることを明示する目的)
const QRScanerBar = styled.div<{state: 'paused'|'running'} & QRReaderProps>`
  position: absolute;
  animation: ${(props) => QRScanerFrames(props!.scanAreaRatio as number)} infinite  1300ms alternate both ease-in-out ${(props) => props.state};
  border-bottom: 3px solid #0F0;
  left: ${(props) => (100 - (props!.scanAreaRatio as number)) / 2}%;
  width : ${(props) => props.scanAreaRatio}%;
`;

// QRコード認識コンポーネント
const QRReader: React.FC<QRReaderProps> = (props) => {
  const [overlay, setOverlay] = useState({ top:0, left: 0, width: 0, height: 0 }); 
  // DOMオブジェクト(video)を参照するためuseRef()を使用する
  const video = useRef(null as unknown as HTMLVideoElement);
  const timerId = useRef(null);
  
  // QR認識処理をバックグラウンドで処理するためのWorker(レンダリング毎に生成するのを防ぐためメモ化)
  const worker = useMemo(() =>  new Worker(), [])

  // QR認識枠を表示する
  const drawRect = (topLeft: Point, bottomRight: Point, scanArea?: OverlayPosition) => {
    setOverlay({
      top:  (topLeft.y < bottomRight.y ? topLeft.y : bottomRight.y) + (scanArea!.top as number) ?? 0,
      left: (topLeft.x < bottomRight.x ? topLeft.x :bottomRight.x) + (scanArea!.left as number) ?? 0,
      width: Math.abs(bottomRight.x - topLeft.x),
      height: Math.abs(bottomRight.y - topLeft.y),
    });
  };

  useEffect(() => {
    (async() => {
      if (props.pause) {
        video.current.pause();
        if (timerId.current) {
//          clearInterval(timerId.current);
          timerId.current = null;
        }
        return;
      }

      const { width, height } = props;

      const constraints = { 
        audio: false, 
        video: {
          facingMode: 'environment', 
          width, 
          height, 
      }};
    
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.current.srcObject = stream;
      video.current.play();
  
      const canvas = new OffscreenCanvas((width as number), (height as number));
      const context = canvas.getContext('2d');

      // QR認識領域を計算(幅*scanAreaRatioの領域をcenterに表示)
      const tlRatio = (100 - (props!.scanAreaRatio as number)) / 2 / 100;
      const ratio = (props!.scanAreaRatio as number)/ 100;
      const scanArea = { top: (height as number) * tlRatio, left: (width as number) * tlRatio, width: (width as number)* ratio, height: (height as number) * ratio};

      if (!timerId.current) {
        (timerId.current as unknown as number) = window.setInterval(() => {
          // video領域から中央を切り抜いて画像化(位置は全体に対するscanAreaRatioの比率で計算)
          if (context) {
            context.drawImage(video.current, (scanArea.left as number), (scanArea.top as number), (scanArea.width as number), 
                             (scanArea.height as number), 0, 0, (scanArea.width as number), (scanArea.height as number));
            const imageData = context.getImageData(0, 0, scanArea.width, scanArea.height);
          
            // QRコード認識処理はWeb Workerに移譲(バックグラウンドスレッドで実行)
            worker.processData(imageData).then((qr: QRCode) => {
            if (qr) {
              console.log(qr.data);
              if (props.showQRFrame) {
                drawRect(qr.location.topLeftCorner, qr.location.bottomRightCorner, scanArea);
              }
              // 認識後コールバック
              if (props.gecognizeCallback) props.gecognizeCallback(qr);               
              }
            })
          }
        }, props.timerInterval);
      }
      var ret = null;
      if (timerId.current) {
        ret = clearInterval((timerId.current as unknown as number));
      }
      return ret;      
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]);

  return (
    <RelativeWrapperDiv {...props}>
      <VideoArea ref={video} />
      <OverlayDiv  {...overlay} />
      <QRScanArea  {...props} />
      <QRScanerBar {...{state: (props.pause? 'paused': 'running'), ...props}} />
    </RelativeWrapperDiv> 
  );
}

// propsのデフォルト値を設定
QRReader.defaultProps = {
  width: 500,
  height: 500,
  pause: false,
  showQRFrame: true,
  timerInterval: 300,
  scanAreaRatio: 70,
};

export default QRReader;
