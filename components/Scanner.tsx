"use client";

import React, { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";

interface ScannerProps {
  onDetected: (result: string) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onDetected }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const initScanner = async () => {
      if (!scannerRef.current) return;

      // Give the DOM a moment to stabilize
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (!isActive) return;

      try {
        await Quagga.init(
          {
            inputStream: {
              type: "LiveStream",
              constraints: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: "environment",
              },
              target: scannerRef.current,
              willReadFrequently: true,
            },
            locator: {
              patchSize: "medium",
              halfSample: true,
            },
            numOfWorkers: navigator.hardwareConcurrency || 2,
            decoder: {
              readers: ["ean_reader"],
            },
            locate: true,
          },
          (err) => {
            if (err) {
              if (isActive) {
                console.error("Quagga init error:", err);
                setError(
                  "カメラの初期化に失敗しました。以前のセッションが残っている可能性があります。",
                );
              }
              return;
            }
            if (isActive) Quagga.start();
          },
        );

        Quagga.onDetected((result) => {
          if (isActive && result?.codeResult?.code) {
            const code = result.codeResult.code;
            console.log("[Scanner] Barcode detected:", code);
            onDetected(code);
            Quagga.stop();
          }
        });
      } catch (err) {
        console.error("Scanner setup failed:", err);
        if (isActive) setError("スキャナーの起動中にエラーが発生しました。");
      }
    };

    initScanner();

    return () => {
      isActive = false;
      Quagga.stop();
      Quagga.offDetected();
    };
  }, [onDetected]);

  return (
    <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
      {error ? (
        <div className="flex items-center justify-center h-full text-white p-4 text-center">
          {error}
        </div>
      ) : (
        <div
          ref={scannerRef}
          className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
        />
      )}
      <div className="absolute inset-0 border-2 border-white/50 pointer-events-none">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 opacity-50" />
      </div>
    </div>
  );
};

export default Scanner;
