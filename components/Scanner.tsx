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
              // Only scan the horizontal middle section (vertical center)
              area: {
                top: "30%",
                right: "10%",
                left: "10%",
                bottom: "30%",
              },
            },
            locator: {
              patchSize: "medium",
              halfSample: true,
            },
            numOfWorkers: navigator.hardwareConcurrency || 2,
            decoder: {
              readers: ["ean_reader"],
              multiple: false, // Don't try to find multiple barcodes
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

        let lastResult: string | null = null;
        let count = 0;

        Quagga.onDetected((result) => {
          if (isActive && result?.codeResult?.code) {
            const code = result.codeResult.code;

            // Only care about 13 digit EANs (ISBNs)
            if (code.length !== 13) return;

            // Consistency check: Need the same result multiple times to confirm
            if (code === lastResult) {
              count++;
            } else {
              lastResult = code;
              count = 0;
            }

            if (count >= 5) {
              console.log("[Scanner] Confirmed barcode:", code);
              onDetected(code);
              // reset for next scan if component stays mounted
              lastResult = null;
              count = 0;
            }
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
    <div className="relative w-full h-80 bg-black rounded-lg overflow-hidden">
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
      {/* Visual Guide Box */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[80%] h-[40%] border-2 border-indigo-500 rounded-lg shadow-[0_0_0_1000px_rgba(0,0,0,0.5)]">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 opacity-70" />
        </div>
        <p className="absolute bottom-6 text-white text-[10px] font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
          この枠内にバーコードを合わせてください
        </p>
      </div>
    </div>
  );
};

export default Scanner;
